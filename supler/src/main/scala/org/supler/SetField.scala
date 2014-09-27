package org.supler

import org.json4s.JsonAST.{JString, JObject, JField}
import org.json4s._
import org.supler.validation.{FieldValidationError, FieldPath, Validator}

case class SetField[T, U](
  name: String,
  read: T => Set[U],
  write: (T, Set[U]) => T,
  validators: List[Validator[T, Set[U]]],
  dataProvider: Option[DataProvider[T, U]],
  label: Option[String],
  fieldType: FieldType[U]) extends SimpleField[T, U] {

  def label(newLabel: String): SetField[T, U] = this.copy(label = Some(newLabel))

  def validate(validators: Validator[T, Set[U]]*): SetField[T, U] = this.copy(validators = this.validators ++ validators)

  def use(dataProvider: DataProvider[T, U]): SetField[T, U] = this.dataProvider match {
    case Some(_) => throw new IllegalStateException("A data provider is already defined!")
    case None => this.copy(dataProvider = Some(dataProvider))
  }

  override def doValidate(parentPath: FieldPath, obj: T): List[FieldValidationError] = {
    val v = read(obj)
    val ves = validators.flatMap(_.doValidate(obj, v))
    ves.map(ve => FieldValidationError(this, parentPath.append(name), ve))
  }

  protected def generateJSONWithDataProvider(obj: T, dp: DataProvider[T, U]): List[JField] = {
    val possibleValues = dp.provider(obj)
    val currentValues = read(obj).map(possibleValues.indexOf).filter(_ != -1)
    val valueJSON = JField("value", JArray(currentValues.map(JInt(_)).toList))
    val validationJSON = List(JField("validate", JObject(
      validators.flatMap(_.generateJSON)
    )))

    List(JField(name, JObject(List(
      JField("label", JString(label.getOrElse(""))),
      JField("type", JString("select")),
      JField("multiple", JBool(value = true))
    ) ++ List(valueJSON) ++ validationJSON ++ generatePossibleValuesJSON(possibleValues))))
  }

  protected def generateJSONWithoutDataProvider(obj: T): List[JField] = {
    val valueJSON = JField("value", JArray(read(obj).toList.flatMap(fieldType.toJValue)))
    val validationJSON = List(JField("validate", JObject(
      validators.flatMap(_.generateJSON)
    )))

    List(JField(name, JObject(List(
      JField("label", JString(label.getOrElse(""))),
      JField("type", JString(fieldType.jsonSchemaName)),
      JField("multiple", JBool(value = true))
    ) ++ List(valueJSON) ++ validationJSON)))
  }

  override def applyJSONValues(obj: T, jsonFields: Map[String, JValue]): T = {
    dataProvider match {
      case Some(dp) =>
        val possibleValues = dp.provider(obj).lift
        val values = for {
          jsonValue <- jsonFields.get(name).toList
          indexes <- jsonValue match { case JArray(jindexes) => List(jindexes.collect { case JInt(idx) => idx }); case _ => Nil }
          index <- indexes
          value <- possibleValues(index.intValue()).toList
        } yield {
          value
        }
        write(obj, values.toSet)
      case None => {
        val values = for {
          JArray(jsonValues) <- jsonFields.get(name).toList
          jsonValue <- jsonValues
          value <- fieldType.fromJValue.lift(jsonValue).toList
        } yield {
          value
        }
        write(obj, values.toSet)
      }
    }
  }
}
