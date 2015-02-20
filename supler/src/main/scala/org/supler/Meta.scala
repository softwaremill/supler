package org.supler

import org.json4s.JValue
import org.json4s.JsonAST.{JField, JObject, JString}

case class Meta(meta: Map[String, String]) {

  def apply(key: String): String = {
    meta(key)
  }

  def addMeta(key: String, value: String) = this.copy(meta = meta + (key -> value))

  def toJSON = JField(Meta.SUPLER_KEY, JObject(meta.toList.map {case (key, value) => JField(key, JString(value))}))
}

object Meta {
  val SUPLER_KEY = "supler_meta"

  def fromJSON(json: JValue) = {
    json match {
      case JObject(fields) => fields.toMap.get(SUPLER_KEY) match {
        case Some(JObject(entries)) => Meta(entries.toMap.map{case (key: String, value: JString) => key -> value.s})
        case None => Meta(Map())
      }
    }
  }
}
