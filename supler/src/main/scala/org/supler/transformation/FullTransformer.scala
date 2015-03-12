package org.supler.transformation

import org.json4s.JValue
import org.supler.field.{BasicFieldCompatible, RenderHint}

class FullTransformer[U, S](transformer: Transformer[U, S], jsonTransformer: JsonTransformer[S]) {
  def serialize(u: U): Option[JValue] = jsonTransformer.toJValue(transformer.serialize(u))

  def deserialize(jvalue: JValue): Either[String, U] = for {
    s <- jsonTransformer.fromJValue.lift(jvalue).toRight("cannot convert json value").right
    u <- transformer.deserialize(s).right
  } yield u

  def jsonSchemaName = jsonTransformer.jsonSchemaName

  def renderHint: Option[RenderHint with BasicFieldCompatible] = transformer.renderHint
}

object FullTransformer {
  implicit def create[U, S](implicit transformer: Transformer[U, S], jsonTransformer: JsonTransformer[S]): FullTransformer[U, S] =
    new FullTransformer[U, S](transformer, jsonTransformer)
}
