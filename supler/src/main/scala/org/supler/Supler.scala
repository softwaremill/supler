package org.supler

import java.util.concurrent.atomic.AtomicLong

import scala.language.experimental.macros

import org.json4s.JsonAST.{JField, JObject, JString}
import org.json4s._

object Supler extends Validators {
  def form[T](rows: Supler[T] => List[Row[T]]) = {
    Form(rows(new Supler[T] {}))
  }

  def dataProvider[T, U](provider: T => List[U]): DataProvider[T, U] = {
    new DataProvider[T, U](provider)
  }

  def field[T, U](param: T => U): PrimitiveField[T, U] = macro SuplerMacros.field_impl[T, U]
  def table[T, U](param: T => List[U], form: Form[U], createEmpty: => U): TableField[T, U] = macro SuplerMacros.table_impl[T, U]
}

trait Supler[T] extends Validators {
  def field[U](param: T => U): PrimitiveField[T, U] = macro SuplerMacros.field_impl[T, U]
  def table[U](param: T => List[U], form: Form[U], createEmpty: => U): TableField[T, U] = macro SuplerMacros.table_impl[T, U]
}

case class FieldValidationError(field: Field[_, _], key: String, params: Any*)

trait Row[T] {
  def generateJSON(obj: T): List[JField]

  def applyJSONValues(obj: T, jsonFields: Map[String, JValue]): T

  def ||(field: Field[T, _]): Row[T]

  def doValidate(obj: T): List[FieldValidationError]
}

case class Form[T](rows: List[Row[T]]) {
  def doValidate(obj: T): List[FieldValidationError] = rows.flatMap(_.doValidate(obj))

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

trait Field[T, U] extends Row[T] {
  def name: String

  override def ||(field: Field[T, _]): Row[T] = MultiFieldRow(this :: field :: Nil)
}

case class PrimitiveField[T, U](
  name: String,
  read: T => U,
  write: (T, U) => T,
  validators: List[Validator[T, U]],
  dataProvider: Option[DataProvider[T, U]],
  label: Option[String],
  required: Boolean,
  fieldType: FieldType[U]) extends Field[T, U] {

  def label(newLabel: String) = this.copy(label = Some(newLabel))

  def validate(validators: Validator[T, U]*): PrimitiveField[T, U] = this.copy(validators = this.validators ++ validators)

  def use(dataProvider: DataProvider[T, U]): PrimitiveField[T, U] = this.dataProvider match {
    case Some(_) => throw new IllegalStateException("A data provider is already defined!")
    case None => this.copy(dataProvider = Some(dataProvider))
  }

  override def doValidate(obj: T): List[FieldValidationError] = {
    val v = read(obj)
    val fves = validators.flatMap(_.doValidate(obj, v)).map(ve => FieldValidationError(this, ve.key, ve.params: _*))

    def valueMissing = v == null || !fieldType.valuePresent(v)

    if (required && valueMissing) {
      FieldValidationError(this, "Value is required") :: fves
    } else {
      fves
    }
  }

  override def generateJSON(obj: T) = {
    val valueJSON = fieldType.toJValue(read(obj)).map(JField("value", _))
    val validationJSON = List(JField("validate", JObject(
      JField("required", JBool(required)) :: validators.flatMap(_.generateJSON)
    )))
    val possibleValuesJSON = dataProvider match {
      case Some(dp) =>
        val possibilities = dp.provider(obj).flatMap(fieldType.toJValue)
        List(JField("possible_values", JArray(if (required) possibilities else JString("") :: possibilities)))
      case None => Nil
    }

    List(JField(name, JObject(List(
      JField("label", JString(label.getOrElse(""))),
      JField("type", JString(fieldType.jsonSchemaName))
    ) ++ valueJSON.toList ++ validationJSON ++ possibleValuesJSON)))
  }

  override def applyJSONValues(obj: T, jsonFields: Map[String, JValue]): T = {
    (for {
      jsonValue <- jsonFields.get(name)
      value <- fieldType.fromJValue.lift(jsonValue)
    } yield {
      write(obj, value)
    }).getOrElse(obj)
  }
}

case class MultiFieldRow[T](fields: List[Field[T, _]]) extends Row[T] {
  override def ||(field: Field[T, _]): Row[T] = MultiFieldRow(fields ++ List(field))

  override def doValidate(obj: T): List[FieldValidationError] = fields.flatMap(_.doValidate(obj))

  override def generateJSON(obj: T) = fields.flatMap(_.generateJSON(obj))

  override def applyJSONValues(obj: T, jsonFields: Map[String, JValue]): T = {
    fields.foldLeft(obj)((currentObj, field) => field.applyJSONValues(currentObj, jsonFields))
  }
}

case class TableField[T, U](
  name: String,
  read: T => List[U],
  write: (T, List[U]) => T,
  label: Option[String],
  embeddedForm: Form[U],
  createEmpty: () => U) extends Field[T, List[U]] {

  def label(newLabel: String) = this.copy(label = Some(newLabel))

  def generateJSON(obj: T) = List(JField(name, JObject(
    JField("type", JString("subform")),
    JField("multiple", JBool(value = true)),
    JField("label", JString(label.getOrElse(""))),
    JField("value", JArray(read(obj).map(embeddedForm.generateJSON)))
  )))

  override def applyJSONValues(obj: T, jsonFields: Map[String, JValue]) = {
    val vs = for {
      JArray(formJValues) <- jsonFields.get(name).toList
      formJValue <- formJValues
    } yield {
      embeddedForm.applyJSONValues(createEmpty(), formJValue)
    }

    write(obj, vs)
  }

  override def doValidate(obj: T) = read(obj).flatMap(embeddedForm.doValidate)
}

case class DataProvider[T, U](provider: T => List[U])

object IdGenerator {
  private val counter = new AtomicLong(0)
  def nextId() = "ID" + counter.getAndIncrement
}