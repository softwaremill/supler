package org.supler.field

import org.json4s.JsonAST.{JNull, JString, JValue}
import org.supler._
import org.supler.validation.{PartiallyAppliedObj, Validator}

case class SelectOneField[T, U](
  name: String,
  read: T => U,
  write: (T, U) => T,
  validators: List[Validator[T, U]],
  valuesProvider: ValuesProvider[T, U],
  label: Option[String],
  labelForValue: U => String,
  idForValue: Option[U => String],
  required: Boolean,
  renderHint: Option[RenderHint with SelectOneFieldCompatible],
  emptyValue: Option[U],
  enabledIf: T => Boolean,
  includeIf: T => Boolean) extends Field[T] with SelectField[T, U] with ValidateWithValidators[T, U] {

  def label(newLabel: String): SelectOneField[T, U] = this.copy(label = Some(newLabel))
  def validate(validators: Validator[T, U]*): SelectOneField[T, U] = this.copy(validators = this.validators ++ validators)
  def renderHint(newRenderHint: RenderHint with SelectOneFieldCompatible): SelectOneField[T, U] = this.copy(renderHint = Some(newRenderHint))

  def enabledIf(condition: T => Boolean): SelectOneField[T, U] = this.copy(enabledIf = condition)
  def includeIf(condition: T => Boolean): SelectOneField[T, U] = this.copy(includeIf = condition)

  def idForValue[I](idFn: U => I)(implicit idTransformer: SelectValueIdSerializer[I]): SelectOneField[T, U] =
    this.copy(idForValue = Some(idFn andThen idTransformer.toString))

  override protected def multiple = false

  protected def generateValueJSONData(obj: T) = {
    val possibleValues = valuesProvider(obj)
    val currentValueId = idFromValue(possibleValues, read(obj))
    ValueJSONData(Some(currentValueId.map(JString).getOrElse(JNull)), Some(JNull))
  }

  private[supler] override def applyFieldJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): PartiallyAppliedObj[T] = {
    import org.supler.validation.PartiallyAppliedObj._

    val value = jsonFields.get(name) match {
      case Some(JString(id)) => valueFromId(valuesProvider(obj), id)
      case Some(JNull) => emptyValue
      case _ => None
    }

    value
      .map(v => full(write(obj, v)))
      .getOrElse(full(obj))
  }
}

class AlmostSelectOneField[T, U](
  name: String,
  read: T => U,
  write: (T, U) => T,
  labelForValue: U => String,
  required: Boolean,
  renderHint: Option[RenderHint with SelectOneFieldCompatible],
  emptyValue: Option[U]) {

  def possibleValues(valuesProvider: ValuesProvider[T, U]): SelectOneField[T, U] =
    SelectOneField(name, read, write, Nil, valuesProvider, None, labelForValue, None, required, renderHint, emptyValue,
      AlwaysCondition, AlwaysCondition)
}