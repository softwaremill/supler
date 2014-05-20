package form

object DSL {
  def form[T](rows: DSL[T] => List[Row[T]]) = ???

  def field[T, U](field: T => U): Field[T, U]  = ???

  def row[T](fields: (Field[T, _])*): Row[T] = ???

  def length[T, U](length: Int) : SuplerValidator[T, U] = ???

  def custom[T, U](validation: (T, U) => Boolean): SuplerValidator[T, U] = ???

  def dataProvider[T, U](provider: T => List[U]): DataProvider[T, U] = ???
}

class DSL[T] {
  def field[U](field: T => U): Field[T, U]  = DSL.field(field)
  def row(fields: (Field[T, _])*): Row[T] = DSL.row(fields: _*)
}

class Row[T] {}

class Field[T, U] extends Row[T] {
  def validate(validator: SuplerValidator[T, U]*): Field[T, U] = ???
  def use(dataProvider: DataProvider[T, U]): Field[T, U] = ???
}

class SuplerValidator[T, U]

class DataProvider[T, U]

