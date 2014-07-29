package org.supler.demo

import akka.actor.ActorSystem
import org.json4s.JValue
import spray.http.{StatusCodes, MediaTypes}
import spray.httpx.Json4sSupport
import spray.routing.{Route, SimpleRoutingApp}
import StatusCodes._

object DemoServer extends App with SimpleRoutingApp with Json4sSupport {
  implicit val actorSystem = ActorSystem()
  implicit val json4sFormats = org.json4s.DefaultFormats

  var person = Person("Adam", "", 10, None, None)

  def getJson(route: Route) = get { respondWithMediaType(MediaTypes.`application/json`) { route } }

  startServer(interface = "localhost", port = 8080) {
    pathPrefix("form1") {
      path("schema.json") {
        getJson {
          complete {
            Form1.form1.generateJSONSchema
          }
        }
      } ~
      path("data.json") {
        getJson {
          complete {
            Form1.form1.generateJSONValues(person)
          }
        } ~
        post {
          entity(as[JValue]) { jvalue =>
            complete {
              val newPerson = Form1.form1.applyJSONValues(person, jvalue)
              val result = Form1.form1.doValidate(newPerson) match {
                case Nil =>
                  person = newPerson
                  "Persisted: " + person
                case l => "Validation errors: " + l.map(fve => s"${fve.field}: ${fve.key}").mkString(", ")
              }

              result
            }
          }
        }
      }
    } ~
    pathPrefix("site") {
      getFromResourceDirectory("")
    } ~
    path("") {
      redirect("/site/index.html", Found)
    }
  }
}
