package org.supler.field

import org.json4s.JsonAST.{JField, JInt}

abstract class RenderHint(val name: String) {
  def extraJSON: List[JField] = Nil
}

case object LabelRenderHint extends RenderHint("label") with BasicFieldCompatible with SetFieldCompatible

case object BasicFieldPasswordRenderHint extends RenderHint("password") with BasicFieldCompatible
case class BasicFieldTextareaRenderHint(rows: Option[Int], cols: Option[Int]) extends RenderHint("textarea") with BasicFieldCompatible {
  override def extraJSON = rows.map(r => JField("rows", JInt(r))).toList ++ cols.map(c => JField("cols", JInt(c))).toList
}
case object BasicFieldRadioRenderHint extends RenderHint("radio") with BasicFieldCompatible

case object SubformTableRenderHint extends RenderHint("table") with SubformFieldCompatible
case object SubformListRenderHint extends RenderHint("list") with SubformFieldCompatible