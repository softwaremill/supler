package controllers

import com.github.tototoshi.play2.json4s.native._
import org.demo.core.{WithPrimaryKey}
import play.api.mvc.{Action, Controller}

//import org.json4s.JsonAST.{JValue, JString}
import org.json4s._
import org.supler.{SuplerData, EmptyPath, Supler}
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
  val entityForm:org.supler.Form[E]
  //Default save supler action for the form
  val saveAction = Supler.action[E]("save") { p =>
    entity = Some(p)
    println(s"Persisted: $entity")
    ActionResult.custom(JString("Persisted: " + entity))
  }.label("Save").validateAll()
  val entityFormWithSave:org.supler.Form[E]

  def getNew = Action.async { implicit request =>
    scala.concurrent.Future {
        import org.supler.validation._
        import spray.httpx.Json4sSupport
        val emptyEntity = entityForm.createEmpty()
        play.api.mvc.Results.Ok(entityForm(emptyEntity).withMeta("id","").doValidate(ValidateFilled).generateJSON)
    }
  }

  def create = Action.async(json) { implicit request =>
      scala.concurrent.Future {
        println(s"create:${request.body}")
        val newEntity = entityForm.withNewEmpty.applyJSONValues(request.body).obj
        //FIXME: In reality, save this new entity and assign the new ID
        val persistedEntityID:Option[Int] = Some(1)
        val suplerData:SuplerData[E] = entityFormWithSave(newEntity).withMeta("id",persistedEntityID.getOrElse(0).toString).process(request.body)
        play.api.mvc.Results.Created(suplerData.generateJSON)
      }
  }

  def update(id:Int) = Action.async(json) { implicit request =>
    scala.concurrent.Future {
      println(s"update:${request.body}")
      //Entity can be saved in data storage here
      val id = entityForm.getMeta(request.body)("id")
      println(s"id:$id")
      //Get entity based on input ID
      //FIXME: For testing using predefined object with id - 1
      val existingEntity:Option[E] = entity
      existingEntity.map(providedEntity => {
        play.api.mvc.Results.Created(entityFormWithSave(providedEntity).process(request.body).generateJSON)
      }).getOrElse({
        play.api.mvc.Results.NotFound(s"Object not found with id - $id")
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
          play.api.mvc.Results.NotFound(s"Object not found with id - $id")
        }
      }
  }
}
