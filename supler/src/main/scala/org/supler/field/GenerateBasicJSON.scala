package org.supler.field

import org.json4s.JsonAST.{JField, JObject}
import org.json4s._
import org.supler._

trait GenerateBasicJSON[T] {
  this: Field[T] =>

  def renderHint: Option[RenderHint]

  private[supler] override def generateFieldJSON(parentPath: FieldPath, obj: T) = {
    val data = generateJSONData(obj)

    import JSONFieldNames._

    JObject(List(
      JField(Type, JString(data.fieldTypeName)),
      JField(Validate, JObject(data.validationJSON.toList)),
      JField(Path, JString(parentPath.append(name).toString))
    ) ++ data.valueJSONValue.map(JField(Value, _)).toList
      ++ data.emptyValue.map(JField(EmptyValue, _)).toList
      ++ generateRenderHintJSONValue.map(JField(RenderHint, _)).toList
      ++ data.extraJSON)
  }

  protected def generateJSONData(obj: T): BasicJSONData

  private def generateRenderHintJSONValue = renderHint.map(rh => JObject(
    JField("name", JString(rh.name)) :: rh.extraJSON))

  case class BasicJSONData(
    fieldTypeName: String,
    valueJSONValue: Option[JValue],
    validationJSON: List[JField],
    emptyValue: Option[JValue],
    extraJSON: List[JField] = Nil
  )
}
