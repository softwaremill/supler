package org.supler

import org.json4s.JValue
import org.json4s.JsonAST.{JArray, JField, JObject}
import org.supler.errors.ValidationMode._
import org.supler.errors.{ValidationMode, EmptyPath, FieldErrors}
import org.supler.field._

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
   * Shorthand for reloading a form basing on new field values and an optional action call.
   * Calls: apply, validation (only filled), run action, generate json.
   */
  def reload(jvalue: JValue): JValue = {
    this
      .applyJSONValues(jvalue)
      .doValidate(ValidationMode.OnlyFilled)
      .runAction(jvalue) match {
      case Left(customJson) => customJson
      case Right(fwo) => fwo.generateJSON
    }
  }

  def runAction(jvalue: JValue): Either[JValue, FormWithObject[T]] = {
    form.runAction(obj, jvalue, RunActionContext(Nil)) match {
      case NoActionResult => Right(this)
      case ValueCompleteActionResult(t) => Right(InitialFormWithObject(form, t.asInstanceOf[T]))
      case JsonCompleteActionResult(json) => Left(json)
    }
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
