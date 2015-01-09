package org.supler.field

import org.json4s
import org.supler.{FieldPath, MultiFieldRow, Row}

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

  private[supler] override def findAction(
    parentPath: FieldPath,
    obj: T,
    jsonFields: Map[String, json4s.JValue],
    ctx: RunActionContext): Option[RunnableAction] = None
}
