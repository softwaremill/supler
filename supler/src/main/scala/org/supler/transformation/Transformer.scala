package org.supler.transformation

trait Transformer[U, S] {
  def serialize(u: U): S
  def deserialize(s: S): Either[String, U]
}

// convenience traits for extension by custom transformers; one for each of the types which have a json transformer
trait StringTransformer[U] extends Transformer[U, String]
trait IntTransformer[U] extends Transformer[U, Int]
trait LongTransformer[U] extends Transformer[U, Long]
trait FloatTransformer[U] extends Transformer[U, Float]
trait DoubleTransformer[U] extends Transformer[U, Double]
trait BooleanTransformer[U] extends Transformer[U, Boolean]

object Transformer {
  trait IdentityTransformer[U] extends Transformer[U, U] {
    override def serialize(u: U) = u
    override def deserialize(u: U) = Right(u)
  }

  // if the type has a corresponding json transformer, no need to transform further
  implicit object StringIdTransformer extends IdentityTransformer[String]
  implicit object IntIdTransformer extends IdentityTransformer[Int]
  implicit object LongIdTransformer extends IdentityTransformer[Long]
  implicit object FloatIdTransformer extends IdentityTransformer[Float]
  implicit object DoubleIdTransformer extends IdentityTransformer[Double]
  implicit object BooleanIdTransformer extends IdentityTransformer[Boolean]

  implicit def optionTransformer[U, S](implicit base: Transformer[U, S]) = new Transformer[Option[U], Option[S]] {
    override def serialize(u: Option[U]) = u.map(base.serialize)
    override def deserialize(s: Option[S]) = s.map(base.deserialize) match {
      case None => Right(None)
      case Some(d) => d.right.map(Some(_))
    }
  }
}
