package schema

import schema.JsonType.JsonType

case class JsonSchema(title: String, jsonType: JsonType, properties: List[JsonProperty]) {
  def addProperty(property: JsonProperty): JsonSchema = {
    this.copy(properties = property :: properties)
  }

  override def toString(): String = {
    val sb = new StringBuffer()
    sb.append("{\n")
    .append(s"\t'title': '$title',\n")
    .append(s"\t'type': '${jsonType.toString}',\n")
    .append(s"\t'properties': {\n")

    properties.foreach(jp => sb.append(jp.toString()))

    sb.append(s"\t}\n")
    sb.append(s"}\n")

    sb.toString
  }
}

case class JsonProperty(name: String, jsonType: JsonType, description: Option[String]) {
  override def toString(): String = {
    val sb = new StringBuffer()
    sb.append(s"\t\t'$name': {\n")
      .append(s"\t\t\t'type': '${jsonType.toString}',\n")

    description.map(s => sb.append(s"\t\t\t'description': '$s',\n"))

    sb.append(s"\t\t}\n")

    sb.toString
  }
}

object JsonType extends Enumeration {
  type JsonType = Value

  val String = Value("string")
  val Object = Value("object")
  val Integer = Value("integer")
}