package org.supler

import org.json4s.JsonAST.{JField, JObject}
import org.json4s._
import org.supler.errors._

case class Form[T](rows: List[Row[T]]) {
  def doValidate(obj: T): Option[FormErrors] = {
    val fe = doValidate(EmptyPath, obj)
    if (fe.size > 0) Some(FormErrors(fe)) else None
  }

  private[supler] def doValidate(parentPath: FieldPath, obj: T): FieldErrors =
    rows.flatMap(_.doValidate(parentPath, obj))

  def generateJSON(obj: T) = {
    JObject(
      JField("fields", JObject(rows.flatMap(_.generateJSON(obj))))
    )
  }

  def applyValuesFromJSON(obj: T, jvalue: JValue): Either[FormErrors, T] =
    applyValuesFromJSON(EmptyPath, obj, jvalue).left.map(FormErrors)

  private[supler] def applyValuesFromJSON(parentPath: FieldPath, obj: T, jvalue: JValue): Either[FieldErrors, T] = {
    jvalue match {
      case JObject(jsonFields) => Row.applyValuesFromJSON(rows, parentPath, obj, jsonFields.toMap)
      case _ => Right(obj)
    }
  }

  def applyValuesFromJSONAndValidate(obj: T, jvalue: JValue): Either[FormErrors, T] = {
    applyValuesFromJSON(obj, jvalue) match {
      case right@Right(appliedObj) =>
        doValidate(appliedObj) match {
          case None => right
          case Some(errors) => Left(errors)
        }
      case left => left
    }
  }

  def +(row: Row[T]) = ++(List(row))

  def ++(moreRows: List[Row[T]]) = Form(rows ++ moreRows)
}
