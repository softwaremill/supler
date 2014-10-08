package org.supler

import org.json4s.JsonAST.{JArray, JString, JObject, JField}
import org.json4s._
import org.supler.errors.FieldPath

case class SubformField[T, U](
  name: String,
  read: T => List[U],
  write: (T, List[U]) => T,
  _label: Option[String],
  embeddedForm: Form[U],
  createEmpty: () => U,
  renderHint: SubformRenderHint) extends Field[T, List[U]] {

  def label(newLabel: String) = this.copy(_label = Some(newLabel))

  def renderHint(newRenderHint: SubformRenderHint) = this.copy(renderHint = newRenderHint)

  def generateJSON(obj: T) = List(JField(name, JObject(
    JField(TypeField, JString(SubformType)),
    JField(RenderHintField, JObject(JField("name", JString(renderHint.name)))),
    JField(MultipleField, JBool(value = true)),
    JField(LabelField, JString(_label.getOrElse(""))),
    JField(ValueField, JArray(read(obj).map(embeddedForm.generateJSON)))
  )))

  override def applyJSONValues(obj: T, jsonFields: Map[String, JValue]) = {
    val vs = for {
      JArray(formJValues) <- jsonFields.get(name).toList
      formJValue <- formJValues
    } yield {
      embeddedForm.applyJSONValues(createEmpty(), formJValue)
    }

    write(obj, vs)
  }

  override def doValidate(parentPath: FieldPath, obj: T) = read(obj).zipWithIndex.flatMap { case (el, i) =>
    embeddedForm.doValidate(parentPath.appendWithIndex(name, i), el)
  }
}

sealed abstract class SubformRenderHint(val name: String)
case object SubformTableRenderHint extends SubformRenderHint("table")
case object SubformListRenderHint extends SubformRenderHint("list")
