package org.supler.field

import org.json4s.JsonAST.JValue
import org.supler.{MultiFieldRow, Row}

trait Field[T] extends Row[T] {
  def name: String

  override def ||(field: Field[T]): Row[T] = MultiFieldRow(this :: field :: Nil)

  protected object JSONFieldNames {
    val Type = "type"
    val Label = "label"
    val Multiple = "multiple"
    val Value = "value"
    val Validate = "validate"
    val RenderHint = "render_hint"
    val PossibleValues = "possible_values"
    val Path = "path"
    val EmptyValue = "empty_value"

    val ValidateRequired = "required"
  }

  protected object SpecialFieldTypes {
    val Select = "select"
    val Subform = "subform"
    val Static = "static"
    val Action = "action"
  }

  override def runAction(obj: T, jsonFields: Map[String, JValue], ctx: RunActionContext): CompleteActionResult =
    NoActionResult
}
