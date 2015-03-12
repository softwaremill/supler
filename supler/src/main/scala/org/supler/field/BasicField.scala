package org.supler.field

import org.json4s.JsonAST._
import org.supler._
import org.supler.validation._
import org.supler.transformation.Transformer

case class BasicField[T, U](
  name: String,
  read: T => U,
  write: (T, U) => T,
  validators: List[Validator[T, U]],
  label: Option[String],
  required: Boolean,
  transformer: Transformer[U, _],
  renderHint: Option[RenderHint with BasicFieldCompatible],
  emptyValue: Option[U],
  enabledIf: T => Boolean,
  includeIf: T => Boolean) extends Field[T] with GenerateBasicJSON[T] with ValidateWithValidators[T, U] {

  def label(newLabel: String): BasicField[T, U] = this.copy(label = Some(newLabel))

  def validate(validators: Validator[T, U]*): BasicField[T, U] = this.copy(validators = this.validators ++ validators)

  def renderHint(newRenderHint: RenderHint with BasicFieldCompatible): BasicField[T, U] = this.copy(renderHint = Some(newRenderHint))
  
  def emptyValue(newEmptyValue: Option[U]): BasicField[T, U] = this.copy(emptyValue = newEmptyValue)

  def enabledIf(condition: T => Boolean): BasicField[T, U] = this.copy(enabledIf = condition)
  def includeIf(condition: T => Boolean): BasicField[T, U] = this.copy(includeIf = condition)

  protected def generateJSONData(obj: T) = {
    BasicJSONData(
      valueJSONValue = transformer.serialize(read(obj)),
      validationJSON = JField(JSONFieldNames.ValidateRequired, JBool(required)) :: validators.flatMap(_.generateJSON),
      fieldTypeName = transformer.jsonSchemaName,
      emptyValue = emptyValue.flatMap(transformer.serialize)
    )
  }

  private[supler] override def applyFieldJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): PartiallyAppliedObj[T] = {
    import PartiallyAppliedObj._
    val appliedOpt = for {
      jsonValue <- jsonFields.get(name)
      value = transformer.deserialize(jsonValue)
    } yield {
      value.fold(
        msg => withErrors(List(toFieldErrorMessage(parentPath)(Message(msg))), obj),
        value => full(write(obj, value)))
    }

    appliedOpt.getOrElse(full(obj))
  }
}