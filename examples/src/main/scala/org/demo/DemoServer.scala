package org.demo

import akka.actor.ActorSystem
import org.json4s.JsonAST.{JValue, JString}
import org.supler.Supler
import org.supler.field.ActionResult
import spray.http.HttpHeaders._
import spray.http.{AllOrigins, MediaTypes}
import spray.http.StatusCodes._
import spray.httpx.Json4sSupport
import spray.routing.{Route, SimpleRoutingApp}
import Directives._

object DemoServer extends App with SuplerServerSupport with Json4sSupport with DocsForm {

  var person = PersonForm.aPerson

  val saveAction = Supler.action[PersonForm.Person]("save") { p =>
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
    } ~ htmlJsRoutes ~ docsFormRoutes
  }

  println(s"Server starting... open http://localhost:$port")
}

trait SuplerServerSupport extends SimpleRoutingApp {
  implicit val actorSystem = ActorSystem()
  implicit val json4sFormats = org.json4s.DefaultFormats

  lazy val (port, suplerJsDirective, sourceMapDirective) = if (System.getProperty("supler.demo.production") != null) {
    (8195, getFromResourceDirectory(""), getFromResourceDirectory(""))
  } else {
    (8080, getFromDirectory("./supler-js/target"), getFromDirectory("./supler-js"))
    // compiled by grunt
  }

  lazy val htmlJsRoutes = {
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
}

trait DocsForm extends SimpleRoutingApp with Json4sSupport {
  import DocsPersonForm._

  lazy val docsFormRoutes = corsSupport {
    path("rest" / "docsform.json") {
      getJson {
        complete {
          docsPersonForm(aDocsPerson).generateJSON
        }
      } ~
      post {
        entity(as[JValue]) { jvalue =>
          complete {
            docsPersonForm(aDocsPerson).process(jvalue).generateJSON
          }
        }
      } ~
      // http://stackoverflow.com/questions/1256593/jquery-why-am-i-getting-an-options-request-instead-of-a-get-request
      options {
        complete { "" }
      }
    }
  }

  def corsSupport(r: Route) = respondWithHeader(`Access-Control-Allow-Origin`(AllOrigins)) {
    respondWithHeader(`Access-Control-Allow-Headers`(`Content-Type`.name)) {
      r
    }
  }
}

object Directives {
  import spray.routing.directives.MethodDirectives._
  import spray.routing.directives.RespondWithDirectives._
  def getJson(route: Route) = get { respondWithMediaType(MediaTypes.`application/json`) { route } }
}