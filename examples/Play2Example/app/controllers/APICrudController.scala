package controllers

import com.github.tototoshi.play2.json4s.native._
import org.demo.core.{WithPrimaryKey}
import play.api.mvc.{Action, Controller}

//import org.json4s.JsonAST.{JValue, JString}
import org.json4s._
import org.supler.Supler
import org.supler.field._
import org.supler.validation._
import org.supler.field.ActionResult
abstract class APICrudController[E <: WithPrimaryKey] extends Controller with Json4s{
  import scala.concurrent.ExecutionContext.Implicits.global
  import org.json4s.native.JsonMethods._
  import helpers.JsonImplicits._
  implicit val formats = DefaultFormats
  //Default instance of the entity type,`E`
  var entity:Option[E]
  //Default supler form mapping used in all API functions below
  //val entityForm:org.supler.Form[E]
  //Default save supler action for the form
  val saveAction = Supler.action[E]("save") { p =>
    entity = Some(p)
    println(s"Persisted: $entity")
    ActionResult.custom(JString("Persisted: " + entity))
  }.label("Save").validateAll()
  val entityFormWithSave:org.supler.Form[E]

  def create = Action.async(json) { implicit request =>
      scala.concurrent.Future {
        println(s"create:${request.body}")
        //Entity can be saved in data storage here
        entity.map(providedEntity => {
          play.api.mvc.Results.Created(entityFormWithSave(providedEntity).process(request.body).generateJSON)
        }).getOrElse({
          play.api.mvc.Results.Created(entityFormWithSave(entity.get).process(request.body).generateJSON)
        })
      }
  }
  def get(id:Int) = Action.async { implicit request =>
      scala.concurrent.Future {
        //Get the entity object from the data storage
        val existingEntity: Option[E] = entity
        if (existingEntity.isDefined) {
          import spray.httpx.Json4sSupport
          play.api.mvc.Results.Ok(entityFormWithSave(existingEntity.get).generateJSON)
        } else {
          play.api.mvc.Results.NotFound("Entity for the given ID not found")
        }
      }
  }
}
