package org.supler.field

import org.supler.{MultiFieldRow, Row}

trait Field[T, U] extends Row[T] {
  def name: String

  override def ||(field: Field[T, _]): Row[T] = MultiFieldRow(this :: field :: Nil)

  protected val TypeField = "type"
  protected val LabelField = "label"
  protected val MultipleField = "multiple"
  protected val ValueField = "value"
  protected val ValidateField = "validate"
  protected val RenderHintField = "render_hint"
  protected val PossibleValuesField = "possible_values"

  protected val ValidateRequiredField = "required"

  protected val SelectType = "select"
  protected val SubformType = "subform"
}
