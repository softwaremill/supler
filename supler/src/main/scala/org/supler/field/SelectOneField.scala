package org.supler.field

import org.json4s.JsonAST.{JInt, JValue}
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

  override protected def multiple = false

  protected def generateValueJSONData(obj: T) = {
    val possibleValues = valuesProvider(obj)
    val currentValue = possibleValues.indexOf(read(obj))
    ValueJSONData(Some(JInt(currentValue)),
      if (currentValue == -1 || !required) Some(JInt(-1)) else None)
  }

  private[supler] override def applyFieldJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): PartiallyAppliedObj[T] = {
    import org.supler.validation.PartiallyAppliedObj._
    val appliedOpt = for {
      jsonValue <- jsonFields.get(name)
      index <- jsonValue match { case JInt(index) => Some(index.intValue()); case _ => None }
      value <- valuesProvider(obj).lift(index.intValue())
    } yield {
      full(write(obj, value))
    }

    appliedOpt.getOrElse(full(obj))
  }
}
