package org.supler.field

import org.supler.{Message, FieldPath}
import org.supler.validation.{Validator, FieldErrorMessage, ValidationScope}

trait ValidateWithValidators[T, U] {
  this: Field[T] =>

  def read: T => U
  def validators: List[Validator[T, U]]
  def emptyValue: Option[U]
  def required: Boolean

  private[supler] override def doValidate(parentPath: FieldPath, obj: T, scope: ValidationScope): List[FieldErrorMessage] = {
    val v = read(obj)
    val valueMissing = v == null || v == None || Some(v) == emptyValue

    if (scope.shouldValidate(parentPath, valueMissing)) {
      val ves = if (v != null) validators.flatMap(_.doValidate(v, obj)) else Nil

      val allVes = if (required && valueMissing) {
        Message("error_valueRequired") :: ves
      } else {
        ves
      }

      allVes.map(toFieldErrorMessage(parentPath))
    } else Nil
  }

  protected def toFieldErrorMessage(parentPath: FieldPath)(errorMessage: Message) =
    FieldErrorMessage(this, parentPath.append(name), errorMessage)
}
