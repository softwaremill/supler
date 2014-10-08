package org.supler.errors

import org.supler.Field

case class FieldErrorMessage(field: Field[_, _], path: FieldPath, errorMessage: ErrorMessage)
