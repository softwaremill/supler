package org.supler

import org.json4s.JsonAST.{JField, JObject}
import org.json4s._

trait SimpleField[T, U] extends Field[T, U] {
  def dataProvider: Option[DataProvider[T, U]]
  def fieldType: FieldType[U]

  override def generateJSON(obj: T) = {
    dataProvider match {
      case Some(dp) => generateJSONWithDataProvider(obj, dp)
      case None => generateJSONWithoutDataProvider(obj)
    }
  }

  protected def generateJSONWithDataProvider(obj: T, dp: DataProvider[T, U]): List[JField]

  protected def generateJSONWithoutDataProvider(obj: T): List[JField]

  protected def generatePossibleValuesJSON(possibleValues: List[U]): List[JField] = {
    val possibleJValuesWithIndex = possibleValues.zipWithIndex.flatMap(t => fieldType.toJValue(t._1).map(jv => (jv, t._2)))
    val possibleJValues = possibleJValuesWithIndex.map { case (jvalue, index) =>
      JObject(JField("index", JInt(index)), JField("label", jvalue))
    }
    List(JField("possible_values", JArray(possibleJValues)))
  }
}
