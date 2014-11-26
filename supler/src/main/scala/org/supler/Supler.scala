package org.supler

import org.json4s.JsonAST.JField
import org.json4s._
import org.supler.errors.ValidationMode.ValidationMode
import org.supler.errors._
import org.supler.field._
import org.supler.transformation.FullTransformer

import scala.language.experimental.macros

object Supler extends Validators {
  def form[T](rows: Supler[T] => List[Row[T]]) = {
    Form(rows(new Supler[T] {}))
  }

  def field[T, U](param: T => U)
    (implicit transformer: FullTransformer[U, _]): BasicField[T, U] =
    macro SuplerMacros.field_impl[T, U]

  def setField[T, U](param: T => Set[U])
    (implicit transformer: FullTransformer[U, _]): SetField[T, U] =
    macro SuplerMacros.setField_impl[T, U]

  def subform[T, U](param: T => List[U], form: Form[U], createEmpty: => U): SubformField[T, U] = macro SuplerMacros.subform_impl[T, U]

  def staticField[T](createMessage: T => Message) = new StaticField[T](createMessage, None)

  def asList() = SubformListRenderHint
  def asTable() = SubformTableRenderHint

  def asPassword() = BasicFieldPasswordRenderHint
  def asTextarea(rows: Int = -1, cols: Int = -1) = {
    def toOption(d: Int) = if (d == -1) None else Some(d)
    BasicFieldTextareaRenderHint(toOption(rows), toOption(cols))
  }
  def asRadio() = BasicFieldRadioRenderHint
}

trait Supler[T] extends Validators {
  def field[U](param: T => U)
    (implicit transformer: FullTransformer[U, _]): BasicField[T, U] =
    macro SuplerMacros.field_impl[T, U]

  def setField[U](param: T => Set[U])
    (implicit transformer: FullTransformer[U, _]): SetField[T, U] =
    macro SuplerMacros.setField_impl[T, U]

  def subform[U](param: T => List[U], form: Form[U], createEmpty: => U): SubformField[T, U] = macro SuplerMacros.subform_impl[T, U]

  def staticField(createMessage: T => Message) = new StaticField[T](createMessage, None)
}

trait Row[T] {
  private[supler] def generateJSON(parentPath: FieldPath, obj: T): List[JField]

  def ||(field: Field[T, _]): Row[T]
  
  def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): PartiallyAppliedObj[T]

  def doValidate(parentPath: FieldPath, obj: T, mode: ValidationMode): FieldErrors
}

object Row {
  def applyJSONValues[T](toRows: Iterable[Row[T]], parentPath: FieldPath, obj: T, 
    jsonFields: Map[String, JValue]): PartiallyAppliedObj[T] = {
    
    toRows.foldLeft[PartiallyAppliedObj[T]](PartiallyAppliedObj.full(obj)) { (pao, row) =>
      pao.flatMap(row.applyJSONValues(parentPath, _, jsonFields))
    }
  }
}

case class MultiFieldRow[T](fields: List[Field[T, _]]) extends Row[T] {
  override def ||(field: Field[T, _]): Row[T] = MultiFieldRow(fields ++ List(field))

  override def doValidate(parentPath: FieldPath, obj: T, mode: ValidationMode): List[FieldErrorMessage] =
    fields.flatMap(_.doValidate(parentPath, obj, mode))

  override def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): PartiallyAppliedObj[T] =
    Row.applyJSONValues(fields, parentPath, obj, jsonFields)

  override def generateJSON(parentPath: FieldPath, obj: T) = fields.flatMap(_.generateJSON(parentPath, obj))
}