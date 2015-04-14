package org.supler

import org.json4s.JsonAST.JObject
import org.json4s._
import org.supler.field._
import org.supler.validation._

case class Form[T](rows: List[Row[T]], createEmpty: () => T) {
  requireFieldsUnique()

  def apply(obj: T): FormWithObject[T] = InitialFormWithObject(this, obj, None, FormMeta(Map()))

  def withNewEmpty: FormWithObject[T] = InitialFormWithObject(this, createEmpty(), None, FormMeta(Map()))

  def getMeta(jvalue: JValue): FormMeta = FormMeta.fromJSON(jvalue)

  private[supler] def doValidate(parentPath: FieldPath, obj: T, scope: ValidationScope): FieldErrors =
    rows.flatMap(_.doValidate(parentPath, obj, scope))

  private[supler] def generateJSON(parentPath: FieldPath, obj: T): JValue = {
    val rowsJSONs = rows.map(_.generateJSON(parentPath, obj))
    JObject(
      JField("fields", JArray(rowsJSONs.flatMap(_.fields))),
      JField("fieldOrder", JArray(rowsJSONs.map(_.fieldOrderAsJSON)))
    )
  }

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

  private[supler] def findModal(parentPath: FieldPath, obj: T, jvalue: JValue) = {
    jvalue match {
      case JObject(jsonFields) => Row.findFirstModal(parentPath, rows, obj, jsonFields.toMap)
      case _ => None
    }
  }

  private[supler] def findFieldAndObjectByPath(fieldPath: String, parentObj: T): Option[(Field[_], Any)] = {
    val parsedPath = FieldPath.parse(fieldPath)
    parsedPath.findFieldAndObject(this, parentObj.asInstanceOf[AnyRef])
  }

  private def requireFieldsUnique() {
    val fieldsUsedMultipletimes = rows.flatMap {
      case MultiFieldRow(fields) => fields
      case f: Field[_] => List(f)
      case _ => Nil
    }.groupBy(f => f.name).filter(_._2.size > 1).map(_._1)

    require(fieldsUsedMultipletimes.isEmpty,
      "Supler does not support same field multiple times on a form, but those were used: "+fieldsUsedMultipletimes.mkString(", "))
  }

  def useCreateEmpty(newCreateEmpty: => T) = this.copy(createEmpty = () => newCreateEmpty)

  def +(row: Row[T]) = ++(List(row))

  def ++(moreRows: List[Row[T]]) = Form(rows ++ moreRows, createEmpty)
}
