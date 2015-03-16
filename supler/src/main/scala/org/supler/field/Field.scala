package org.supler.field

import org.json4s
import org.json4s.JsonAST._
import org.supler.validation.PartiallyAppliedObj
import org.supler.{FieldPath, MultiFieldRow, Row, RowsJSON}

trait Field[T] extends Row[T] {
  def name: String
  def label: Option[String]

  private[supler] def enabledIf: T => Boolean
  private[supler] def includeIf: T => Boolean

  override def ||(field: Field[T]): Row[T] = MultiFieldRow(this :: field :: Nil)

  private[supler] override def generateJSON(parentPath: FieldPath, obj: T): RowsJSON = {
    val isIncluded = includeIf(obj)
    if (isIncluded) {
      val isEnabled = enabledIf(obj)

      val fieldJsonPartial = generateFieldJSON(parentPath, obj)
      val fieldJson = JObject(
        JField(JSONFieldNames.Name, JString(name)) ::
          JField(JSONFieldNames.Enabled, JBool(isEnabled)) ::
          JField(JSONFieldNames.Label, JString(label.getOrElse(""))) ::
          fieldJsonPartial.obj)

      RowsJSON.singleField(fieldJson, name)
    } else RowsJSON.empty
  }

  override private[supler] def applyJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, json4s.JValue]) = {
    if (includeIf(obj) && enabledIf(obj)) {
      applyFieldJSONValues(parentPath, obj, jsonFields)
    } else PartiallyAppliedObj.full(obj)
  }

  private[supler] def applyFieldJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, json4s.JValue]): PartiallyAppliedObj[T]
  private[supler] def generateFieldJSON(parentPath: FieldPath, obj: T): JObject

  protected object JSONFieldNames {
    val Name = "name"
    val Type = "type"
    val Label = "label"
    val Multiple = "multiple"
    val Value = "value"
    val Validate = "validate"
    val RenderHint = "render_hint"
    val PossibleValues = "possible_values"
    val Path = "path"
    val EmptyValue = "empty_value"
    val Enabled = "enabled"

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
