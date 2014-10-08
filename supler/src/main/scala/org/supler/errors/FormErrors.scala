package org.supler.errors

import org.json4s.JsonAST.{JString, JField, JObject, JArray}

case class FormErrors(fieldErrors: FieldErrors) {
  def hasErrors = fieldErrors.size > 0

  def generateJSON = JArray(fieldErrors.map(generateFieldErrorJSON))

  private def generateFieldErrorJSON(fieldError: FieldErrorMessage) = {
    JObject(
      JField("field_path", JString(fieldError.path.toString)),
      JField("error_key", JString(fieldError.errorMessage.key)),
      JField("error_params", JArray(fieldError.errorMessage.params.map(p => JString(p.toString)).toList))
    )
  }
}
