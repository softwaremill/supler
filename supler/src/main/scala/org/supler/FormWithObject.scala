package org.supler

import org.json4s.JValue
import org.json4s.JsonAST.{JArray, JField, JObject}
import org.supler.errors.ValidationMode._
import org.supler.errors.{ValidationMode, EmptyPath, FieldErrors}

trait FormWithObject[T] {
  def obj: T
  def form: Form[T]

  protected def applyErrors: FieldErrors
  protected def validationErrors: FieldErrors
  protected def allErrors: FieldErrors = applyErrors ++ validationErrors

  def applyJSONValues(jvalue: JValue): AppliedFormWithObject[T] = {
    val result = form.applyJSONValues(EmptyPath, obj, jvalue)

    new AppliedFormWithObject(form, result.obj) {
      override protected def applyErrors = result.errors
      override protected def validationErrors = Nil
    }
  }

  def doValidate(mode: ValidationMode = ValidationMode.All): ValidatedFormWithObject[T] = {
    val currentApplyErrors = applyErrors
    val newValidationErrors = form.doValidate(EmptyPath, obj, mode)

    new ValidatedFormWithObject(form, obj) {
      override protected def applyErrors = currentApplyErrors
      override protected def validationErrors = newValidationErrors
    }
  }

  def generateJSON: JValue = {
    JObject(
      JField("main_form", form.generateJSON(EmptyPath, obj)),
      JField("errors", JArray(allErrors.map(_.generateJSON)))
    )
  }

  /**
   * Shorthand for refreshing a form basing on new field values.
   * Calls: apply, validation (only filled) and generate json.
   */
  def refresh(jvalue: JValue): JValue = {
    this
      .applyJSONValues(jvalue)
      .doValidate(ValidationMode.OnlyFilled)
      .generateJSON
  }
}

trait ExposeErrors[T] extends FormWithObject[T] {
  def errors: FieldErrors = allErrors
  def hasErrors: Boolean = allErrors.size > 0
  def fold[U](whenErrors: T => U)(whenNoErrors: T => U): U =
    if (errors.size > 0) whenErrors(obj) else whenNoErrors(obj)
}

case class InitialFormWithObject[T](form: Form[T], obj: T) extends FormWithObject[T] {
  protected val applyErrors = Nil
  protected val validationErrors = Nil
}

abstract case class AppliedFormWithObject[T](form: Form[T], obj: T) extends FormWithObject[T] with ExposeErrors[T]
abstract case class ValidatedFormWithObject[T](form: Form[T], obj: T) extends FormWithObject[T] with ExposeErrors[T]
