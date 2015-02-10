package org.supler.validation

import org.json4s.JField
import org.json4s.JsonAST.JInt
import org.supler.Message

trait Validator[T, U] {
  def doValidate(objValue: T, fieldValue: U): List[Message]
  def generateJSON: List[JField]
}

trait Validators {
  def minLength[T](minLength: Int) =
    fieldValidator[T, String](_.length < minLength)(_ => Message("error_length_tooShort", minLength))(Some(JField("min_length", JInt(minLength))))

  def maxLength[T](maxLength: Int) =
    fieldValidator[T, String](_.length > maxLength)(_ => Message("error_length_tooLong", maxLength))(Some(JField("max_length", JInt(maxLength))))

  def gt[T](than: Int) =
    fieldValidator[T, Int](_ <= than)(_ => Message("error_number_gt", than))(
      Some(JField("gt", JInt(than))))

  def lt[T](than: Int) =
    fieldValidator[T, Int](_ >= than)(_ => Message("error_number_lt", than))(
      Some(JField("lt", JInt(than))))

  def ge[T](than: Int) =
    fieldValidator[T, Int](_ < than)(_ => Message("error_number_ge", than))(
      Some(JField("ge", JInt(than))))

  def le[T](than: Int) =
    fieldValidator[T, Int](_ > than)(_ => Message("error_number_le", than))(
      Some(JField("le", JInt(than))))

  def ifDefined[T, U](vs: Validator[T, U]*): Validator[T, Option[U]] =
    new Validator[T, Option[U]] {
      override def doValidate(objValue: T, fieldValue: Option[U]) =
        fieldValue.map(fv => vs.toList.flatMap(_.doValidate(objValue, fv))).getOrElse(Nil)
      override def generateJSON = vs.flatMap(_.generateJSON).toList
    }

  def custom[T, U](errorTest: (T, U) => Boolean, createError: (T, U) => Message): Validator[T, U] = new Validator[T, U] {
    override def doValidate(objValue: T, fieldValue: U) = {
      if (errorTest(objValue, fieldValue)) {
        List(createError(objValue, fieldValue))
      } else {
        Nil
      }
    }
    override def generateJSON = Nil
  }

  private def fieldValidator[T, U](errorTest: U => Boolean)(createError: U => Message)(json: Some[JField]) =
    new Validator[T, U] {
      override def doValidate(objValue: T, fieldValue: U) = {
        if (errorTest(fieldValue)) {
          List(createError(fieldValue))
        } else {
          Nil
        }
      }

      override def generateJSON = json.toList
    }
}
