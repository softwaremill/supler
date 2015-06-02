package helpers

import org.supler.transformation.{BasicTypeTransformer}


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
}
