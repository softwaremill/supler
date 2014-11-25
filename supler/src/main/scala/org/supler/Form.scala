package org.supler

import org.json4s.JsonAST.JObject
import org.json4s._
import org.supler.errors._

case class Form[T](rows: List[Row[T]]) {
  def apply(obj: T): FormWithObject[T] = InitialFormWithObject(this, obj)

  private[supler] def doValidate(parentPath: FieldPath, obj: T): FieldErrors =
    rows.flatMap(_.doValidate(parentPath, obj))

  private[supler] def generateJSON(obj: T) = JObject(
    JField("fields", JObject(rows.flatMap(_.generateJSON(obj))))
  )

  private[supler] def applyJSONValues(parentPath: FieldPath, obj: T, jvalue: JValue): PartiallyAppliedObj[T] = {
    jvalue match {
      case JObject(jsonFields) => Row.applyJSONValues(rows, parentPath, obj, jsonFields.toMap)
      case _ => PartiallyAppliedObj.full(obj)
    }
  }

  def +(row: Row[T]) = ++(List(row))

  def ++(moreRows: List[Row[T]]) = Form(rows ++ moreRows)
}
