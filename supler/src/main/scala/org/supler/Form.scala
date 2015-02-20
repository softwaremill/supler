package org.supler

import org.json4s.JsonAST.JObject
import org.json4s._
import org.supler.field._
import org.supler.validation._

case class Form[T](rows: List[Row[T]], createEmpty: () => T) {
  def apply(obj: T): FormWithObject[T] = InitialFormWithObject(this, obj, None, Meta(Map()))

  def withNewEmpty: FormWithObject[T] = InitialFormWithObject(this, createEmpty(), None, Meta(Map()))

  def getMeta(jvalue: JValue): Meta = Meta.fromJSON(jvalue)

  private[supler] def doValidate(parentPath: FieldPath, obj: T, scope: ValidationScope): FieldErrors =
    rows.flatMap(_.doValidate(parentPath, obj, scope))

  private[supler] def generateJSON(parentPath: FieldPath, obj: T): JValue = JObject(
    JField("fields", JObject(rows.flatMap(_.generateJSON(parentPath, obj))))
  )

  private[supler] def applyJSONValues(parentPath: FieldPath, obj: T, jvalue: JValue): PartiallyAppliedObj[T] = {
    jvalue match {
      case JObject(jsonFields) => Row.applyJSONValues(rows, parentPath, obj, jsonFields.toMap)
      case _ => PartiallyAppliedObj.full(obj)
    }
  }

  /**
   * Finds the action specified in the given json (`jvalue`), if any. The action finding and action running has to be
   * separated, so that after the action is found, validation of the correct scope can be run (e.g. the whole form),
   * and only then the action can be executed.
   */
  private[supler] def findAction(parentPath: FieldPath, obj: T, jvalue: JValue, ctx: RunActionContext): Option[RunnableAction] = {
    jvalue match {
      case JObject(jsonFields) => Row.findFirstAction(parentPath, rows, obj, jsonFields.toMap, ctx)
      case _ => None
    }
  }

  def useCreateEmpty(newCreateEmpty: => T) = this.copy(createEmpty = () => newCreateEmpty)

  def +(row: Row[T]) = ++(List(row))

  def ++(moreRows: List[Row[T]]) = Form(rows ++ moreRows, createEmpty)
}
