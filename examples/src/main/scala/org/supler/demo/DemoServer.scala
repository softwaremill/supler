package org.supler.demo

import akka.actor.ActorSystem
import org.json4s.JValue
import org.json4s.JsonAST.{JObject, JField, JString}
import spray.http.{StatusCodes, MediaTypes}
import spray.httpx.Json4sSupport
import spray.routing.{Route, SimpleRoutingApp}
import StatusCodes._

object DemoServer extends App with SimpleRoutingApp with Json4sSupport {
  implicit val actorSystem = ActorSystem()
  implicit val json4sFormats = org.json4s.DefaultFormats

  var person = Person("Adam", "", 10, None, None, null,
    List(
      Car("Ford", 1990),
      Car("Toyota", 2004)),
    List(
      LegoSet("Motorcycle", "Technic", 1924, 31),
      LegoSet("Arctic Supply Plane", "City", 60064, 0),
      LegoSet("Princess and Horse", "Duplo", 4825, 7)))

  def getJson(route: Route) = get { respondWithMediaType(MediaTypes.`application/json`) { route } }

  val (port, suplerJsDirective) = if (System.getProperty("supler.demo.production") != null) {
    (8195, getFromResourceDirectory(""))
  } else {
    (8080, getFromDirectory("./supler-js/app/scripts/compiled")) // compiled by grunt
  }

  startServer(interface = "localhost", port = port) {
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
            val result = PersonForm.personForm.doValidate(newPerson)

            if (result.hasErrors) {
              JObject(JField("validation_errors", result.generateJSON))
            } else {
              person = newPerson
              println(s"Persisted: $person")

              JObject(JField("msg", JString("Persisted: " + person)))
            }
          }
        }
      }
    } ~
    pathPrefix("site") {
      getFromResourceDirectory("")
    } ~
    pathPrefix("supler-js") {
      suplerJsDirective
    } ~
    path("") {
      redirect("/site/index.html", Found)
    }
  }

  println(s"Server starting... open http://localhost:$port")
}
