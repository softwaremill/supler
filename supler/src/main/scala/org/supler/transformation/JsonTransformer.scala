package org.supler.transformation

import org.json4s.JsonAST._

trait JsonTransformer[U] {
  def jsonSchemaName: String
  def toJValue(value: U): Option[JValue] = {
    if (value == null) Some(JNull)
    else toNonNullJValue(value)
  }
  protected def toNonNullJValue(value: U): Option[JValue]
  def fromJValue: PartialFunction[JValue, U]
}

object JsonTransformer {
  implicit object StringJsonTransformer extends JsonTransformer[String] {
    val jsonSchemaName = "string"
    def toNonNullJValue(value: String) = Some(JString(value))
    def fromJValue = { case JString(v) => v }
  }

  implicit object IntJsonTransformer extends JsonTransformer[Int] {
    val jsonSchemaName = "integer"
    def toNonNullJValue(value: Int) = Some(JInt(value))
    def fromJValue = { case JInt(v) => v.intValue() }
  }

  implicit object LongJsonTransformer extends JsonTransformer[Long] {
    val jsonSchemaName = "integer"
    def toNonNullJValue(value: Long) = Some(JInt(value))
    def fromJValue = { case JInt(v) => v.longValue() }
  }

  implicit object FloatJsonTransformer extends JsonTransformer[Float] {
    val jsonSchemaName = "float"
    def toNonNullJValue(value: Float) = Some(JDouble(value))
    def fromJValue = { case JDouble(v) => v.toFloat }
  }

  implicit object DoubleJsonTransformer extends JsonTransformer[Double] {
    val jsonSchemaName = "float"
    def toNonNullJValue(value: Double) = Some(JDouble(value))
    def fromJValue = { case JDouble(v) => v }
  }

  implicit object BooleanJsonTransformer extends JsonTransformer[Boolean] {
    val jsonSchemaName = "boolean"
    def toNonNullJValue(value: Boolean) = Some(JBool(value))
    def fromJValue = { case JBool(v) => v }
  }

  implicit def optionJsonTransformer[U](implicit inner: JsonTransformer[U]) = new JsonTransformer[Option[U]] {
    val jsonSchemaName = inner.jsonSchemaName
    def toNonNullJValue(value: Option[U]) = value.flatMap(inner.toJValue)
    def fromJValue = {
      case JNothing => None
      case JNull => None
      case JString("") => None
      case jvalue if inner.fromJValue.isDefinedAt(jvalue) => inner.fromJValue.lift(jvalue)
    }
  }
}