package org.supler

import org.json4s.JsonAST._
import org.supler.transformation.FullTransformer
import org.supler.errors._

case class PrimitiveField[T, U](
  name: String,
  read: T => U,
  write: (T, U) => T,
  validators: List[Validator[T, U]],
  valuesProvider: Option[ValuesProvider[T, U]],
  label: Option[String],
  required: Boolean,
  transformer: FullTransformer[U, _],
  renderHint: Option[FieldRenderHint]) extends SimpleField[T, U] {

  def label(newLabel: String): PrimitiveField[T, U] = this.copy(label = Some(newLabel))

  def validate(validators: Validator[T, U]*): PrimitiveField[T, U] = this.copy(validators = this.validators ++ validators)

  def renderHint(newRenderHint: FieldRenderHint): PrimitiveField[T, U] = this.copy(renderHint = Some(newRenderHint))

  def possibleValues(values: T => List[U]): PrimitiveField[T, U] = this.valuesProvider match {
    case Some(_) => throw new IllegalStateException("A values provider is already defined!")
    case None => this.copy(valuesProvider = Some(values))
  }

  override def doValidate(parentPath: FieldPath, obj: T): List[FieldErrorMessage] = {
    val v = read(obj)
    val ves = validators.flatMap(_.doValidate(obj, v))

    def valueMissing = v == null || v == None || v == ""

    val allVes = if (required && valueMissing) {
      ErrorMessage("error_valueRequired") :: ves
    } else {
      ves
    }

    allVes.map(toFieldErrorMessage(parentPath))
  }

  protected def generateJSONWithValuesProvider(obj: T, vp: ValuesProvider[T, U]) = {
    val possibleValues = vp(obj)
    val currentValue = possibleValues.indexOf(read(obj))

    GenerateJSONData(
      valueJSONValue = Some(JInt(currentValue)),
      validationJSON = JField(ValidateRequiredField, JBool(required)) :: validators.flatMap(_.generateJSON),
      fieldTypeName = SelectType,
      renderHintJSONValue = generateRenderHintJSONValue,
      extraJSON = generatePossibleValuesJSON(possibleValues)
    )
  }

  protected def generateJSONWithoutValuesProvider(obj: T) = {
    GenerateJSONData(
      valueJSONValue = transformer.serialize(read(obj)),
      validationJSON = JField(ValidateRequiredField, JBool(required)) :: validators.flatMap(_.generateJSON),
      fieldTypeName = transformer.jsonSchemaName,
      renderHintJSONValue = generateRenderHintJSONValue
    )
  }

  private def generateRenderHintJSONValue = renderHint.map(rh => JObject(
    JField("name", JString(rh.name)) :: rh.extraJSON))

  override def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): Either[FieldErrors, T] = {
    val appliedOpt = valuesProvider match {
      case Some(vp) =>
        for {
          jsonValue <- jsonFields.get(name)
          index <- jsonValue match { case JInt(index) => Some(index.intValue()); case _ => None }
          value <- vp(obj).lift(index.intValue())
        } yield {
          Right(write(obj, value))
        }
      case None =>
        for {
          jsonValue <- jsonFields.get(name)
          value = transformer.deserialize(jsonValue)
        } yield {
          value
            .left.map(msg => List(toFieldErrorMessage(parentPath)(ErrorMessage(msg))))
            .right.map(write(obj, _))
        }
    }

    appliedOpt.getOrElse(Right(obj))
  }
}

sealed abstract class FieldRenderHint(val name: String) {
  def extraJSON: List[JField] = Nil
}
case object FieldPasswordRenderHint extends FieldRenderHint("password")
case class FieldTextareaRenderHint(rows: Option[Int], cols: Option[Int]) extends FieldRenderHint("textarea") {
  override def extraJSON = rows.map(r => JField("rows", JInt(r))).toList ++ cols.map(c => JField("cols", JInt(c))).toList
}
case object FieldRadioRenderHint extends FieldRenderHint("radio")