package org.supler

import org.json4s.JsonAST.{JField, JObject, JString}
import org.json4s._

import scala.language.experimental.macros
import scala.reflect.macros.blackbox.Context

object Supler extends Validators {

  def form[T](rows: Supler[T] => List[Row[T]]) = {
    Form(rows(new Supler[T] {}))
  }

  def newField[T, U](fieldName: String, read: T => U, write: (T, U) => T, required: Boolean, fieldType: FieldType[U]): Field[T, U] = {
    Field[T, U](fieldName, read, write, List(), None, None, required, fieldType)
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
        Apply(Select(Ident(TermName("obj")), TermName("copy")), copyParams))
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

    val fieldTypeTree = computeFieldType(c)(implicitly[WeakTypeTag[U]].tpe)
    val fieldTypeExpr = c.Expr[FieldType[U]](fieldTypeTree)

    reify {
      newField(paramRepExpr.splice,
        readFieldValueExpr.splice,
        writeFieldValueExpr.splice,
        isRequiredExpr.splice,
        fieldTypeExpr.splice)
    }
  }

  private def computeFieldType(c: Context)(fieldTpe: c.Type): c.Tree = {
    import c.universe._

    if (fieldTpe <:< c.typeOf[String]) {
      q"_root_.org.supler.StringFieldType"
    } else if (fieldTpe <:< c.typeOf[Int]) {
      q"_root_.org.supler.IntFieldType"
    } else if (fieldTpe <:< c.typeOf[Long]) {
      q"_root_.org.supler.LongFieldType"
    } else if (fieldTpe <:< c.typeOf[Double]) {
      q"_root_.org.supler.DoubleFieldType"
    } else if (fieldTpe <:< c.typeOf[Float]) {
      q"_root_.org.supler.FloatFieldType"
    } else if (fieldTpe <:< c.typeOf[Boolean]) {
      q"_root_.org.supler.BooleanFieldType"
    } else if (fieldTpe <:< c.typeOf[Option[_]]) {
      val innerTree = computeFieldType(c)(fieldTpe.typeArgs(0))
      q"new _root_.org.supler.OptionalFieldType($innerTree)"
    } else {
      throw new IllegalArgumentException(s"Fields of type $fieldTpe are not supported")
    }
  }
}

trait Supler[T] extends Validators {
  def field[U](param: T => U): Field[T, U] = macro Supler.field_impl[T, U]
}

case class FieldValidationError(field: Field[_, _], key: String, params: Any*)

trait Row[T] {
  def generateJSONSchema: List[JField]
  def generateJSONValues(obj: T): List[JField]

  def applyJSONValues(obj: T, jsonFields: Map[String, JValue]): T

  def ||(field: Field[T, _]): Row[T]
  def doValidate(obj: T): List[FieldValidationError]
}

case class Form[T](rows: List[Row[T]]) {
  def doValidate(obj: T): List[FieldValidationError] = rows.flatMap(_.doValidate(obj))

  def generateJSONSchema = {
    JObject(
      JField("title", JString("Form")),
      JField("type", JString("object")),
      JField("properties", JObject(rows.flatMap(_.generateJSONSchema)))
    )
  }

  def generateJSONValues(obj: T) = {
    new JObject(
      rows.flatMap(_.generateJSONValues(obj))
    )
  }

  def applyJSONValues(obj: T, jvalue: JValue): T = {
    jvalue match {
      case JObject(jsonFields) =>
        rows.foldLeft(obj)((currentObj, row) => row.applyJSONValues(currentObj, jsonFields.toMap))
      case _ => obj
    }
  }

  def +(row: Row[T]) = ++(List(row))
  def ++(moreRows: List[Row[T]]) = Form(rows ++ moreRows)
}

case class Field[T, U](
  name: String,
  read: T => U,
  write: (T, U) => T,
  validators: List[Validator[T, U]],
  dataProvider: Option[DataProvider[T, U]],
  label: Option[String],
  required: Boolean,
  fieldType: FieldType[U]) extends Row[T] {

  def label(newLabel: String) = this.copy(label = Some(newLabel))

  def validate(validators: Validator[T, U]*): Field[T, U] = this.copy(validators = this.validators ++ validators)

  def use(dataProvider: DataProvider[T, U]): Field[T, U] = this.dataProvider match {
    case Some(_) => throw new IllegalStateException("A data provider is already defined!")
    case None => this.copy(dataProvider = Some(dataProvider))
  }

  override def ||(field: Field[T, _]): Row[T] = MultiFieldRow(this :: field :: Nil)

  override def doValidate(obj: T): List[FieldValidationError] = {
    val v = read(obj)
    val fves = validators.flatMap(_.doValidate(obj, v)).map(ve => FieldValidationError(this, ve.key, ve.params: _*))

    if (required && !fieldType.valuePresent(v)) {
      FieldValidationError(this, "Value is required") :: fves
    } else {
      fves
    }
  }

  override def generateJSONSchema = List(
    JField(name, JObject(
      JField("type", JString(fieldType.jsonSchemaName)),
      JField("description", JString(label.getOrElse("")))
    ))
  )

  override def generateJSONValues(obj: T) = {
    val value = read(obj)
    fieldType
      .toJValue(value)
      .map(JField(name, _))
      .toList
  }

  override def applyJSONValues(obj: T, jsonFields: Map[String, JValue]): T = {
    (for {
      jsonValue <- jsonFields.get(name)
      value <- fieldType.fromJValue.lift(jsonValue)
    } yield {
      write(obj, value)
    }).getOrElse(obj)
  }
}

case class MultiFieldRow[T](fields: List[Field[T, _]]) extends Row[T] {
  override def ||(field: Field[T, _]): Row[T] = MultiFieldRow(fields ++ List(field))
  override def doValidate(obj: T): List[FieldValidationError] = fields.flatMap(_.doValidate(obj))

  override def generateJSONSchema = fields.flatMap(_.generateJSONSchema)
  override def generateJSONValues(obj: T) = fields.flatMap(_.generateJSONValues(obj))

  override def applyJSONValues(obj: T, jsonFields: Map[String, JValue]): T = {
    fields.foldLeft(obj)((currentObj, field) => field.applyJSONValues(currentObj, jsonFields))
  }
}

class DataProvider[T, U](provider: T => List[U])

