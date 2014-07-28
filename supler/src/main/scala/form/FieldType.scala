package form

import org.json4s.JValue
import org.json4s.JsonAST.{JDouble, JBool, JInt, JString}

sealed trait FieldType[U] {
  def jsonSchemaName: String
  def toJValue(value: U): Option[JValue]
}

case object StringFieldType extends FieldType[String] {
  val jsonSchemaName = "string"
  def toJValue(value: String) = Some(JString(value))
}

case object IntFieldType extends FieldType[Int] {
  val jsonSchemaName = "integer"
  def toJValue(value: Int) = Some(JInt(value))
}

case object LongFieldType extends FieldType[Long] {
  val jsonSchemaName = "integer"
  def toJValue(value: Long) = Some(JInt(value))
}

case object FloatFieldType extends FieldType[Float] {
  val jsonSchemaName = "number"
  def toJValue(value: Float) = Some(JDouble(value))
}

case object DoubleFieldType extends FieldType[Double] {
  val jsonSchemaName = "number"
  def toJValue(value: Double) = Some(JDouble(value))
}

case object BooleanFieldType extends FieldType[Boolean] {
  val jsonSchemaName = "boolean"
  def toJValue(value: Boolean) = Some(JBool(value))
}

case class OptionalFieldType[U](inner: FieldType[U]) extends FieldType[Option[U]] {
  val jsonSchemaName = inner.jsonSchemaName
  def toJValue(value: Option[U]) = value.flatMap(inner.toJValue)
}