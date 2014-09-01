package org.supler.validation

import org.json4s.JsonAST.{JString, JField, JObject, JArray}

case class FormValidationResult(fieldErrors: List[FieldValidationError]) {
  def hasErrors = fieldErrors.size > 0

  def generateJSON = JArray(fieldErrors.map(generateFieldErrorJSON))

  def generateFieldErrorJSON(fieldError: FieldValidationError) = {
    JObject(
      JField("field_path", JString(fieldError.path.toString)),
      JField("error_key", JString(fieldError.validationError.key)),
      JField("error_params", JArray(fieldError.validationError.params.map(p => JString(p.toString)).toList))
    )
  }
}
