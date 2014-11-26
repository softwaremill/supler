package org.supler.field

import org.json4s.JsonAST.JField
import org.json4s._
import org.supler._
import org.supler.errors.ValidationMode._
import org.supler.errors._
import org.supler.transformation.FullTransformer

case class SetField[T, U](
  name: String,
  read: T => Set[U],
  write: (T, Set[U]) => T,
  validators: List[Validator[T, Set[U]]],
  valuesProvider: Option[ValuesProvider[T, U]],
  label: Option[String],
  transformer: FullTransformer[U, _],
  renderHint: Option[RenderHint with SetFieldCompatible]) extends Field[T, U] with NonNestedFieldJSON[T, U] {

  def label(newLabel: String): SetField[T, U] = this.copy(label = Some(newLabel))

  def validate(validators: Validator[T, Set[U]]*): SetField[T, U] = this.copy(validators = this.validators ++ validators)

  def renderHint(newRenderHint: RenderHint with SetFieldCompatible): SetField[T, U] = this.copy(renderHint = Some(newRenderHint))

  def possibleValues(values: ValuesProvider[T, U]): SetField[T, U] = this.valuesProvider match {
    case Some(_) => throw new IllegalStateException("A values provider is already defined!")
    case None => this.copy(valuesProvider = Some(values))
  }

  override def doValidate(parentPath: FieldPath, obj: T, mode: ValidationMode): List[FieldErrorMessage] = {
    val v = read(obj)
    val ves = validators.flatMap(_.doValidate(obj, v))
    ves.map(toFieldErrorMessage(parentPath))
  }

  protected def generateJSONWithValuesProvider(obj: T, vp: ValuesProvider[T, U]) = {
    val possibleValues = vp(obj)
    val currentValues = read(obj).map(possibleValues.indexOf).filter(_ != -1)

    GenerateJSONData(
      valueJSONValue = Some(JArray(currentValues.map(JInt(_)).toList)),
      validationJSON = validators.flatMap(_.generateJSON),
      fieldTypeName = SpecialFieldTypes.Select,
      extraJSON = JField(JSONFieldNames.Multiple, JBool(value = true)) :: generatePossibleValuesJSON(possibleValues)
    )
  }

  protected def generateJSONWithoutValuesProvider(obj: T) = {
    GenerateJSONData(
      valueJSONValue = Some(JArray(read(obj).toList.flatMap(i => transformer.serialize(i)))),
      validationJSON = validators.flatMap(_.generateJSON),
      fieldTypeName = transformer.jsonSchemaName
    )
  }

  override def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): PartiallyAppliedObj[T] = {
    import PartiallyAppliedObj._

    valuesProvider match {
      case Some(vp) =>
        val possibleValues = vp(obj).lift
        val values = for {
          jsonValue <- jsonFields.get(name).toList
          indexes <- jsonValue match { case JArray(jindexes) => List(jindexes.collect { case JInt(idx) => idx }); case _ => Nil }
          index <- indexes
          value <- possibleValues(index.intValue()).toList
        } yield {
          value
        }

        full(write(obj, values.toSet))

      case None =>
        val errorsOrValues = for {
          JArray(jsonValues) <- jsonFields.get(name).toList
          jsonValue <- jsonValues
        } yield {
          transformer.deserialize(jsonValue)
            .left.map(msg => List(toFieldErrorMessage(parentPath)(Message(msg))))
        }

        val (errors, values) = errorsOrValues.foldLeft(Nil: FieldErrors, Set[U]()) {
          case ((errors, values), errorOrValue) =>
            errorOrValue.fold(
              es => (es ++ errors, values),
              v => (errors, values + v))
        }

        withErrors(errors, values).map(write(obj, _))
    }
  }

  private def toFieldErrorMessage(parentPath: FieldPath)(errorMessage: Message) =
    FieldErrorMessage(this, parentPath.append(name), errorMessage)
}
