package org.supler.demo

import akka.actor.ActorSystem
import org.joda.time.DateTime
import org.json4s.JValue
import org.json4s.JsonAST.JString
import org.supler.Supler
import org.supler.field.ActionResult
import spray.http.MediaTypes
import spray.http.StatusCodes._
import spray.httpx.Json4sSupport
import spray.routing.{Route, SimpleRoutingApp}

object DemoServer extends App with SimpleRoutingApp with Json4sSupport {
  implicit val actorSystem = ActorSystem()
  implicit val json4sFormats = org.json4s.DefaultFormats

  var person = Person("Adam", "", new DateTime(), 10, None, None, null, None, None,
    Set("red", "blue"), likesBroccoli = false,
    List(
      Car("Ford", "Focus", 1990),
      Car("Toyota", "Avensis", 2004)),
    List(
      LegoSet("Motorcycle", "Technic", 1924, 31),
      LegoSet("Arctic Supply Plane", "City", 60064, 1),
      LegoSet("Princess and Horse", "Duplo", 4825, 7)),
    new DateTime(2012, 2, 19, 0, 0))

  def getJson(route: Route) = get { respondWithMediaType(MediaTypes.`application/json`) { route } }

  val (port, suplerJsDirective, sourceMapDirective) = if (System.getProperty("supler.demo.production") != null) {
    (8195, getFromResourceDirectory(""), getFromResourceDirectory(""))
  } else {
    (8080, getFromDirectory("./supler-js/target"), getFromDirectory("./supler-js"))
    // compiled by grunt
  }

  val saveAction = Supler.action[Person]("save") { p =>
    person = p
    println(s"Persisted: $person")
    ActionResult.custom(JString("Persisted: " + person))
  }.label("Save").validateAll()

  val personFormWithSave = PersonForm.personForm + saveAction

  startServer(interface = "localhost", port = port) {
    path("rest" / "form1.json") {
      getJson {
        complete {
          personFormWithSave(person).generateJSON
        }
      } ~
      post {
        entity(as[JValue]) { jvalue =>
          complete {
            personFormWithSave(person).process(jvalue).generateJSON
          }
        }
      }
    } ~
    pathSuffixTest(".+\\.ts".r) { id =>
      sourceMapDirective
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
