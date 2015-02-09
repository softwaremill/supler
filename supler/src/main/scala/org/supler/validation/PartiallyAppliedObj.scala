package org.supler.validation

case class PartiallyAppliedObj[T] private (errors: FieldErrors, obj: T) {
  def flatMap[U](f: T => PartiallyAppliedObj[U]): PartiallyAppliedObj[U] = {
    val r = f(obj)
    PartiallyAppliedObj[U](errors ++ r.errors, r.obj)
  }

  def map[U](f: T => U): PartiallyAppliedObj[U] = flatMap(f andThen PartiallyAppliedObj.full)

  def toEither: Either[FieldErrors, T] = if (errors.size > 0) Left(errors) else Right(obj)
}

object PartiallyAppliedObj {
  def full[T](obj: T) = PartiallyAppliedObj[T](Nil, obj)
  def withErrors[T](errors: FieldErrors, obj: T) = PartiallyAppliedObj[T](errors, obj)

  def flatten[T](paos: List[PartiallyAppliedObj[T]]): PartiallyAppliedObj[List[T]] = {
    paos
      .foldLeft(full(Nil: List[T])) { case (result, pao) =>
        for {
          o <- pao
          l <- result
        } yield o :: l
      }
      .map(_.reverse)
  }
}
