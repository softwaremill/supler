package org.supler

import org.json4s.JsonAST.{JString, JObject, JField}
import org.json4s._

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
