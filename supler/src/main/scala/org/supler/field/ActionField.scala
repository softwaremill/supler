package org.supler.field

import org.json4s._
import org.json4s.JsonAST.{JObject, JField}
import org.supler.errors.ValidationMode.ValidationMode
import org.supler.errors.{FieldPath, PartiallyAppliedObj}

case class ActionField[T](
  name: String,
  action: T => ActionResult[T],
  label: Option[String]) extends Field[T] {

  require(name.matches("\\w+"), "Action name must contain only word characters (letters, numbers, _)")

  def label(newLabel: String): ActionField[T] = this.copy(label = Some(newLabel))

  override private[supler] def generateJSON(parentPath: FieldPath, obj: T) = {
    import JSONFieldNames._

    List(JField(name, JObject(List(
      JField(Label, JString(label.getOrElse(""))),
      JField(Type, JString(SpecialFieldTypes.Action)),
      JField(Path, JString(parentPath.append(name).toString))
    ))))
  }

  override def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]) =
    PartiallyAppliedObj.full(obj)

  override def doValidate(parentPath: FieldPath, obj: T, mode: ValidationMode) = Nil

  override def runAction(obj: T, jsonFields: Map[String, JValue], ctx: RunActionContext) = {
    if (jsonFields.get(name) == Some(JBool(value = true))) {
      action(obj).completeWith(ctx)
    } else {
      super.runAction(obj, jsonFields, ctx)
    }
  }
}

trait ActionResult[+U] {
  def completeWith(ctx: RunActionContext): CompleteActionResult
}

object ActionResult {
  def apply[T](t: T, customData: Option[JValue] = None): ActionResult[T] = FullResult(t, customData)

  def custom(data: JValue): ActionResult[Nothing] = CustomDataResult(data)

  def parentAction[T, U](action: (T, Int, U) => ActionResult[T]): U => ActionResult[U] = { u =>
    new ActionResult[U] {
      override def completeWith(ctx: RunActionContext) = {
        val (t, i, _, parentCtx) = ctx.pop[T, U]()
        action(t, i, u).completeWith(parentCtx)
      }
    }
  }
}

case class FullResult[U](result: U, customData: Option[JValue]) extends ActionResult[U] {
  def completeWith(ctx: RunActionContext): CompleteActionResult = {
    val lastResult = ctx.parentsStack.foldLeft[Any](result) { case (r, (_, _, parentUpdate)) =>
      parentUpdate.asInstanceOf[Any => Any](r)
    }

    FullCompleteActionResult(lastResult, customData)
  }
}

case class CustomDataResult(data: JValue) extends ActionResult[Nothing] {
  override def completeWith(ctx: RunActionContext) = CustomDataCompleteActionResult(data)
}

sealed trait CompleteActionResult
case class CustomDataCompleteActionResult(json: JValue) extends CompleteActionResult
case class FullCompleteActionResult(value: Any, customData: Option[JValue]) extends CompleteActionResult
object NoActionResult extends CompleteActionResult

case class RunActionContext(parentsStack: List[(Any, Int, Function1[_, _])]) {
  def push[T, U](obj: T, i: Int, defaultUpdate: U => T): RunActionContext =
    RunActionContext((obj, i, defaultUpdate) :: parentsStack)

  def pop[T, U](): (T, Int, U => T, RunActionContext) = {
    val (obj, i, defaultUpdate) = parentsStack.head
    (obj.asInstanceOf[T], i, defaultUpdate.asInstanceOf[U => T], RunActionContext(parentsStack.tail))
  }
}
