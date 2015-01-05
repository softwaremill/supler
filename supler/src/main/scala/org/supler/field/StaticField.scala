package org.supler.field

import org.json4s.JValue
import org.json4s.JsonAST._
import org.supler.transformation.FullTransformer
import org.supler.{FieldPath, ValuesProvider, Message}
import org.supler.errors.{ValidationScope, PartiallyAppliedObj}

import scala.concurrent.forkjoin.ThreadLocalRandom

case class StaticField[T](
  createMessage: T => Message,
  label: Option[String]) extends Field[T] with NonNestedFieldJSON[T, String] {

  val name = "_supler_static_" + ThreadLocalRandom.current().nextInt()
  val renderHint = None
  val valuesProvider = None
  val transformer = implicitly[FullTransformer[String, String]]

  def label(newLabel: String): StaticField[T] = this.copy(label = Some(newLabel))

  override protected def generateJSONWithoutValuesProvider(obj: T) = {
    val msg = createMessage(obj)
    def toStringOrNull(v: Any) = if (v == null) null else v.toString
    GenerateJSONData(
      valueJSONValue = Some(JObject(
        JField("params", JArray(msg.params.toList.flatMap(p => transformer.serialize(toStringOrNull(p)).toList))) ::
          transformer.serialize(msg.key).map(JField("key", _)).toList
      )),
      validationJSON = Nil,
      emptyValue = None,
      fieldTypeName = SpecialFieldTypes.Static
    )
  }

  override protected def generateJSONWithValuesProvider(obj: T, dp: ValuesProvider[T, String]) =
    throw new IllegalStateException()

  override def doValidate(parentPath: FieldPath, obj: T, scope: ValidationScope) = Nil

  override def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]) =
    PartiallyAppliedObj.full(obj)
}
