package org.supler

import org.json4s.JsonAST._

sealed trait FieldType[U] {
  def jsonSchemaName: String
  def toJValue(value: U): Option[JValue]
  def fromJValue: PartialFunction[JValue, U]
}

case object StringFieldType extends FieldType[String] {
  val jsonSchemaName = "string"
  def toJValue(value: String) = Some(JString(value))
  def fromJValue = { case JString(v) => v }
}

case object IntFieldType extends FieldType[Int] {
  val jsonSchemaName = "integer"
  def toJValue(value: Int) = Some(JInt(value))
  def fromJValue = { case JInt(v) => v.intValue() }
}

case object LongFieldType extends FieldType[Long] {
  val jsonSchemaName = "integer"
  def toJValue(value: Long) = Some(JInt(value))
  def fromJValue = { case JInt(v) => v.longValue() }
}

case object FloatFieldType extends FieldType[Float] {
  val jsonSchemaName = "number"
  def toJValue(value: Float) = Some(JDouble(value))
  def fromJValue = { case JDouble(v) => v.toFloat }
}

case object DoubleFieldType extends FieldType[Double] {
  val jsonSchemaName = "number"
  def toJValue(value: Double) = Some(JDouble(value))
  def fromJValue = { case JDouble(v) => v }
}

case object BooleanFieldType extends FieldType[Boolean] {
  val jsonSchemaName = "boolean"
  def toJValue(value: Boolean) = Some(JBool(value))
  def fromJValue = { case JBool(v) => v }
}

case class OptionalFieldType[U](inner: FieldType[U]) extends FieldType[Option[U]] {
  val jsonSchemaName = inner.jsonSchemaName
  def toJValue(value: Option[U]) = value.flatMap(inner.toJValue)
  def fromJValue = {
    case JNothing => None
    case JNull => None
    case JString("") => None
    case jvalue if inner.fromJValue.isDefinedAt(jvalue) => inner.fromJValue.lift(jvalue)
  }
}