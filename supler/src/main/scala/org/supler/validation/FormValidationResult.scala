package org.supler.validation

import org.json4s.JsonAST.{JString, JField, JObject, JArray}

case class FormValidationResult(fieldErrors: List[FieldErrorMessage]) {
  def hasErrors = fieldErrors.size > 0

  def generateJSON = JArray(fieldErrors.map(generateFieldErrorJSON))

  def generateFieldErrorJSON(fieldError: FieldErrorMessage) = {
    JObject(
      JField("field_path", JString(fieldError.path.toString)),
      JField("error_key", JString(fieldError.errorMessage.key)),
      JField("error_params", JArray(fieldError.errorMessage.params.map(p => JString(p.toString)).toList))
    )
  }
}
