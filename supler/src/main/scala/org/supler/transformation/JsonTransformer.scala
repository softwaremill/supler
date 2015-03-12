package org.supler.transformation

import org.json4s.JsonAST._

trait JsonTransformer[U] {
  /**
   * The name of the type that will be used in the generated json. Used by frontend to determine how to render the
   * field and serialize the value back to json.
   */
  def typeName: String
  def toJValueOrJNull(value: U): Option[JValue] = {
    if (value == null) Some(JNull)
    else toJValue(value)
  }
  def toJValue(value: U): Option[JValue]
  def fromJValue(jvalue: JValue): Option[U]
}

object JsonTransformer {
  trait JsonTransformerPF[U] extends JsonTransformer[U] {
    def fromJValue(jvalue: JValue): Option[U] = fromJValuePF.lift(jvalue)

    def fromJValuePF: PartialFunction[JValue, U]
  }

  implicit object StringJsonTransformer extends JsonTransformerPF[String] {
    val typeName = "string"
    def toJValue(value: String) = Some(JString(value))
    def fromJValuePF = { case JString(v) => v }
  }

  implicit object IntJsonTransformer extends JsonTransformerPF[Int] {
    val typeName = "integer"
    def toJValue(value: Int) = Some(JInt(value))
    def fromJValuePF = { case JInt(v) => v.intValue() }
  }

  implicit object LongJsonTransformer extends JsonTransformerPF[Long] {
    val typeName = "integer"
    def toJValue(value: Long) = Some(JInt(value))
    def fromJValuePF = { case JInt(v) => v.longValue() }
  }

  implicit object FloatJsonTransformer extends JsonTransformerPF[Float] {
    val typeName = "float"
    def toJValue(value: Float) = Some(JDouble(value))
    def fromJValuePF = { case JDouble(v) => v.toFloat }
  }

  implicit object DoubleJsonTransformer extends JsonTransformerPF[Double] {
    val typeName = "float"
    def toJValue(value: Double) = Some(JDouble(value))
    def fromJValuePF = { case JDouble(v) => v }
  }

  implicit object BooleanJsonTransformer extends JsonTransformerPF[Boolean] {
    val typeName = "boolean"
    def toJValue(value: Boolean) = Some(JBool(value))
    def fromJValuePF = { case JBool(v) => v }
  }

  implicit def optionJsonTransformer[U](implicit inner: JsonTransformer[U]): JsonTransformer[Option[U]] =
    new JsonTransformer[Option[U]] {
      val typeName = inner.typeName
      def toJValue(value: Option[U]) = value.flatMap(inner.toJValueOrJNull)

      def fromJValue(jvalue: JValue) = jvalue match {
        case JNothing => None
        case JNull => None
        case JString("") => None
        case jv => inner.fromJValue(jv).map(Some(_))
      }
    }
}