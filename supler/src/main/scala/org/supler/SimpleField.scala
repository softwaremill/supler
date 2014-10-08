package org.supler

import org.json4s.JsonAST.{JField, JObject}
import org.json4s._
import org.supler.errors.{FieldPath, FieldErrorMessage, ErrorMessage}
import org.supler.transformation.FullTransformer

trait SimpleField[T, U] extends Field[T, U] {
  def name: String
  def dataProvider: Option[DataProvider[T, U]]
  def label: Option[String]
  def transformer: FullTransformer[U, _]

  override def generateJSON(obj: T): List[JField] = {
    val data = dataProvider match {
      case Some(dp) => generateJSONWithDataProvider(obj, dp)
      case None => generateJSONWithoutDataProvider(obj)
    }

    List(JField(name, JObject(List(
      JField(LabelField, JString(label.getOrElse(""))),
      JField(TypeField, JString(data.fieldTypeName)),
      JField(ValidateField, JObject(data.validationJSON.toList))
    ) ++ data.valueJSONValue.map(JField(ValueField, _)).toList
      ++ data.renderHintJSONValue.map(JField(RenderHintField, _)).toList
      ++ data.extraJSON)))
  }

  protected def generateJSONWithDataProvider(obj: T, dp: DataProvider[T, U]): GenerateJSONData

  protected def generateJSONWithoutDataProvider(obj: T): GenerateJSONData

  protected def generatePossibleValuesJSON(possibleValues: List[U]): List[JField] = {
    val possibleJValuesWithIndex = possibleValues.zipWithIndex
      .flatMap(t => transformer.serialize(t._1).map(jv => (jv, t._2)))
    val possibleJValues = possibleJValuesWithIndex.map { case (jvalue, index) =>
      JObject(JField("index", JInt(index)), JField("label", jvalue))
    }
    List(JField(PossibleValuesField, JArray(possibleJValues)))
  }

  protected def toFieldErrorMessage(parentPath: FieldPath)(errorMessage: ErrorMessage) =
    FieldErrorMessage(this, parentPath.append(name), errorMessage)

  case class GenerateJSONData(
    fieldTypeName: String,
    valueJSONValue: Option[JValue],
    validationJSON: List[JField],
    renderHintJSONValue: Option[JValue] = None,
    extraJSON: List[JField] = Nil
  )
}
