package org.supler.validation

import org.supler.Field

case class FieldValidationError(field: Field[_, _], path: FieldPath, validationError: ValidationError)
