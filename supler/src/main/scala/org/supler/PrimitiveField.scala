package org.supler

import org.json4s.JsonAST.{JString, JObject, JField}
import org.json4s._
import org.supler.validation.{FieldValidationError, FieldPath, ValidationError, Validator}

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

  override def doValidate(parentPath: FieldPath, obj: T): List[FieldValidationError] = {
    val v = read(obj)
    val ves = validators.flatMap(_.doValidate(obj, v))

    def valueMissing = v == null || !fieldType.valuePresent(v)

    val allVes = if (required && valueMissing) {
      ValidationError("Value is required") :: ves
    } else {
      ves
    }

    allVes.map(ve => FieldValidationError(this, parentPath.append(name), ve))
  }

  override def generateJSON(obj: T) = {
    val valueJSON = fieldType.toJValue(read(obj)).map(JField("value", _))
    val validationJSON = List(JField("validate", JObject(
      JField("required", JBool(required)) :: validators.flatMap(_.generateJSON)
    )))
    val possibleValuesJSON = dataProvider match {
      case Some(dp) =>
        val possibilities = dp.provider(obj).zipWithIndex.flatMap(t => fieldType.toJValue(t._1).map(jv => (jv, t._2)))
        val possibilitiesObjs = possibilities.map { case (jvalue, index) =>
          JObject(JField("index", JInt(index)), JField("label", jvalue))
        }
        List(JField("possible_values", JArray(possibilitiesObjs)))
      case None => Nil
    }
    val generatedFieldTypeName = dataProvider match {
      case Some(dp) => "select"
      case None => fieldType.jsonSchemaName
    }

    List(JField(name, JObject(List(
      JField("label", JString(label.getOrElse(""))),
      JField("type", JString(generatedFieldTypeName))
    ) ++ valueJSON.toList ++ validationJSON ++ possibleValuesJSON)))
  }

  override def applyJSONValues(obj: T, jsonFields: Map[String, JValue]): T = {
    val appliedOpt = dataProvider match {
      case Some(dp) =>
        for {
          jsonValue <- jsonFields.get(name)
          index <- jsonValue match { case JInt(index) => Some(index.intValue()); case _ => None }
          value <- dp.provider(obj).lift(index.intValue())
        } yield {
          write(obj, value)
        }
      case None => {
        for {
          jsonValue <- jsonFields.get(name)
          value <- fieldType.fromJValue.lift(jsonValue)
        } yield {
          write(obj, value)
        }
      }
    }

    appliedOpt.getOrElse(obj)
  }
}
