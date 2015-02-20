package org.supler.field

import org.json4s.JsonAST.JInt
import org.json4s._
import org.supler._
import org.supler.validation._

case class SelectManyField[T, U](
  name: String,
  read: T => Set[U],
  write: (T, Set[U]) => T,
  validators: List[Validator[T, Set[U]]],
  valuesProvider: ValuesProvider[T, U],
  label: Option[String],
  labelForValue: U => String,
  renderHint: Option[RenderHint with SelectManyFieldCompatible],
  enabledIf: T => Boolean,
  includeIf: T => Boolean) extends Field[T] with SelectField[T, U] with ValidateWithValidators[T, Set[U]] {

  def label(newLabel: String): SelectManyField[T, U] = this.copy(label = Some(newLabel))
  def validate(validators: Validator[T, Set[U]]*): SelectManyField[T, U] = this.copy(validators = this.validators ++ validators)
  def renderHint(newRenderHint: RenderHint with SelectManyFieldCompatible): SelectManyField[T, U] = this.copy(renderHint = Some(newRenderHint))

  def enabledIf(condition: T => Boolean): SelectManyField[T, U] = this.copy(enabledIf = condition)
  def includeIf(condition: T => Boolean): SelectManyField[T, U] = this.copy(includeIf = condition)

  override def emptyValue = None
  override def required = false

  override protected def multiple = true

  protected def generateValueJSONData(obj: T) = {
    val possibleValues = valuesProvider(obj)
    val currentValues = read(obj).map(possibleValues.indexOf).filter(_ != -1)

    ValueJSONData(Some(JArray(currentValues.map(JInt(_)).toList)),
      None)
  }

  private[supler] override def applyFieldJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): PartiallyAppliedObj[T] = {
    import org.supler.validation.PartiallyAppliedObj._

    val possibleValues = valuesProvider(obj).lift
    val values = for {
      jsonValue <- jsonFields.get(name).toList
      indexes <- jsonValue match { case JArray(jindexes) => List(jindexes.collect { case JInt(idx) => idx }); case _ => Nil }
      index <- indexes
      value <- possibleValues(index.intValue()).toList
    } yield {
      value
    }

    full(write(obj, values.toSet))
  }
}

class AlmostSelectManyField[T, U](
  name: String,
  read: T => Set[U],
  write: (T, Set[U]) => T,
  labelForValue: U => String,
  renderHint: Option[RenderHint with SelectManyFieldCompatible]) {

  def possibleValues(valuesProvider: ValuesProvider[T, U]): SelectManyField[T, U] =
    SelectManyField(name, read, write, Nil, valuesProvider, None, labelForValue, renderHint,
      AlwaysCondition, AlwaysCondition)
}