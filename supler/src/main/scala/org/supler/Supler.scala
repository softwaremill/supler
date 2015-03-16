package org.supler

import org.supler.field._
import org.supler.transformation.Transformer
import org.supler.validation._

import scala.language.experimental.macros

// when editing javadocs, remember to synchronize with the methods on the trait!
/**
 * All Supler objects are immutable and can be freely re-used. Customizing fields/forms (such as adding a validator
 * to a field, specifying a field's label etc.) creates new instances.
 */
object Supler extends Validators with RenderHints {
  def form[T](rows: Supler[T] => List[Row[T]]): Form[T] = macro SuplerFormMacros.form_impl[T]

  def field[T, U](param: T => U)
    (implicit transformer: Transformer[U, _]): BasicField[T, U] =
    macro SuplerFieldMacros.field_impl[T, U]

  /**
   * A new select-one field. The label for each value will be created using `labelForValue`.
   *
   * When applying, values are selected basing on their indices on the list provided by `possibleValues`.
   *
   * By default select-one fields are rendered as dropdowns. Use the `.renderHint()` method to customize.
   */
  def selectOneField[T, U](param: T => U)(labelForValue: U => String): AlmostSelectOneField[T, U] =
    macro SuplerFieldMacros.selectOneField_impl[T, U]

  /**
   * A new select-many field. The label for each value will be created using `labelForValue`.
   *
   * When applying, values are selected basing on their indices on the list provided by `possibleValues`.
   *
   * By default select-many fields are rendered as checkboxes. Use the `.renderHint()` method to customize.
   */
  def selectManyField[T, U](param: T => Set[U])(labelForValue: U => String): AlmostSelectManyField[T, U] =
    macro SuplerFieldMacros.selectManyField_impl[T, U]

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
    ActionField(name, action, None, None, BeforeActionValidateNone, AlwaysCondition, AlwaysCondition)

  /**
   * Creates an action which can be passed to a subform and used in a subform's action field. Such an action has access
   * (and can modify) both to the object backing the subform, as well as the object backing the parent form.
   */
  def parentAction[T, U](action: (T, Int, U) => ActionResult[T]): U => ActionResult[U] = ActionResult.parentAction(action)

  def staticField[T](createMessage: T => Message) = new StaticField[T](createMessage, None, None,
    AlwaysCondition)
}

trait Supler[T] extends Validators {
  def field[U](param: T => U)
    (implicit transformer: Transformer[U, _]): BasicField[T, U] =
    macro SuplerFieldMacros.field_impl[T, U]

  /**
   * A new select-one field. The label for each value will be created using `labelForValue`.
   *
   * When applying, values are selected basing on their indices on the list provided by `possibleValues`.
   *
   * By default select-one fields are rendered as dropdowns. Use the `.renderHint()` method to customize.
   */
  def selectOneField[U](param: T => U)(labelForValue: U => String): AlmostSelectOneField[T, U] =
    macro SuplerFieldMacros.selectOneField_impl[T, U]

  /**
   * A new select-many field. The label for each value will be created using `labelForValue`.
   *
   * When applying, values are selected basing on their indices on the list provided by `possibleValues`.
   *
   * By default select-many fields are rendered as checkboxes. Use the `.renderHint()` method to customize.
   */
  def selectManyField[U](param: T => Set[U])(labelForValue: U => String): AlmostSelectManyField[T, U] =
    macro SuplerFieldMacros.selectManyField_impl[T, U]

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
  def action(name: String)(action: T => ActionResult[T]): ActionField[T] = ActionField(name, action, None, None,
    BeforeActionValidateNone, AlwaysCondition, AlwaysCondition)

  /**
   * Creates an action which can be passed to a subform and used in a subform's action field. Such an action has access
   * (and can modify) both to the object backing the subform, as well as the object backing the parent form.
   */
  def parentAction[U](action: (T, Int, U) => ActionResult[T]): U => ActionResult[U] = ActionResult.parentAction(action)

  def staticField(createMessage: T => Message) = new StaticField[T](createMessage, None, None,
    AlwaysCondition)
}

