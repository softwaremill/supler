package org.supler

import org.json4s.JValue
import org.json4s.JsonAST.{JField, JObject, JString}

case class FormMeta(meta: Map[String, String]) {

  def apply(key: String): String = {
    meta(key)
  }

  def +(key: String, value: String) = this.copy(meta = meta + (key -> value))

  def toJSON = JField(FormMeta.JsonMetaKey, JObject(meta.toList.map {case (key, value) => JField(key, JString(value))}))
  
  def isEmpty = meta.isEmpty
}

object FormMeta {
  val JsonMetaKey = "supler_meta"

  def fromJSON(json: JValue) = {
    json match {
      case JObject(fields) => fields.toMap.get(JsonMetaKey) match {
        case Some(JObject(entries)) => FormMeta(entries.toMap.collect{case (key: String, value: JString) => key -> value.s})
        case Some(_) => throw new IllegalArgumentException("Form meta is not well formed")
        case None => FormMeta(Map())
      }
      case _ => FormMeta(Map())
    }
  }
}
