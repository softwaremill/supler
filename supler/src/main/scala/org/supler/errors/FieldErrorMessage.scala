package org.supler.errors

import org.supler.field.Field

case class FieldErrorMessage(field: Field[_, _], path: FieldPath, errorMessage: ErrorMessage)
