package schema

import org.json4s.JsonAST._
import schema.JsonType.JsonType

case class JsonSchema(title: String, jsonType: JsonType, properties: List[JsonProperty]) {
  def addProperty(property: JsonProperty): JsonSchema = {
    this.copy(properties = property :: properties)
  }

  def toJValue: JValue = {
    JObject(
      List(
        JField("title", JString(title)),
        JField("type", JString(jsonType.toString)),
        JField("properties", JObject(properties.map(_.toJValue)))
      )
    )
  }

  override def toString = {
    import org.json4s.native._
    prettyJson(renderJValue(toJValue))
  }
}

case class JsonProperty(name: String, jsonType: JsonType, description: Option[String]) {
  def toJValue: JField = {
    JField(name, JObject(
        List(
          JField("type", JString(jsonType.toString)),
          JField("description", JString(description.getOrElse("")))
        )
      )
    )
  }
}

object JsonType extends Enumeration {
  type JsonType = Value

  val String = Value("string")
  val Object = Value("object")
  val Integer = Value("integer")
}