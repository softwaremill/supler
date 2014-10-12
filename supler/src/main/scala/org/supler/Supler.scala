package org.supler

import java.util.concurrent.atomic.AtomicLong

import org.json4s.JsonAST.JField
import org.json4s._
import org.supler.field._
import org.supler.transformation.FullTransformer
import org.supler.errors.{FieldErrors, FieldPath, FieldErrorMessage, Validators}

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
  private[supler] def generateJSON(obj: T): List[JField]

  def ||(field: Field[T, _]): Row[T]
  
  def applyValuesFromJSON(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): Either[FieldErrors, T]

  def doValidate(parentPath: FieldPath, obj: T): FieldErrors
}

object Row {
  def applyValuesFromJSON[T](toRows: Iterable[Row[T]], parentPath: FieldPath, obj: T, 
    jsonFields: Map[String, JValue]): Either[FieldErrors, T] = {
    
    toRows.foldLeft[Either[FieldErrors, T]](Right(obj)) { (currentRes, row) =>
      currentRes match {
        case Left(errors) =>
          // only accumulating errors, if any. Trying to apply on the raw object
          val newErrors = row.applyValuesFromJSON(parentPath, obj, jsonFields).fold(identity, _ => Nil)
          Left(errors ++ newErrors)
        case Right(currentObj) => row.applyValuesFromJSON(parentPath, currentObj, jsonFields)
      }
    }
  }
}

case class MultiFieldRow[T](fields: List[Field[T, _]]) extends Row[T] {
  override def ||(field: Field[T, _]): Row[T] = MultiFieldRow(fields ++ List(field))

  override def doValidate(parentPath: FieldPath, obj: T): List[FieldErrorMessage] =
    fields.flatMap(_.doValidate(parentPath, obj))

  override def applyValuesFromJSON(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): Either[FieldErrors, T] =
    Row.applyValuesFromJSON(fields, parentPath, obj, jsonFields)

  override def generateJSON(obj: T) = fields.flatMap(_.generateJSON(obj))
}

object IdGenerator {
  private val counter = new AtomicLong(0)
  def nextId() = "ID" + counter.getAndIncrement
}