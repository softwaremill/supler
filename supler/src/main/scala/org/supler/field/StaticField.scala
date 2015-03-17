package org.supler.field

import org.json4s.JValue
import org.json4s.JsonAST._
import org.supler.transformation.Transformer
import org.supler.validation.{PartiallyAppliedObj, ValidationScope}
import org.supler.{FieldPath, Message}

import scala.concurrent.forkjoin.ThreadLocalRandom

case class StaticField[T](
  customName: Option[String],
  createMessage: T => Message,
  label: Option[String],
  description: Option[String],
  includeIf: T => Boolean) extends Field[T] with GenerateBasicJSON[T] {

  val generatedName = "_supler_static_" + ThreadLocalRandom.current().nextInt()
  def name = customName.getOrElse(generatedName)
  def name(name: String): StaticField[T] = this.copy(customName = Some(name))

  val renderHint = None

  def label(newLabel: String): StaticField[T] = this.copy(label = Some(newLabel))
  def description(newDescription: String): StaticField[T] = this.copy(description = Some(newDescription))

  val enabledIf: T => Boolean = AlwaysCondition
  def includeIf(condition: T => Boolean): StaticField[T] = this.copy(includeIf = condition)

  private val transformer = implicitly[Transformer[String, String]]

  override protected def generateJSONData(obj: T) = {
    val msg = createMessage(obj)
    def toStringOrNull(v: Any) = if (v == null) null else v.toString
    BasicJSONData(
      valueJSONValue = Some(JObject(
        JField("params", JArray(msg.params.toList.flatMap(p => transformer.serialize(toStringOrNull(p)).toList))) ::
          transformer.serialize(msg.key).map(JField("key", _)).toList
      )),
      validationJSON = Nil,
      emptyValue = None,
      fieldTypeName = SpecialFieldTypes.Static
    )
  }

  override private[supler] def doValidate(parentPath: FieldPath, obj: T, scope: ValidationScope) = Nil

  override private[supler] def applyFieldJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]) =
    PartiallyAppliedObj.full(obj)
}
