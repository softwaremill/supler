package org.supler.demo

import akka.actor.ActorSystem
import spray.http.MediaTypes
import spray.httpx.Json4sSupport
import spray.routing.SimpleRoutingApp

object DemoServer extends App with SimpleRoutingApp with Json4sSupport {
  implicit val actorSystem = ActorSystem()
  implicit val json4sFormats = org.json4s.DefaultFormats

  val person = Person("Adam", "", 10, None, None)

  startServer(interface = "localhost", port = 8080) {
    pathPrefix("form1") {
      get {
        respondWithMediaType(MediaTypes.`application/json`) {
          path("schema") {
            complete {
              Form1.form1.generateJSONSchema
            }
          } ~ path("data") {
            complete {
              Form1.form1.generateJSONValues(person)
            }
          }
        }
      }
    }
  }
}
