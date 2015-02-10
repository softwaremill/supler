package org.supler.validation

import org.json4s.JField
import org.json4s.JsonAST.JInt
import org.supler.Message

trait Validator[T, U] {
  def doValidate(fieldValue: U, objValue: T): List[Message]
  def generateJSON: List[JField]
}

trait Validators {
  def minLength[T](minLength: Int) =
    fieldValidator[T, String](_.length >= minLength)(_ => Message("error_length_tooShort", minLength))(Some(JField("min_length", JInt(minLength))))

  def maxLength[T](maxLength: Int) =
    fieldValidator[T, String](_.length <= maxLength)(_ => Message("error_length_tooLong", maxLength))(Some(JField("max_length", JInt(maxLength))))

  def gt[T](than: Int) =
    fieldValidator[T, Int](_ > than)(_ => Message("error_number_gt", than))(
      Some(JField("gt", JInt(than))))

  def lt[T](than: Int) =
    fieldValidator[T, Int](_ < than)(_ => Message("error_number_lt", than))(
      Some(JField("lt", JInt(than))))

  def ge[T](than: Int) =
    fieldValidator[T, Int](_ >= than)(_ => Message("error_number_ge", than))(
      Some(JField("ge", JInt(than))))

  def le[T](than: Int) =
    fieldValidator[T, Int](_ <= than)(_ => Message("error_number_le", than))(
      Some(JField("le", JInt(than))))

  def ifDefined[T, U](vs: Validator[T, U]*): Validator[T, Option[U]] =
    new Validator[T, Option[U]] {
      override def doValidate(fieldValue: Option[U], objValue: T) =
        fieldValue.map(fv => vs.toList.flatMap(_.doValidate(fv, objValue))).getOrElse(Nil)
      override def generateJSON = vs.flatMap(_.generateJSON).toList
    }

  def custom[T, U](validityTest: (U, T) => Boolean, createError: (U, T) => Message): Validator[T, U] = new Validator[T, U] {
    override def doValidate(fieldValue: U, objValue: T) = {
      if (!validityTest(fieldValue, objValue)) {
        List(createError(fieldValue, objValue))
      } else {
        Nil
      }
    }
    override def generateJSON = Nil
  }

  private def fieldValidator[T, U](validityTest: U => Boolean)(createError: U => Message)(json: Some[JField]) =
    new Validator[T, U] {
      override def doValidate(fieldValue: U, objValue: T) = {
        if (!validityTest(fieldValue)) {
          List(createError(fieldValue))
        } else {
          Nil
        }
      }

      override def generateJSON = json.toList
    }
}
