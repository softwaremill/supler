package org.supler

import java.util.concurrent.atomic.AtomicLong

import org.json4s.JsonAST.JField
import org.json4s._
import org.supler.transformation.FullTransformer
import org.supler.errors.{FieldErrors, FieldPath, FieldErrorMessage, Validators}

import scala.language.experimental.macros

object Supler extends Validators {
  def form[T](rows: Supler[T] => List[Row[T]]) = {
    Form(rows(new Supler[T] {}))
  }

  def dataProvider[T, U](provider: T => List[U]): DataProvider[T, U] = {
    new DataProvider[T, U](provider)
  }

  def field[T, U, S](param: T => U)
    (implicit transformer: FullTransformer[U, _]): PrimitiveField[T, U] =
    macro SuplerMacros.field_impl[T, U]

  def setField[T, U](param: T => Set[U])
    (implicit transformer: FullTransformer[U, _]): SetField[T, U] =
    macro SuplerMacros.setField_impl[T, U]

  def subform[T, U](param: T => List[U], form: Form[U], createEmpty: => U): SubformField[T, U] = macro SuplerMacros.subform_impl[T, U]

  def asList() = SubformListRenderHint
  def asTable() = SubformTableRenderHint

  def asPassword() = FieldPasswordRenderHint
  def asTextarea(rows: Int = -1, cols: Int = -1) = {
    def toOption(d: Int) = if (d == -1) None else Some(d)
    FieldTextareaRenderHint(toOption(rows), toOption(cols))
  }
  def asRadio() = FieldRadioRenderHint
}

trait Supler[T] extends Validators {
  def field[U](param: T => U)
    (implicit transformer: FullTransformer[U, _]): PrimitiveField[T, U] =
    macro SuplerMacros.field_impl[T, U]

  def setField[U](param: T => Set[U])
    (implicit transformer: FullTransformer[U, _]): SetField[T, U] =
    macro SuplerMacros.setField_impl[T, U]

  def subform[U](param: T => List[U], form: Form[U], createEmpty: => U): SubformField[T, U] = macro SuplerMacros.subform_impl[T, U]
}

trait Row[T] {
  def generateJSON(obj: T): List[JField]

  def ||(field: Field[T, _]): Row[T]
  
  def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): Either[FieldErrors, T]

  def doValidate(parentPath: FieldPath, obj: T): FieldErrors
}

object Row {
  def applyJSONValues[T](toRows: Iterable[Row[T]], parentPath: FieldPath, obj: T, 
    jsonFields: Map[String, JValue]): Either[FieldErrors, T] = {
    
    toRows.foldLeft[Either[FieldErrors, T]](Right(obj)) { (currentRes, row) =>
      currentRes match {
        case Left(errors) =>
          // only accumulating errors, if any. Trying to apply on the raw object
          val newErrors = row.applyJSONValues(parentPath, obj, jsonFields).fold(identity, _ => Nil)
          Left(errors ++ newErrors)
        case Right(currentObj) => row.applyJSONValues(parentPath, currentObj, jsonFields)
      }
    }
  }
}

trait Field[T, U] extends Row[T] {
  def name: String

  override def ||(field: Field[T, _]): Row[T] = MultiFieldRow(this :: field :: Nil)

  protected val TypeField = "type"
  protected val LabelField = "label"
  protected val MultipleField = "multiple"
  protected val ValueField = "value"
  protected val ValidateField = "validate"
  protected val RenderHintField = "render_hint"
  protected val PossibleValuesField = "possible_values"

  protected val ValidateRequiredField = "required"

  protected val SelectType = "select"
  protected val SubformType = "subform"
}

case class MultiFieldRow[T](fields: List[Field[T, _]]) extends Row[T] {
  override def ||(field: Field[T, _]): Row[T] = MultiFieldRow(fields ++ List(field))

  override def doValidate(parentPath: FieldPath, obj: T): List[FieldErrorMessage] =
    fields.flatMap(_.doValidate(parentPath, obj))

  override def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): Either[FieldErrors, T] =
    Row.applyJSONValues(fields, parentPath, obj, jsonFields)

  override def generateJSON(obj: T) = fields.flatMap(_.generateJSON(obj))
}

case class DataProvider[T, U](provider: T => List[U])

object IdGenerator {
  private val counter = new AtomicLong(0)
  def nextId() = "ID" + counter.getAndIncrement
}