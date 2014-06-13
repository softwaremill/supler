package form

import scala.language.experimental.macros
import scala.reflect.macros.blackbox.Context

object Supler extends Validators {
  def form[T](rows: Supler[T] => List[Row[T]]) = {
    println(s"new form with rows: rows")
    rows(new Supler[T])
  }

  def newField[T, U](fieldName: String): Field[T, U]  = {
    println(s"Running field $fieldName")
    Field[T,U](fieldName, List(), None)
  }

  def dataProvider[T, U](provider: T => List[U]): DataProvider[T, U] = {
    println(s"New data provider $provider")
    new DataProvider[T, U]
  }

  def field[T, U](param: T => U): Field[T,U] = macro Supler.field_impl[T, U]

  def field_impl[T, U](c: Context)(param: c.Expr[T => U]): c.Expr[Field[T, U]] = {
    import c.universe._
    val paramRep = show(param.tree)
    val paramRepTree = Literal(Constant(paramRep))
    val paramRepExpr = c.Expr[String](paramRepTree)

    // TODO get the proper field name from inside
    reify {
      println (paramRepExpr.splice)
      newField(paramRepExpr.splice)
    }
  }
}

class Supler[T] extends Validators {
  def field[U](param: T => U): Field[T,U] = macro Supler.field_impl[T, U]
}

class Row[T] {
  def || (field: Field[T, _]): Row[T] = {
    println (s"new row with field $field")
    this
  }
}

case class Field[T, U](
  name: String,
  validators: List[Validator[T, U]],
  dataProvider: Option[DataProvider[T, U]]) extends Row[T] {

  def validate(validators: Validator[T, U]*): Field[T, U] = this.copy(validators = this.validators ++ validators)
  def use(dataProvider: DataProvider[T, U]): Field[T, U] = this.dataProvider match {
    case Some(_) => throw new IllegalStateException("A data provider is already defined!")
    case None => this.copy(dataProvider = Some(dataProvider))
  }
}

class DataProvider[T, U]

