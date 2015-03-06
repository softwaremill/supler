package org.supler

import org.json4s.JsonAST.{JArray, JObject, JString, JValue}
import org.supler.field.{Field, RunActionContext, RunnableAction}
import org.supler.validation._

trait Row[T] {
  def ||(field: Field[T]): Row[T]

  private[supler] def generateJSON(parentPath: FieldPath, obj: T): RowsJSON

  private[supler] def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): PartiallyAppliedObj[T]

  private[supler] def doValidate(parentPath: FieldPath, obj: T, scope: ValidationScope): FieldErrors

  private[supler] def findAction(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue], ctx: RunActionContext): Option[RunnableAction]
}

object Row {
  def applyJSONValues[T](toRows: Iterable[Row[T]], parentPath: FieldPath, obj: T,
    jsonFields: Map[String, JValue]): PartiallyAppliedObj[T] = {

    toRows.foldLeft[PartiallyAppliedObj[T]](PartiallyAppliedObj.full(obj)) { (pao, row) =>
      pao.flatMap(row.applyJSONValues(parentPath, _, jsonFields))
    }
  }

  def findFirstAction[T](parentPath: FieldPath, rows: Iterable[Row[T]], obj: T, jsonFields: Map[String, JValue],
    ctx: RunActionContext): Option[RunnableAction] = {

    Util.findFirstMapped(
      rows,
      (_: Row[T]).findAction(parentPath, obj, jsonFields, ctx),
      (_: Option[RunnableAction]).isDefined).flatten
  }
}

case class MultiFieldRow[T](fields: List[Field[T]]) extends Row[T] {
  override def ||(field: Field[T]): Row[T] = MultiFieldRow(fields ++ List(field))

  override def doValidate(parentPath: FieldPath, obj: T, scope: ValidationScope): List[FieldErrorMessage] =
    fields.flatMap(_.doValidate(parentPath, obj, scope))

  override def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): PartiallyAppliedObj[T] =
    Row.applyJSONValues(fields, parentPath, obj, jsonFields)

  override def generateJSON(parentPath: FieldPath, obj: T) = {
    RowsJSON.combineIntoSingleRowsJSON(fields.map(_.generateJSON(parentPath, obj)))
  }

  override def findAction(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue], ctx: RunActionContext) =
    Row.findFirstAction(parentPath, fields, obj, jsonFields, ctx)
}

case class RowsJSON(fields: List[JObject], fieldOrder: List[String]) {
  def fieldOrderAsJSON = JArray(fieldOrder.map(JString))
}

object RowsJSON {
  def empty = RowsJSON(Nil, Nil)

  def singleField(fieldJson: JObject, name: String) = RowsJSON(List(fieldJson), List(name))

  def combineIntoSingleRowsJSON(fieldJsons: List[RowsJSON]) =
    RowsJSON(fieldJsons.flatMap(_.fields), fieldJsons.flatMap(_.fieldOrder))
}