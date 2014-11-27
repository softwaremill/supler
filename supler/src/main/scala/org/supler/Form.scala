package org.supler

import org.json4s.JsonAST.JObject
import org.json4s._
import org.supler.errors.ValidationMode._
import org.supler.errors._

case class Form[T](rows: List[Row[T]], createEmpty: () => T) {
  def apply(obj: T): FormWithObject[T] = InitialFormWithObject(this, obj)

  private[supler] def doValidate(parentPath: FieldPath, obj: T, mode: ValidationMode): FieldErrors =
    rows.flatMap(_.doValidate(parentPath, obj, mode))

  private[supler] def generateJSON(parentPath: FieldPath, obj: T) = JObject(
    JField("fields", JObject(rows.flatMap(_.generateJSON(parentPath, obj))))
  )

  private[supler] def applyJSONValues(parentPath: FieldPath, obj: T, jvalue: JValue): PartiallyAppliedObj[T] = {
    jvalue match {
      case JObject(jsonFields) => Row.applyJSONValues(rows, parentPath, obj, jsonFields.toMap)
      case _ => PartiallyAppliedObj.full(obj)
    }
  }

  def useCreateEmpty(newCreateEmpty: => T) = this.copy(createEmpty = () => newCreateEmpty)

  def +(row: Row[T]) = ++(List(row))

  def ++(moreRows: List[Row[T]]) = Form(rows ++ moreRows, createEmpty)
}
