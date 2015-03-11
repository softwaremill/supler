package org.supler.field

import org.json4s.JsonAST.{JField, JObject, JValue}
import org.json4s._
import org.supler.validation.{PartiallyAppliedObj, ValidationScope}
import org.supler.{FieldPath, FormWithObject}

case class ModalField[T](
                          name: String,
                          form: T => FormWithObject[_],
                          label: Option[String],
                          enabledIf: T => Boolean,
                          includeIf: T => Boolean) extends Field[T] {
  override private[supler] def applyFieldJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]) =
    PartiallyAppliedObj.full(obj)

  override private[supler] def generateFieldJSON(parentPath: FieldPath, obj: T) = {
    import JSONFieldNames._

    JObject(List(
      JField(Label, JString(label.getOrElse(""))),
      JField(Type, JString(SpecialFieldTypes.Modal)),
      JField(Path, JString(parentPath.append(name).toString))
    ))
  }

  override private[supler] def doValidate(parentPath: FieldPath, obj: T, scope: ValidationScope) = Nil

  def label(newLabel: String): ModalField[T] = this.copy(label = Some(newLabel))

  def enabledIf(condition: T => Boolean): ModalField[T] = this.copy(enabledIf = condition)

  def includeIf(condition: T => Boolean): ModalField[T] = this.copy(includeIf = condition)

  override private[supler] def findModal(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue])
    : Option[ShowableModal] = {
    if (jsonFields.get(name) == Some(JBool(value = true))) {
      Some(ShowableModal(parentPath.append(name), form(obj)))
    } else {
      None
    }
  }
}
