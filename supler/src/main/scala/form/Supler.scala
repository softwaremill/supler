package form

import scala.language.experimental.macros
import scala.reflect.macros.blackbox.Context

import schema.{JsonProperty, JsonType, JsonSchema}

object Supler extends Validators {

  var jsonSchema = JsonSchema("Example Schema", JsonType.Object, Nil)

  def form[T](rows: Supler[T] => List[Row[T]]) = {
    println(s"new form with rows: rows")
    Form(rows(new Supler[T]))
  }

  def newField[T, U](fieldName: String, read: T => U, write: (T, U) => T): Field[T, U] = {
    println(s"Running field $fieldName")
    jsonSchema = jsonSchema.addProperty(JsonProperty(fieldName, JsonType.String, Some("some description")))

    Field[T, U](fieldName, read, write, List(), None)
  }

  def dataProvider[T, U](provider: T => List[U]): DataProvider[T, U] = {
    println(s"New data provider $provider")
    new DataProvider[T, U](provider)
  }

  def field[T, U](param: T => U): Field[T, U] = macro Supler.field_impl[T, U]

  def field_impl[T, U](c: Context)(param: c.Expr[T => U]): c.Expr[Field[T, U]] = {
    import c.universe._

    val fieldName = param match {
      case Expr(
      Function(
      List(ValDef(Modifiers(_), TermName(termDef: String), TypeTree(), EmptyTree)),
      Select(Ident(TermName(termUse: String)), TermName(field: String)))) if termDef == termUse =>
          field
      case _ => throw new IllegalArgumentException("Illegal field reference " + show(param.tree) + "; please use _.fieldName instead")
    }

    val paramRepTree = Literal(Constant(fieldName))
    val paramRepExpr = c.Expr[String](paramRepTree)

    // obj => obj.[fieldName]
    val readFieldValueTree = Function(List(ValDef(Modifiers(Flag.PARAM), TermName("obj"), TypeTree(), EmptyTree)),
      Select(Ident(TermName("obj")), TermName(fieldName)))
    val readFieldValueExpr = c.Expr[T => U](readFieldValueTree)

    // (obj, v) => obj.[fieldName] = v; obj
    val writeFieldValueTree = Function(List(
      ValDef(Modifiers(Flag.PARAM), TermName("obj"), TypeTree(), EmptyTree),
      ValDef(Modifiers(Flag.PARAM), TermName("v"), TypeTree(), EmptyTree)),
      Block(
        List(Apply(Select(Ident(TermName("obj")), TermName(fieldName + "_$eq")), List(Ident(TermName("v"))))),
        Ident(TermName("obj"))))
    val writeFieldValueExpr = c.Expr[(T, U) => T](writeFieldValueTree)

    reify {
      newField(paramRepExpr.splice, readFieldValueExpr.splice, writeFieldValueExpr.splice)
    }
  }
}

class Supler[T] extends Validators {
  def field[U](param: T => U): Field[T, U] = macro Supler.field_impl[T, U]
}

trait Row[T] {
  def ||(field: Field[T, _]): Row[T]
  def doValidate(obj: T): List[ValidationError]
}

case class Form[T](rows: List[Row[T]]) {
  def doValidate(obj: T): List[ValidationError] = rows.flatMap(_.doValidate(obj)) 
}

case class Field[T, U](
  name: String,
  read: T => U,
  write: (T, U) => T,
  validators: List[Validator[T, U]],
  dataProvider: Option[DataProvider[T, U]]) extends Row[T] {

  def validate(validators: Validator[T, U]*): Field[T, U] = this.copy(validators = this.validators ++ validators)

  def use(dataProvider: DataProvider[T, U]): Field[T, U] = this.dataProvider match {
    case Some(_) => throw new IllegalStateException("A data provider is already defined!")
    case None => this.copy(dataProvider = Some(dataProvider))
  }

  def ||(field: Field[T, _]): Row[T] = MultiFieldRow(this :: field :: Nil)
  
  def doValidate(obj: T): List[ValidationError] = {
    val v = read(obj)
    validators.flatMap(_.doValidate(obj, v))
  }
}

case class MultiFieldRow[T](fields: List[Field[T, _]]) extends Row[T] {
  def ||(field: Field[T, _]): Row[T] = MultiFieldRow(fields ++ List(field))
  def doValidate(obj: T): List[ValidationError] = fields.flatMap(_.doValidate(obj))
}

class DataProvider[T, U](provider: T => List[U])

