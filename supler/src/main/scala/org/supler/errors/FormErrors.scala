package org.supler.errors

import org.json4s.JsonAST.{JString, JField, JObject, JArray}

case class FormErrors(fieldErrors: FieldErrors) {
  require(fieldErrors.size > 0)

  def generateJSON = JArray(fieldErrors.map(generateFieldErrorJSON))

  private def generateFieldErrorJSON(fieldError: FieldErrorMessage) = {
    JObject(
      JField("field_path", JString(fieldError.path.toString)),
      JField("error_key", JString(fieldError.message.key)),
      JField("error_params", JArray(fieldError.message.params.map(p => JString(p.toString)).toList))
    )
  }
}
