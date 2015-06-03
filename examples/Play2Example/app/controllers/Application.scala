package controllers

import scala.concurrent.ExecutionContext.Implicits.global

import org.demo.{PersonForm, Person}
import play.api._
import play.api.mvc._

import com.github.tototoshi.play2.json4s.native._
object Application extends Controller with Json4s{

  def checkPreFlight(path: String) = Action {
    implicit request =>
      Ok("OK").withHeaders("Access-Control-Allow-Origin" -> "*", "Access-Control-Allow-Methods" -> "GET,PUT,POST,DELETE", "Access-Control-Max-Age" -> "300", "Access-Control-Allow-Headers" -> "Origin, X-Requested-With, Content-Type, Accept, X-ID-TOKEN, X-REFERER")
  }

  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }

  import org.json4s._
  import org.json4s.native.JsonMethods._
  import org.demo.PersonForm
  import org.supler.Supler
  import org.supler.field.ActionResult
  import org.json4s.JsonAST.{JValue, JString}
  implicit val formats = DefaultFormats
  var person = PersonForm.aPerson
  val saveAction = Supler.action[Person]("save") { p =>
    person = p
    println(s"Persisted: $person")
    ActionResult.custom(JString("Persisted: " + person))
  }.label("Save").validateAll()

  val personFormWithSave = PersonForm.personForm + saveAction

  def getTestPerson(id:Long) = Action.async { implicit request =>
      scala.concurrent.Future {
      val maybePerson:Option[Person] = Some(person)
      if (maybePerson.isDefined) {
        import spray.httpx.Json4sSupport
        Ok(personFormWithSave(person).generateJSON)
      } else {
        NotFound("No such person found")
      }
    }
  }

  def saveTestPerson = Action.async(json) { implicit request =>
      print("Saving person..")
      scala.concurrent.Future {
        println(s"${request.body}")
        Ok(personFormWithSave(person).process(request.body).generateJSON)
      }
  }
}

object TestSuplerController extends APICrudController[Person] {
  import org.supler.Supler._
  import helpers.JsonImplicits._
  import org.supler.field.ActionResult
  var entity = Option(PersonForm.aPerson)
  val entityForm = PersonForm.personForm
  val entityFormWithSave = entityForm + saveAction
}
