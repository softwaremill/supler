package org.supler.errors

import org.json4s.JField
import org.json4s.JsonAST.JInt

trait Validator[T, U] {
  def doValidate(objValue: T, fieldValue: U): List[ErrorMessage]
  def generateJSON: List[JField]
}

trait Validators {
  def minLength[T](minLength: Int) =
    fieldValidator[T, String](_.length < minLength)(_ => ErrorMessage("error_length_tooShort", minLength))(List(JField("min_length", JInt(minLength))))

  def maxLength[T](maxLength: Int) =
    fieldValidator[T, String](_.length > maxLength)(_ => ErrorMessage("error_length_tooLong", maxLength))(List(JField("max_length", JInt(maxLength))))

  def gt[T](than: Int) =
    fieldValidator[T, Int](_ <= than)(_ => ErrorMessage("error_number_gt", than))(
      List(JField("gt", JInt(than))))

  def lt[T](than: Int) =
    fieldValidator[T, Int](_ >= than)(_ => ErrorMessage("error_number_lt", than))(
      List(JField("lt", JInt(than))))

  def ge[T](than: Int) =
    fieldValidator[T, Int](_ < than)(_ => ErrorMessage("error_number_ge", than))(
      List(JField("ge", JInt(than))))

  def le[T](than: Int) =
    fieldValidator[T, Int](_ > than)(_ => ErrorMessage("error_number_le", than))(
      List(JField("le", JInt(than))))

  def custom[T, U](errorTest: (T, U) => Boolean, createError: (T, U) => ErrorMessage): Validator[T, U] = new Validator[T, U] {
    override def doValidate(objValue: T, fieldValue: U) = {
      if (errorTest(objValue, fieldValue)) {
        List(createError(objValue, fieldValue))
      } else {
        Nil
      }
    }
    override def generateJSON = Nil
  }

  private def fieldValidator[T, U](errorTest: U => Boolean)(createError: U => ErrorMessage)(json: List[JField]) =
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
