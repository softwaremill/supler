package org.supler

import org.json4s.JsonAST._

sealed trait FieldType[U] {
  def jsonSchemaName: String
  def toJValue(value: U): Option[JValue] = {
    if (value == null) Some(JNull)
    else toNonNullJValue(value)
  }
  protected def toNonNullJValue(value: U): Option[JValue]
  def fromJValue: PartialFunction[JValue, U]
  def valuePresent(value: U): Boolean = true
}

case object StringFieldType extends FieldType[String] {
  val jsonSchemaName = "string"
  def toNonNullJValue(value: String) = Some(JString(value))
  def fromJValue = { case JString(v) => v }
  override def valuePresent(value: String): Boolean = value != ""
}

case object IntFieldType extends FieldType[Int] {
  val jsonSchemaName = "integer"
  def toNonNullJValue(value: Int) = Some(JInt(value))
  def fromJValue = { case JInt(v) => v.intValue() }
}

case object LongFieldType extends FieldType[Long] {
  val jsonSchemaName = "integer"
  def toNonNullJValue(value: Long) = Some(JInt(value))
  def fromJValue = { case JInt(v) => v.longValue() }
}

case object FloatFieldType extends FieldType[Float] {
  val jsonSchemaName = "double"
  def toNonNullJValue(value: Float) = Some(JDouble(value))
  def fromJValue = { case JDouble(v) => v.toFloat }
}

case object DoubleFieldType extends FieldType[Double] {
  val jsonSchemaName = "double"
  def toNonNullJValue(value: Double) = Some(JDouble(value))
  def fromJValue = { case JDouble(v) => v }
}

case object BooleanFieldType extends FieldType[Boolean] {
  val jsonSchemaName = "boolean"
  def toNonNullJValue(value: Boolean) = Some(JBool(value))
  def fromJValue = { case JBool(v) => v }
}

case class OptionalFieldType[U](inner: FieldType[U]) extends FieldType[Option[U]] {
  val jsonSchemaName = inner.jsonSchemaName
  def toNonNullJValue(value: Option[U]) = value.flatMap(inner.toJValue)
  def fromJValue = {
    case JNothing => None
    case JNull => None
    case JString("") => None
    case jvalue if inner.fromJValue.isDefinedAt(jvalue) => inner.fromJValue.lift(jvalue)
  }
  override def valuePresent(value: Option[U]): Boolean = value.isDefined
}