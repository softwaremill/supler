package org.supler

import org.json4s.JField
import org.json4s.JsonAST.JInt

trait Validator[T, U] {
  def doValidate(objValue: T, fieldValue: U): List[ValidationError]
  def generateJSON: List[JField]
}

case class ValidationError(key: String, params: Any*)

trait Validators {
  def minLength[T](minLength: Int) =
    fieldValidator[T, String](_.length < minLength)(_ => ValidationError("Too short"))(List(JField("minLength", JInt(minLength))))

  def maxLength[T](maxLength: Int) =
    fieldValidator[T, String](_.length > maxLength)(_ => ValidationError("Too long"))(List(JField("maxLength", JInt(maxLength))))

  def gt[T](than: Int) =
    fieldValidator[T, Int](_ <= than)(_ => ValidationError(s"Must be greater than $than"))(
      List(JField("gt", JInt(than))))

  def lt[T](than: Int) =
    fieldValidator[T, Int](_ >= than)(_ => ValidationError(s"Must be less than $than"))(
      List(JField("lt", JInt(than))))

  def ge[T](than: Int) =
    fieldValidator[T, Int](_ < than)(_ => ValidationError(s"Must be greater or equal to $than"))(
      List(JField("ge", JInt(than))))

  def le[T](than: Int) =
    fieldValidator[T, Int](_ > than)(_ => ValidationError(s"Must be less or equal to $than"))(
      List(JField("le", JInt(than))))

  def custom[T, U](errorTest: (T, U) => Boolean, createError: (T, U) => ValidationError): Validator[T, U] = new Validator[T, U] {
    override def doValidate(objValue: T, fieldValue: U) = {
      if (errorTest(objValue, fieldValue)) {
        List(createError(objValue, fieldValue))
      } else {
        Nil
      }
    }
    override def generateJSON = Nil
  }

  private def fieldValidator[T, U](errorTest: U => Boolean)(createError: U => ValidationError)(json: List[JField]) =
    new Validator[T, U] {
      override def doValidate(objValue: T, fieldValue: U) = {
        if (errorTest(fieldValue)) {
          List(createError(fieldValue))
        } else {
          Nil
        }
      }

      override def generateJSON = json
    }
}
