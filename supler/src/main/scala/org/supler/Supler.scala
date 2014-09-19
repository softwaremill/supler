package org.supler

import java.util.concurrent.atomic.AtomicLong

import org.json4s.JsonAST.JField
import org.json4s._
import org.supler.validation.{FieldPath, FieldValidationError, Validators}

import scala.language.experimental.macros

object Supler extends Validators {
  def form[T](rows: Supler[T] => List[Row[T]]) = {
    Form(rows(new Supler[T] {}))
  }

  def dataProvider[T, U](provider: T => List[U]): DataProvider[T, U] = {
    new DataProvider[T, U](provider)
  }

  def field[T, U](param: T => U): PrimitiveField[T, U] = macro SuplerMacros.field_impl[T, U]
  def subform[T, U](param: T => List[U], form: Form[U], createEmpty: => U): SubformField[T, U] = macro SuplerMacros.subform_impl[T, U]

  def asList() = SubformListRenderHint
  def asTable() = SubformTableRenderHint

  def asPassword() = FieldPasswordRenderHint
  def asTextarea(rows: Int = -1, cols: Int = -1) = {
    def toOption(d: Int) = if (d == -1) None else Some(d)
    FieldTextareaRenderHint(toOption(rows), toOption(cols))
  }
}

trait Supler[T] extends Validators {
  def field[U](param: T => U): PrimitiveField[T, U] = macro SuplerMacros.field_impl[T, U]
  def subform[U](param: T => List[U], form: Form[U], createEmpty: => U): SubformField[T, U] = macro SuplerMacros.subform_impl[T, U]
}

trait Row[T] {
  def generateJSON(obj: T): List[JField]

  def applyJSONValues(obj: T, jsonFields: Map[String, JValue]): T

  def ||(field: Field[T, _]): Row[T]

  def doValidate(parentPath: FieldPath, obj: T): List[FieldValidationError]
}

trait Field[T, U] extends Row[T] {
  def name: String

  override def ||(field: Field[T, _]): Row[T] = MultiFieldRow(this :: field :: Nil)
}

case class MultiFieldRow[T](fields: List[Field[T, _]]) extends Row[T] {
  override def ||(field: Field[T, _]): Row[T] = MultiFieldRow(fields ++ List(field))

  override def doValidate(parentPath: FieldPath, obj: T): List[FieldValidationError] =
    fields.flatMap(_.doValidate(parentPath, obj))

  override def generateJSON(obj: T) = fields.flatMap(_.generateJSON(obj))

  override def applyJSONValues(obj: T, jsonFields: Map[String, JValue]): T = {
    fields.foldLeft(obj)((currentObj, field) => field.applyJSONValues(currentObj, jsonFields))
  }
}

case class DataProvider[T, U](provider: T => List[U])

object IdGenerator {
  private val counter = new AtomicLong(0)
  def nextId() = "ID" + counter.getAndIncrement
}