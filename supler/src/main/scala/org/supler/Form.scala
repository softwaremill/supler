package org.supler

import org.json4s.JsonAST.JObject
import org.json4s._
import org.supler.errors._
import org.supler.field._

case class Form[T](rows: List[Row[T]], createEmpty: () => T) {
  def apply(obj: T): FormWithObject[T] = InitialFormWithObject(this, obj)

  def withNewEmpty: FormWithObject[T] = InitialFormWithObject(this, createEmpty())

  private[supler] def doValidate(parentPath: FieldPath, obj: T, scope: ValidationScope): FieldErrors =
    rows.flatMap(_.doValidate(parentPath, obj, scope))

  private[supler] def generateJSON(parentPath: FieldPath, obj: T) = JObject(
    JField("fields", JObject(rows.flatMap(_.generateJSON(parentPath, obj))))
  )

  private[supler] def applyJSONValues(parentPath: FieldPath, obj: T, jvalue: JValue): PartiallyAppliedObj[T] = {
    jvalue match {
      case JObject(jsonFields) => Row.applyJSONValues(rows, parentPath, obj, jsonFields.toMap)
      case _ => PartiallyAppliedObj.full(obj)
    }
  }

  private[supler] def runAction(obj: T, jvalue: JValue, ctx: RunActionContext): CompleteActionResult = {
    jvalue match {
      case JObject(jsonFields) => Row.runActionsUntilResult(rows, obj, jsonFields.toMap, ctx)
      case _ => NoActionResult
    }
  }

  def useCreateEmpty(newCreateEmpty: => T) = this.copy(createEmpty = () => newCreateEmpty)

  def +(row: Row[T]) = ++(List(row))

  def ++(moreRows: List[Row[T]]) = Form(rows ++ moreRows, createEmpty)
}
