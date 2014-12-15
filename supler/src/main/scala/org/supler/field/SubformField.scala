package org.supler.field

import org.json4s._
import org.supler.errors.ValidationMode._
import org.supler.errors._
import org.supler.{Util, Form}

case class SubformField[T, U](
  name: String,
  read: T => List[U],
  write: (T, List[U]) => T,
  _label: Option[String],
  embeddedForm: Form[U],
  // if not specified, `embeddedForm.createEmpty` will be used
  createEmpty: Option[() => U],
  renderHint: RenderHint with SubformFieldCompatible) extends Field[T] {

  def label(newLabel: String) = this.copy(_label = Some(newLabel))

  def renderHint(newRenderHint: RenderHint with SubformFieldCompatible) = this.copy(renderHint = newRenderHint)

  def generateJSON(parentPath: FieldPath, obj: T) = {
    import JSONFieldNames._
    List(JField(name, JObject(
      JField(Type, JString(SpecialFieldTypes.Subform)),
      JField(RenderHint, JObject(JField("name", JString(renderHint.name)) :: renderHint.extraJSON)),
      JField(Multiple, JBool(value = true)),
      JField(Label, JString(_label.getOrElse(""))),
      JField(Path, JString(parentPath.append(name).toString)),
      JField(Value, JArray(read(obj).zipWithIndex.map { case (v, i) =>
        embeddedForm.generateJSON(parentPath.appendWithIndex(name, i), v)
      }))
    )))
  }

  override def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): PartiallyAppliedObj[T] = {
    val paos = for {
      JArray(formJValues) <- jsonFields.get(name).toList
      (formJValue, i) <- formJValues.zipWithIndex
    } yield {
      embeddedForm.applyJSONValues(parentPath.appendWithIndex(name, i),
        createEmpty.getOrElse(embeddedForm.createEmpty)(), formJValue)
    }

    PartiallyAppliedObj.flatten(paos).map(write(obj, _))
  }

  override def doValidate(parentPath: FieldPath, obj: T, mode: ValidationMode) =
    read(obj).zipWithIndex.flatMap { case (el, i) =>
      embeddedForm.doValidate(parentPath.appendWithIndex(name, i), el, mode)
    }

  override def runAction(obj: T, jsonFields: Map[String, JValue], ctx: RunActionContext): CompleteActionResult = {
    val values = read(obj)

    val valuesJValuesIndex = (for {
      JArray(formJValues) <- jsonFields.get(name).toList
    } yield values.zip(formJValues).zipWithIndex).flatten

    Util
      .findFirstMapped[((U, JValue), Int), CompleteActionResult](valuesJValuesIndex, { case ((v, jvalue), i) =>
        val updatedCtx = ctx.push(obj, i, (v: U) => write(obj, values.updated(i, v)))
        // assuming that the values matches the json (that is, that the json values were previously applied)
        embeddedForm.runAction(values(i), jvalue, updatedCtx)
      },
      _ != NoActionResult)
      .getOrElse(super.runAction(obj, jsonFields, ctx))
  }
}
