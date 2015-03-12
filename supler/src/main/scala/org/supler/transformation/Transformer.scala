package org.supler.transformation

import org.json4s.JValue
import org.supler.field.{BasicFieldCompatible, RenderHint}

class Transformer[U, S](basicTypeTransformer: BasicTypeTransformer[U, S], jsonTransformer: JsonTransformer[S]) {
  def serialize(u: U): Option[JValue] = jsonTransformer.toJValue(basicTypeTransformer.serialize(u))

  def deserialize(jvalue: JValue): Either[String, U] = for {
    s <- jsonTransformer.fromJValue.lift(jvalue).toRight("cannot convert json value").right
    u <- basicTypeTransformer.deserialize(s).right
  } yield u

  def jsonSchemaName = jsonTransformer.jsonSchemaName

  def renderHint: Option[RenderHint with BasicFieldCompatible] = basicTypeTransformer.renderHint
}

object Transformer {
  implicit def create[U, S](
    implicit basicTypeTransformer: BasicTypeTransformer[U, S], jsonTransformer: JsonTransformer[S]): Transformer[U, S] =
    new Transformer[U, S](basicTypeTransformer, jsonTransformer)
}
