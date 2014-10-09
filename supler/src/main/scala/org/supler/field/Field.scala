package org.supler.field

import org.supler.{MultiFieldRow, Row}

trait Field[T, U] extends Row[T] {
  def name: String

  override def ||(field: Field[T, _]): Row[T] = MultiFieldRow(this :: field :: Nil)

  protected object JSONFieldNames {
    val Type = "type"
    val Label = "label"
    val Multiple = "multiple"
    val Value = "value"
    val Validate = "validate"
    val RenderHint = "render_hint"
    val PossibleValues = "possible_values"

    val ValidateRequired = "required"
  }

  protected object SpecialFieldTypes {
    val Select = "select"
    val Subform = "subform"
  }
}
