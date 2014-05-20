package form

object DSL {
  def form[T](rows: (Row[T])*) = ???

  def field[T, U](field: T => U, options: FieldOption[T, U]*): Field[T, U] = ???

  def row[T](fields: (Field[T, _])*): Row[T] = ???

  def length[T, U](length: Int) : SuplerValidator[T, U] = ???

  def validation[T, U](validation: (T, U) => Boolean): SuplerValidator[T, U] = ???

  def dataProvider[T, U](provider: T => List[U]): DataProvider[T, U] = ???
}

class Row[T] {}

class Field[T, U] extends Row[T] /*extends FieldValidations*/ {
}

class SuplerValidator[T, -U] extends FieldOption[T, U] {

}

class DataProvider[T, -U] extends FieldOption[T, U] {

}

trait FieldOption[T, -U] {

}

