package org.supler.field

import org.json4s._
import org.json4s.JsonAST.{JBool, JField, JObject}
import org.supler._
import org.supler.validation.Validator

import scala.util.Try

trait SelectField[T, U] extends GenerateBasicJSON[T] {
  this: Field[T] =>

  def labelForValue: U => String
  def valuesProvider: ValuesProvider[T, U]
  def validators: List[Validator[T, _]]
  def required: Boolean
  def idForValue: Option[U => String]

  protected def multiple: Boolean

  override protected def generateJSONData(obj: T) = {
    val valueData = generateValueJSONData(obj)

    val validationJSON = JField(JSONFieldNames.ValidateRequired, JBool(required)) ::
      validators.flatMap(_.generateJSON)

    val multipleJSON = if (multiple) JField(JSONFieldNames.Multiple, JBool(value = true)) :: Nil else Nil

    BasicJSONData(
      SpecialFieldTypes.Select,
      valueData.valueJSON,
      validationJSON,
      valueData.emptyValueJSON,
      generatePossibleValuesJSON(valuesProvider(obj)) ++ multipleJSON
    )
  }

  protected case class ValueJSONData(valueJSON: Option[JValue], emptyValueJSON: Option[JValue])
  protected def generateValueJSONData(obj: T): ValueJSONData

  private def generatePossibleValuesJSON(possibleValues: List[U]): List[JField] = {
    val possibleValuesWithIds = idForValue match {
      case None => possibleValues.zipWithIndex.map(vi => (vi._1, vi._2.toString))
      case Some(idFn) => possibleValues.map(v => (v, idFn(v)))
    }
    val possibleJValues = possibleValuesWithIds.map { case (value, id) =>
      JObject(JField("id", JString(id)), JField("label", JString(labelForValue(value))))
    }
    List(JField(JSONFieldNames.PossibleValues, JArray(possibleJValues)))
  }

  protected def valueFromId(possibleValues: List[U], id: String): Option[U] = {
    idForValue match {
      case None =>
        for {
          index <- Try(id.toInt).toOption
          value <- possibleValues.lift(index)
        } yield value
      case Some(idFn) =>
        possibleValues.find(idFn(_) == id)
    }
  }

  protected def idFromValue(possibleValues: List[U], value: U): Option[String] = idForValue match {
    case None =>
      val idx = possibleValues.indexOf(value)
      if (idx == -1) None else Some(idx.toString)
    case Some(idFn) => Some(idFn(value))
  }
}

/**
 * To-string serializer for the id of a select value.
 * We only allow ids which are strings or numbers by providing the implicit implementations.
 */
sealed trait SelectValueIdSerializer[T] {
  def toString(v: T): String
}

object SelectValueIdSerializer {
  implicit object StringValue extends SelectValueIdSerializer[String] { def toString(v: String) = v }
  implicit object IntValue extends SelectValueIdSerializer[Int] { def toString(v: Int) = v.toString }
  implicit object LongValue extends SelectValueIdSerializer[Long] { def toString(v: Long) = v.toString }
  implicit object DoubleValue extends SelectValueIdSerializer[Double] { def toString(v: Double) = v.toString }
  implicit object FloatValue extends SelectValueIdSerializer[Float] { def toString(v: Float) = v.toString }
}
