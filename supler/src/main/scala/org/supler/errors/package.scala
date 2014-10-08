package org.supler

package object errors {
  type FieldErrors = List[FieldErrorMessage]

  def foldErrorsOrValues[Coll[_], U](errorsOrValues: Iterable[Either[FieldErrors, U]],
    z: Coll[U], add: (U, Coll[U]) => Coll[U]): Either[FieldErrors, Coll[U]] = {

    errorsOrValues.foldLeft[Either[FieldErrors, Coll[U]]](Right(z)) { (current, errorsOrValue) =>
      errorsOrValue match {
        case Left(errors) => Left(current.left.getOrElse(Nil) ++ errors)
        case Right(value) => current.right.map(add(value, _))
      }
    }
  }
}
