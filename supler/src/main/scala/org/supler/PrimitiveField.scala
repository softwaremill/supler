package org.supler

import org.json4s.JsonAST.{JString, JObject, JField}
import org.json4s._
import org.supler.validation.{FieldValidationError, FieldPath, ValidationError, Validator}

case class PrimitiveField[T, U](
  name: String,
  read: T => U,
  write: (T, U) => T,
  validators: List[Validator[T, U]],
  dataProvider: Option[DataProvider[T, U]],
  label: Option[String],
  required: Boolean,
  fieldType: FieldType[U],
  renderHint: Option[FieldRenderHint]) extends SimpleField[T, U] {

  def label(newLabel: String): PrimitiveField[T, U] = this.copy(label = Some(newLabel))

  def validate(validators: Validator[T, U]*): PrimitiveField[T, U] = this.copy(validators = this.validators ++ validators)

  def renderHint(newRenderHint: FieldRenderHint): PrimitiveField[T, U] = this.copy(renderHint = Some(newRenderHint))

  def use(dataProvider: DataProvider[T, U]): PrimitiveField[T, U] = this.dataProvider match {
    case Some(_) => throw new IllegalStateException("A data provider is already defined!")
    case None => this.copy(dataProvider = Some(dataProvider))
  }

  override def doValidate(parentPath: FieldPath, obj: T): List[FieldValidationError] = {
    val v = read(obj)
    val ves = validators.flatMap(_.doValidate(obj, v))

    def valueMissing = v == null || !fieldType.valuePresent(v)

    val allVes = if (required && valueMissing) {
      ValidationError("Value is required") :: ves
    } else {
      ves
    }

    allVes.map(ve => FieldValidationError(this, parentPath.append(name), ve))
  }

  protected def generateJSONWithDataProvider(obj: T, dp: DataProvider[T, U]) = {
    val possibleValues = dp.provider(obj)
    val currentValue = possibleValues.indexOf(read(obj))

    GenerateJSONData(
      valueJSONValue = Some(JInt(currentValue)),
      validationJSON = JField(ValidateRequiredField, JBool(required)) :: validators.flatMap(_.generateJSON),
      fieldTypeName = SelectType,
      renderHintJSONValue = generateRenderHintJSONValue,
      extraJSON = generatePossibleValuesJSON(possibleValues)
    )
  }

  protected def generateJSONWithoutDataProvider(obj: T) = {
    GenerateJSONData(
      valueJSONValue = fieldType.toJValue(read(obj)),
      validationJSON = JField(ValidateRequiredField, JBool(required)) :: validators.flatMap(_.generateJSON),
      fieldTypeName = fieldType.jsonSchemaName,
      renderHintJSONValue = generateRenderHintJSONValue
    )
  }

  private def generateRenderHintJSONValue = renderHint.map(rh => JObject(
    JField("name", JString(rh.name)) :: rh.extraJSON))

  override def applyJSONValues(obj: T, jsonFields: Map[String, JValue]): T = {
    val appliedOpt = dataProvider match {
      case Some(dp) =>
        for {
          jsonValue <- jsonFields.get(name)
          index <- jsonValue match { case JInt(index) => Some(index.intValue()); case _ => None }
          value <- dp.provider(obj).lift(index.intValue())
        } yield {
          write(obj, value)
        }
      case None => {
        for {
          jsonValue <- jsonFields.get(name)
          value <- fieldType.fromJValue.lift(jsonValue)
        } yield {
          write(obj, value)
        }
      }
    }

    appliedOpt.getOrElse(obj)
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