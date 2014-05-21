package form

object DSL {
  def form[T](rows: DSL[T] => List[Row[T]]) = ???

  def field[T, U](field: T => U): Field[T, U]  = ???

  def length[T, U](length: Int) : SuplerValidator[T, U] = ???

  def custom[T, U](validation: (T, U) => Boolean): SuplerValidator[T, U] = ???

  def dataProvider[T, U](provider: T => List[U]): DataProvider[T, U] = ???
}

class DSL[T] {
  def field[U](field: T => U): Field[T, U]  = DSL.field(field)
}

class Row[T] {
  def ~ (field: Field[T, _]): Row[T] = ???
}

class Field[T, U] extends Row[T] {
  def validate(validator: SuplerValidator[T, U]*): Field[T, U] = ???
  def use(dataProvider: DataProvider[T, U]): Field[T, U] = ???

  def ~ (field: Field[T, U]): Row[T] = ???
}

class SuplerValidator[T, U]

class DataProvider[T, U]

