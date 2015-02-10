package org.supler

import org.json4s.JsonAST.JField
import org.json4s._
import org.supler.validation._
import org.supler.field._
import org.supler.transformation.FullTransformer

import scala.language.experimental.macros

// when editing javadocs, remember to synchronize with the methods on the trait!
object Supler extends Validators {
  def form[T](rows: Supler[T] => List[Row[T]]): Form[T] = macro SuplerFormMacros.form_impl[T]

  def field[T, U](param: T => U)
    (implicit transformer: FullTransformer[U, _]): BasicField[T, U] =
    macro SuplerFieldMacros.field_impl[T, U]

  def setField[T, U](param: T => Set[U])
    (implicit transformer: FullTransformer[U, _]): SetField[T, U] =
    macro SuplerFieldMacros.setField_impl[T, U]

  /**
   * A new subform field. Uses an auto-generated method to create "empty" instances of objects backing the subform,
   * which are created when applying values from a JSON object.
   *
   * By default subforms are rendered as a list. Use the `.renderHint()` method to customize.
   */
  def subform[T, ContU, U, Cont[_]](param: T => ContU, form: Form[U])
    (implicit container: SubformContainer[ContU, U, Cont]): SubformField[T, ContU, U, Cont] =
    macro SuplerFieldMacros.subform_impl[T, ContU, U, Cont]

  /**
   * A new subform field. Uses the provided method to create "empty" instances of objects backing the subform, which
   * are created when applying values from a JSON object.
   *
   * By default subforms are rendered as a list. Use the `.renderHint()` method to customize.
   */
  def subform[T, ContU, U, Cont[_]](param: T => ContU, form: Form[U], createEmpty: () => U)
    (implicit container: SubformContainer[ContU, U, Cont]): SubformField[T, ContU, U, Cont] =
    macro SuplerFieldMacros.subform_createempty_impl[T, ContU, U, Cont]

  /**
   * A new action field. Must have a unique `name`.
   *
   * By default, no fields will be validated when the action is invoked. Use the `.validateXxx` methods to customize
   * that behavior.
   */
  def action[T](name: String)(action: T => ActionResult[T]): ActionField[T] =
    ActionField(name, action, None, BeforeActionValidateNone, AlwaysCondition, AlwaysCondition)

  /**
   * Creates an action which can be passed to a subform and used in a subform's action field. Such an action has access
   * (and can modify) both to the object backing the subform, as well as the object backing the parent form.
   */
  def parentAction[T, U](action: (T, Int, U) => ActionResult[T]): U => ActionResult[U] = ActionResult.parentAction(action)

  def staticField[T](createMessage: T => Message) = new StaticField[T](createMessage, None,
    AlwaysCondition)

  def asList() = SubformListRenderHint
  def asTable() = SubformTableRenderHint

  def asPassword() = BasicFieldPasswordRenderHint
  def asTextarea(rows: Int = -1, cols: Int = -1) = {
    def toOption(d: Int) = if (d == -1) None else Some(d)
    BasicFieldTextareaRenderHint(toOption(rows), toOption(cols))
  }
  def asRadio() = BasicFieldRadioRenderHint
}

trait Supler[T] extends Validators {
  def field[U](param: T => U)
    (implicit transformer: FullTransformer[U, _]): BasicField[T, U] =
    macro SuplerFieldMacros.field_impl[T, U]

  def setField[U](param: T => Set[U])
    (implicit transformer: FullTransformer[U, _]): SetField[T, U] =
    macro SuplerFieldMacros.setField_impl[T, U]

  /**
   * A new subform field. Uses an auto-generated method to create "empty" instances of objects backing the subform,
   * which are created when applying values from a JSON object.
   *
   * By default subforms are rendered as a list. Use the `.renderHint()` method to customize.
   */
  def subform[ContU, U, Cont[_]](param: T => ContU, form: Form[U])
    (implicit container: SubformContainer[ContU, U, Cont]): SubformField[T, ContU, U, Cont] =
    macro SuplerFieldMacros.subform_impl[T, ContU, U, Cont]

  /**
   * A new subform field. Uses the provided method to create "empty" instances of objects backing the subform, which
   * are created when applying values from a JSON object.
   *
   * By default subforms are rendered as a list. Use the `.renderHint()` method to customize.
   */
  def subform[U, ContU, Cont[_]](param: T => ContU, form: Form[U], createEmpty: () => U)
    (implicit container: SubformContainer[ContU, U, Cont]): SubformField[T, ContU, U, Cont] =
    macro SuplerFieldMacros.subform_createempty_impl[T, ContU, U, Cont]

  /**
   * A new action field. Must have a unique `name`.
   *
   * By default, no fields will be validated when the action is invoked. Use the `.validateXxx` methods to customize
   * that behavior.
   */
  def action(name: String)(action: T => ActionResult[T]): ActionField[T] = ActionField(name, action, None,
    BeforeActionValidateNone, AlwaysCondition, AlwaysCondition)

  /**
   * Creates an action which can be passed to a subform and used in a subform's action field. Such an action has access
   * (and can modify) both to the object backing the subform, as well as the object backing the parent form.
   */
  def parentAction[U](action: (T, Int, U) => ActionResult[T]): U => ActionResult[U] = ActionResult.parentAction(action)

  def staticField(createMessage: T => Message) = new StaticField[T](createMessage, None,
    AlwaysCondition)
}

trait Row[T] {
  def ||(field: Field[T]): Row[T]

  private[supler] def generateJSON(parentPath: FieldPath, obj: T): List[JField]

  private[supler] def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): PartiallyAppliedObj[T]

  private[supler] def doValidate(parentPath: FieldPath, obj: T, scope: ValidationScope): FieldErrors

  private[supler] def findAction(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue], ctx: RunActionContext): Option[RunnableAction]
}

object Row {
  def applyJSONValues[T](toRows: Iterable[Row[T]], parentPath: FieldPath, obj: T, 
    jsonFields: Map[String, JValue]): PartiallyAppliedObj[T] = {
    
    toRows.foldLeft[PartiallyAppliedObj[T]](PartiallyAppliedObj.full(obj)) { (pao, row) =>
      pao.flatMap(row.applyJSONValues(parentPath, _, jsonFields))
    }
  }

  def findFirstAction[T](parentPath: FieldPath, rows: Iterable[Row[T]], obj: T, jsonFields: Map[String, JValue],
    ctx: RunActionContext): Option[RunnableAction] = {

    Util.findFirstMapped(
      rows,
      (_: Row[T]).findAction(parentPath, obj, jsonFields, ctx),
      (_: Option[RunnableAction]).isDefined).flatten
  }
}

case class MultiFieldRow[T](fields: List[Field[T]]) extends Row[T] {
  override def ||(field: Field[T]): Row[T] = MultiFieldRow(fields ++ List(field))

  override def doValidate(parentPath: FieldPath, obj: T, scope: ValidationScope): List[FieldErrorMessage] =
    fields.flatMap(_.doValidate(parentPath, obj, scope))

  override def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): PartiallyAppliedObj[T] =
    Row.applyJSONValues(fields, parentPath, obj, jsonFields)

  override def generateJSON(parentPath: FieldPath, obj: T) = fields.flatMap(_.generateJSON(parentPath, obj))

  override def findAction(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue], ctx: RunActionContext) =
    Row.findFirstAction(parentPath, fields, obj, jsonFields, ctx)
}