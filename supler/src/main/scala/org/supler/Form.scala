package org.supler

import org.json4s.JsonAST.{JField, JObject}
import org.json4s._
import org.supler.validation.{FormValidationResult, FieldValidationError, EmptyPath, FieldPath}

case class Form[T](rows: List[Row[T]]) {
  def doValidate(obj: T): FormValidationResult = FormValidationResult(doValidate(EmptyPath, obj))

  def doValidate(parentPath: FieldPath, obj: T): List[FieldValidationError] = rows.flatMap(_.doValidate(parentPath, obj))

  def generateJSON(obj: T) = {
    JObject(
      JField("fields", JObject(rows.flatMap(_.generateJSON(obj))))
    )
  }

  def applyJSONValues(obj: T, jvalue: JValue): T = {
    jvalue match {
      case JObject(jsonFields) =>
        rows.foldLeft(obj)((currentObj, row) => row.applyJSONValues(currentObj, jsonFields.toMap))
      case _ => obj
    }
  }

  def +(row: Row[T]) = ++(List(row))

  def ++(moreRows: List[Row[T]]) = Form(rows ++ moreRows)
}
