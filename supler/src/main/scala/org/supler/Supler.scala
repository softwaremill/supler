package org.supler

import org.json4s.JsonAST.JField
import org.json4s._
import org.supler.errors._
import org.supler.field._
import org.supler.transformation.FullTransformer

import scala.language.experimental.macros

object Supler extends Validators {
  def form[T](rows: Supler[T] => List[Row[T]]): Form[T] = macro SuplerFormMacros.form_impl[T]

  def field[T, U](param: T => U)
    (implicit transformer: FullTransformer[U, _]): BasicField[T, U] =
    macro SuplerFieldMacros.field_impl[T, U]

  def setField[T, U](param: T => Set[U])
    (implicit transformer: FullTransformer[U, _]): SetField[T, U] =
    macro SuplerFieldMacros.setField_impl[T, U]

  def subform[T, U, Cont[_]](param: T => Cont[U], form: Form[U])(implicit container: SubformContainer[Cont]): SubformField[T, U, Cont] =
    macro SuplerFieldMacros.subform_impl[T, U, Cont]

  def subform[T, U, Cont[_]](param: T => Cont[U], form: Form[U], createEmpty: () => U)(implicit container: SubformContainer[Cont]): SubformField[T, U, Cont] =
    macro SuplerFieldMacros.subform_createempty_impl[T, U, Cont]

  def action[T](name: String)(action: T => ActionResult[T]): ActionField[T] =
    ActionField(name, action, None, BeforeActionValidateNone)

  def parentAction[T, U](action: (T, Int, U) => ActionResult[T]): U => ActionResult[U] = ActionResult.parentAction(action)

  def staticField[T](createMessage: T => Message) = new StaticField[T](createMessage, None)

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

  def subform[U, Cont[_]](param: T => Cont[U], form: Form[U])(implicit container: SubformContainer[Cont]): SubformField[T, U, Cont] =
    macro SuplerFieldMacros.subform_impl[T, U, Cont]

  def subform[U, Cont[_]](param: T => Cont[U], form: Form[U], createEmpty: () => U)(implicit container: SubformContainer[Cont]): SubformField[T, U, Cont] =
    macro SuplerFieldMacros.subform_createempty_impl[T, U, Cont]

  def action(name: String)(action: T => ActionResult[T]): ActionField[T] = ActionField(name, action, None, BeforeActionValidateNone)

  def parentAction[U](action: (T, Int, U) => ActionResult[T]): U => ActionResult[U] = ActionResult.parentAction(action)

  def staticField(createMessage: T => Message) = new StaticField[T](createMessage, None)
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