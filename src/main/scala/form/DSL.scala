package form

object DSL extends Validators {
  def form[T](rows: DSL[T] => List[Row[T]]) = ???

  def field[T, U](field: T => U): Field[T, U]  = ???

  def dataProvider[T, U](provider: T => List[U]): DataProvider[T, U] = ???
}

class DSL[T] {
  def field[U](field: T => U): Field[T, U]  = DSL.field(field)
}

class Row[T] {
  def || (field: Field[T, _]): Row[T] = ???
}

case class Field[T, U](
  get: T => U,
  set: T => U,
  validators: List[Validator[T, U]],
  dataProvider: Option[DataProvider[T, U]]) extends Row[T] {

  def validate(validators: Validator[T, U]*): Field[T, U] = this.copy(validators = this.validators ++ validators)
  def use(dataProvider: DataProvider[T, U]): Field[T, U] = this.dataProvider match {
    case Some(_) => throw new IllegalStateException("A data provider is already defined!")
    case None => this.copy(dataProvider = Some(dataProvider))
  }
}

class DataProvider[T, U]

