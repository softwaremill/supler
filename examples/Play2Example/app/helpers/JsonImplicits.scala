package helpers

import org.demo.core.Email
import org.joda.time.DateTime
import org.joda.time.format.ISODateTimeFormat
import org.supler.transformation.{StringTransformer, BasicTypeTransformer}


object JsonImplicits {
  /**
   * Implicit scala.Enumeration type transformer for supler
   * @param u Enumeration type value
   * @tparam U Enumeration type
   * @return
   */
  implicit def enumTransformer[U <: Enumeration](u:U) = new BasicTypeTransformer[U#Value,String] {
    override def serialize(t: U#Value) = t.toString

    override def deserialize(in: String) = try {
      Right(u.withName(in))
    } catch {
      case e: IllegalArgumentException => Left("error_custom_illegalUserStatus")
    }
  }
  implicit val dateTimeTransformer = new StringTransformer[DateTime] {
    override def serialize(t: DateTime) = ISODateTimeFormat.date().print(t)

    override def deserialize(u: String) = try {
      Right(ISODateTimeFormat.date().parseDateTime(u))
    } catch {
      case e: IllegalArgumentException => Left("error_custom_illegalDateFormat")
    }
  }
  implicit val emailTransformer = new StringTransformer[Email] {
    override def serialize(t: Email) = if (t == null) "" else t.value

    override def deserialize(u: String) = try {
      Right(Email(u))
    } catch {
      case e: IllegalArgumentException => Left("error_custom_illegalEmail")
    }
  }

}
