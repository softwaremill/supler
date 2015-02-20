package org.supler.field

import org.json4s._
import org.json4s.JsonAST.{JBool, JField, JObject}
import org.supler._
import org.supler.validation.Validator

trait SelectField[T, U] extends GenerateBasicJSON[T] {
  this: Field[T] =>

  def labelForValue: U => String
  def valuesProvider: ValuesProvider[T, U]
  def validators: List[Validator[T, _]]
  def required: Boolean

  protected def multiple: Boolean

  override protected def generateJSONData(obj: T) = {
    val valueData = generateValueJSONData(obj)

    val validationJSON = JField(JSONFieldNames.ValidateRequired, JBool(required)) ::
      validators.flatMap(_.generateJSON)

    val multipleJSON = if (multiple) JField(JSONFieldNames.Multiple, JBool(value = true)) :: Nil else Nil

    BasicJSONData(
      SpecialFieldTypes.Select,
      valueData.valueJSON,
      validationJSON,
      valueData.emptyValueJSON,
      generatePossibleValuesJSON(valuesProvider(obj)) ++ multipleJSON
    )
  }

  protected case class ValueJSONData(valueJSON: Option[JValue], emptyValueJSON: Option[JValue])
  protected def generateValueJSONData(obj: T): ValueJSONData

  private def generatePossibleValuesJSON(possibleValues: List[U]): List[JField] = {
    val possibleJValues = possibleValues.zipWithIndex.map { case (value, index) =>
      JObject(JField("index", JInt(index)), JField("label", JString(labelForValue(value))))
    }
    List(JField(JSONFieldNames.PossibleValues, JArray(possibleJValues)))
  }
}
