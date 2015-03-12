package org.supler.transformation

import org.json4s.JValue
import org.supler.field.{BasicFieldCompatible, RenderHint}

class Transformer[U, S](basicTypeTransformer: BasicTypeTransformer[U, S], jsonTransformer: JsonTransformer[S]) {
  def serialize(u: U): Option[JValue] = jsonTransformer.toJValueOrJNull(basicTypeTransformer.serialize(u))

  def deserialize(jvalue: JValue): Either[String, U] = for {
    s <- jsonTransformer.fromJValue(jvalue).toRight("cannot convert json value").right
    u <- basicTypeTransformer.deserialize(s).right
  } yield u

  def typeName = jsonTransformer.typeName

  def renderHint: Option[RenderHint with BasicFieldCompatible] = basicTypeTransformer.renderHint
}

object Transformer {
  implicit def createFromBasicAndJson[U, S](
    implicit basicTypeTransformer: BasicTypeTransformer[U, S], jsonTransformer: JsonTransformer[S]): Transformer[U, S] =
    new Transformer[U, S](basicTypeTransformer, jsonTransformer)

  implicit def createFromJson[S](
    implicit jsonTransformer: JsonTransformer[S]): Transformer[S, S] =
    new Transformer[S, S](new BasicTypeTransformer.IdentityTransformer[S] {}, jsonTransformer)
}
