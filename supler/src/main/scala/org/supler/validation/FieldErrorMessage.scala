package org.supler.validation

import org.supler.Field

case class FieldErrorMessage(field: Field[_, _], path: FieldPath, errorMessage: ErrorMessage)
