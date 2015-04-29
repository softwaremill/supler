package org.supler

import org.json4s.JsonAST.{JObject, JString}
import org.json4s._

object FormModals {
  val JsonModalsKey = "supler_modals"

  def fromJSON(json: JValue): Option[String] = {
    json match {
      case JObject(fields) => fields.toMap.get(JsonModalsKey) match {
        case Some(JString(modalPath)) => Some(modalPath)
        case Some(_) => throw new IllegalArgumentException("Form supler_modals is not well formed")
        case None => None
      }
      case _ => None
    }
  }
}
