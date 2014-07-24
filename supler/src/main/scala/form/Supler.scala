package form

import org.json4s.JsonAST.JString
import org.json4s.{JField, JObject}

import scala.language.experimental.macros
import scala.reflect.macros.blackbox.Context

import schema.{JsonProperty, JsonType, JsonSchema}

object Supler extends Validators {

  def form[T](rows: Supler[T] => List[Row[T]]) = {
    Form(rows(new Supler[T] {}))
  }

  def newField[T, U](fieldName: String, read: T => U, write: (T, U) => T, required: Boolean): Field[T, U] = {
    Field[T, U](fieldName, read, write, List(), None, None, required)
  }

  def dataProvider[T, U](provider: T => List[U]): DataProvider[T, U] = {
    new DataProvider[T, U](provider)
  }

  def field[T, U](param: T => U): Field[T, U] = macro Supler.field_impl[T, U]

  def field_impl[T: c.WeakTypeTag , U: c.WeakTypeTag](c: Context)(param: c.Expr[T => U]): c.Expr[Field[T, U]] = {
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

    val classSymbol = implicitly[WeakTypeTag[T]].tpe.typeSymbol.asClass
    val isCaseClass = classSymbol.isCaseClass

    val writeFieldValueTree = if (isCaseClass) {
      // constructors can have only one param list
      val ctorParams = classSymbol.primaryConstructor.asMethod.paramLists(0)

      val copyParams = ctorParams.map { param =>
        if (param.name.decodedName.toString == fieldName) {
          Ident(TermName("v"))
        } else {
          Select(Ident(TermName("obj")), param.name)
        }
      }

      // (obj, v) => obj.copy(obj.otherField1, ..., v, ..., obj.otherFieldN)
      Function(List(
        ValDef(Modifiers(Flag.PARAM), TermName("obj"), TypeTree(), EmptyTree),
        ValDef(Modifiers(Flag.PARAM), TermName("v"), TypeTree(), EmptyTree)),
        Apply(Select(Ident(TermName("obj")), TermName("copy")), copyParams)) //Ident(TermName("x$11")), Ident(TermName("x$10"))
    } else {
      // (obj, v) => obj.[fieldName] = v; obj
      Function(List(
        ValDef(Modifiers(Flag.PARAM), TermName("obj"), TypeTree(), EmptyTree),
        ValDef(Modifiers(Flag.PARAM), TermName("v"), TypeTree(), EmptyTree)),
        Block(
          List(Apply(Select(Ident(TermName("obj")), TermName(fieldName + "_$eq")), List(Ident(TermName("v"))))),
          Ident(TermName("obj"))))
    }

    val writeFieldValueExpr = c.Expr[(T, U) => T](writeFieldValueTree)

    val isOption = implicitly[WeakTypeTag[U]].tpe.typeSymbol.asClass.fullName == "scala.Option"
    val isRequiredExpr = c.Expr[Boolean](Literal(Constant(!isOption)))

    reify {
      newField(paramRepExpr.splice, readFieldValueExpr.splice, writeFieldValueExpr.splice, isRequiredExpr.splice)
    }
  }
}

trait Supler[T] extends Validators {
  def field[U](param: T => U): Field[T, U] = macro Supler.field_impl[T, U]
}

case class FieldValidationError(field: Field[_, _], key: String, params: Any*)

trait Row[T] {
  def generateJSONSchema: List[JsonProperty]
  def generateJSONValues(obj : T): List[JField]

  def ||(field: Field[T, _]): Row[T]
  def doValidate(obj: T): List[FieldValidationError]
}

case class Form[T](rows: List[Row[T]]) {
  def doValidate(obj: T): List[FieldValidationError] = rows.flatMap(_.doValidate(obj))

  def generateJSONSchema = {
    new JsonSchema("Form", JsonType.Object, rows.flatMap(_.generateJSONSchema))
  }
  
  def generateJSONValues(obj: T) = {
    import org.json4s.native._
    prettyJson(renderJValue(new JObject(
      rows.flatMap(_.generateJSONValues(obj))
    )))
  }
}

case class Field[T, U](
  name: String,
  read: T => U,
  write: (T, U) => T,
  validators: List[Validator[T, U]],
  dataProvider: Option[DataProvider[T, U]],
  label: Option[String],
  required: Boolean) extends Row[T] {

  def label(newLabel: String) = this.copy(label = Some(newLabel))
  
  def validate(validators: Validator[T, U]*): Field[T, U] = this.copy(validators = this.validators ++ validators)

  def use(dataProvider: DataProvider[T, U]): Field[T, U] = this.dataProvider match {
    case Some(_) => throw new IllegalStateException("A data provider is already defined!")
    case None => this.copy(dataProvider = Some(dataProvider))
  }

  def ||(field: Field[T, _]): Row[T] = MultiFieldRow(this :: field :: Nil)
  
  def doValidate(obj: T): List[FieldValidationError] = {
    val v = read(obj)
    validators.flatMap(_.doValidate(obj, v)).map(ve => FieldValidationError(this, ve.key, ve.params: _*))
  }

  override def generateJSONSchema = List(new JsonProperty(name, JsonType.String, label))

  override def generateJSONValues(obj: T) = List(JField(name, JString(read(obj).toString)))
}

case class MultiFieldRow[T](fields: List[Field[T, _]]) extends Row[T] {
  def ||(field: Field[T, _]): Row[T] = MultiFieldRow(fields ++ List(field))
  def doValidate(obj: T): List[FieldValidationError] = fields.flatMap(_.doValidate(obj))

  override def generateJSONSchema = fields.flatMap(_.generateJSONSchema)

  override def generateJSONValues(obj: T) = fields.flatMap(_.generateJSONValues(obj))
}

class DataProvider[T, U](provider: T => List[U])

