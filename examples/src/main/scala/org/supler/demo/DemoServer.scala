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

  var person = Person("Adam", "", 10, None, None, null, List(Car("Ford", 1990), Car("Toyota", 2004)))

  def getJson(route: Route) = get { respondWithMediaType(MediaTypes.`application/json`) { route } }

  startServer(interface = "localhost", port = 8080) {
    path("rest" / "form1.json") {
      getJson {
        complete {
          PersonForm.personForm.generateJSON(person)
        }
      } ~
      post {
        entity(as[JValue]) { jvalue =>
          complete {
            val newPerson = PersonForm.personForm.applyJSONValues(person, jvalue)
            val result = PersonForm.personForm.doValidate(newPerson) match {
              case Nil =>
                person = newPerson
                println(s"Persisted: $person")
                "Persisted: " + person
              case l => "Server-side validation errors: " + l.map(fve => s"${fve.field.name}: ${fve.key}").mkString(", ")
            }

            result
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

  println("Server starting... open http://localhost:8080")
}
