package org.supler

trait Validator[T, U] {
  def doValidate(objValue: T, fieldValue: U): List[ValidationError]
}

case class ValidationError(key: String, params: Any*)

trait Validators {
  def minLength[T](minLength: Int) = fieldValidator[T, String](_.length < minLength)(_ => ValidationError("Too short"))
  def maxLength[T](maxLength: Int) = fieldValidator[T, String](_.length > maxLength)(_ => ValidationError("Too long"))
  def gt[T](than: Int) = fieldValidator[T, Int](_ > than)(_ => ValidationError(s"Must be greater than $than"))
  def lt[T](than: Int) = fieldValidator[T, Int](_ < than)(_ => ValidationError(s"Must be less than $than"))
  def ge[T](than: Int) = fieldValidator[T, Int](_ >= than)(_ => ValidationError(s"Must be greater or equal to $than"))
  def le[T](than: Int) = fieldValidator[T, Int](_ <= than)(_ => ValidationError(s"Must be less or equal to $than"))

  def custom[T, U](test: (T, U) => Boolean, createError: (T, U) => ValidationError): Validator[T, U] = new Validator[T, U] {
    override def doValidate(objValue: T, fieldValue: U) = {
      if (test(objValue, fieldValue)) {
        List(createError(objValue, fieldValue))
      } else {
        Nil
      }
    }
  }

  private def fieldValidator[T, U](test: U => Boolean)(createError: U => ValidationError) = new Validator[T, U] {
    override def doValidate(objValue: T, fieldValue: U) = {
      if (!test(fieldValue)) {
        List(createError(fieldValue))
      } else {
        Nil
      }
    }
  }
}
