package org.supler

import java.util.concurrent.atomic.AtomicLong

import org.json4s.JsonAST.{JField, JObject, JString}
import org.json4s._

import scala.language.experimental.macros
import scala.reflect.macros.blackbox.Context

object Supler extends Validators {

  def form[T](rows: Supler[T] => List[Row[T]]) = {
    Form(rows(new Supler[T] {}))
  }

  def newPrimitiveField[T, U](fieldName: String, read: T => U, write: (T, U) => T, required: Boolean, fieldType: FieldType[U]): PrimitiveField[T, U] = {
    PrimitiveField[T, U](fieldName, read, write, List(), None, None, required, fieldType)
  }

  def newTableField[T, U](fieldName: String, read: T => List[U], write: (T, List[U]) => T,
    embeddedForm: Form[U], createEmpty: () => U): TableField[T, U] = {
    TableField[T, U](fieldName, read, write, None, embeddedForm, createEmpty)
  }

  def dataProvider[T, U](provider: T => List[U]): DataProvider[T, U] = {
    new DataProvider[T, U](provider)
  }

  def field[T, U](param: T => U): PrimitiveField[T, U] = macro Supler.field_impl[T, U]
  def table[T, U](param: T => List[U], form: Form[U], createEmpty: => U): TableField[T, U] = macro Supler.table_impl[T, U]

  def field_impl[T: c.WeakTypeTag, U: c.WeakTypeTag](c: Context)(param: c.Expr[T => U]): c.Expr[PrimitiveField[T, U]] = {
    import c.universe._

    val (fieldName, paramRepExpr) = extractFieldName(c)(param)

    val readFieldValueExpr = generateFieldRead[T, U](c)(fieldName)

    val classSymbol = implicitly[WeakTypeTag[T]].tpe.typeSymbol.asClass

    val writeFieldValueExpr = generateFieldWrite[T, U](c)(fieldName, classSymbol)

    val isOption = implicitly[WeakTypeTag[U]].tpe.typeSymbol.asClass.fullName == "scala.Option"
    val isRequiredExpr = c.Expr[Boolean](Literal(Constant(!isOption)))

    val fieldTypeTree = generateFieldType(c)(implicitly[WeakTypeTag[U]].tpe)
    val fieldTypeExpr = c.Expr[FieldType[U]](fieldTypeTree)

    reify {
      newPrimitiveField(paramRepExpr.splice,
        readFieldValueExpr.splice,
        writeFieldValueExpr.splice,
        isRequiredExpr.splice,
        fieldTypeExpr.splice)
    }
  }

  def table_impl[T: c.WeakTypeTag, U: c.WeakTypeTag](c: Context)(param: c.Expr[T => List[U]],
    form: c.Expr[Form[U]], createEmpty: c.Tree): c.Expr[TableField[T, U]] = {
    import c.universe._

    val (fieldName, paramRepExpr) = extractFieldName(c)(param)

    val readFieldValueExpr = generateFieldRead[T, List[U]](c)(fieldName)

    val classSymbol = implicitly[WeakTypeTag[T]].tpe.typeSymbol.asClass

    val writeFieldValueExpr = generateFieldWrite[T, List[U]](c)(fieldName, classSymbol)

    val createEmptyExpr = c.Expr[() => U](q"() => $createEmpty")

    reify {
      newTableField(paramRepExpr.splice,
        readFieldValueExpr.splice,
        writeFieldValueExpr.splice,
        form.splice,
        createEmptyExpr.splice)
    }
  }

  private def extractFieldName(c: Context)(param: c.Expr[_]): (String, c.Expr[String]) = {
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

    (fieldName, paramRepExpr)
  }

  private def generateFieldRead[T, U](c: Context)(fieldName: String): c.Expr[T => U] = {
    import c.universe._

    // obj => obj.[fieldName]
    val readFieldValueTree = Function(List(ValDef(Modifiers(Flag.PARAM), TermName("obj"), TypeTree(), EmptyTree)),
      Select(Ident(TermName("obj")), TermName(fieldName)))

    c.Expr[T => U](readFieldValueTree)
  }

  private def generateFieldWrite[T, U](c: Context)(fieldName: String, classSymbol: c.universe.ClassSymbol): c.Expr[(T, U) => T] = {
    import c.universe._

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

    c.Expr[(T, U) => T](writeFieldValueTree)
  }

  private def generateFieldType(c: Context)(fieldTpe: c.Type): c.Tree = {
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
      val innerTree = generateFieldType(c)(fieldTpe.typeArgs(0))
      q"new _root_.org.supler.OptionalFieldType($innerTree)"
    } else {
      throw new IllegalArgumentException(s"Fields of type $fieldTpe are not supported")
    }
  }
}

trait Supler[T] extends Validators {
  def field[U](param: T => U): PrimitiveField[T, U] = macro Supler.field_impl[T, U]
  def table[U](param: T => List[U], form: Form[U], createEmpty: => U): TableField[T, U] = macro Supler.table_impl[T, U]
}

case class FieldValidationError(field: Field[_, _], key: String, params: Any*)

trait Row[T] {
  def generateJSONSchema(formId: String): List[JField]

  def generateJSONValues(obj: T): List[JField]

  def applyJSONValues(obj: T, jsonFields: Map[String, JValue]): T

  def ||(field: Field[T, _]): Row[T]

  def doValidate(obj: T): List[FieldValidationError]
}

case class Form[T](rows: List[Row[T]]) {
  def doValidate(obj: T): List[FieldValidationError] = rows.flatMap(_.doValidate(obj))

  def generateJSONSchema = {
    val formId = IdGenerator.nextId()
    JObject(
      JField("title", JString("Form")),
      JField("type", JString("object")),
      JField("id", JString(formId)),
      JField("properties", JObject(rows.flatMap(_.generateJSONSchema(formId))))
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

trait Field[T, U] extends Row[T] {
  def name: String

  override def ||(field: Field[T, _]): Row[T] = MultiFieldRow(this :: field :: Nil)
}

case class PrimitiveField[T, U](
  name: String,
  read: T => U,
  write: (T, U) => T,
  validators: List[Validator[T, U]],
  dataProvider: Option[DataProvider[T, U]],
  label: Option[String],
  required: Boolean,
  fieldType: FieldType[U]) extends Field[T, U] {

  def label(newLabel: String) = this.copy(label = Some(newLabel))

  def validate(validators: Validator[T, U]*): PrimitiveField[T, U] = this.copy(validators = this.validators ++ validators)

  def use(dataProvider: DataProvider[T, U]): PrimitiveField[T, U] = this.dataProvider match {
    case Some(_) => throw new IllegalStateException("A data provider is already defined!")
    case None => this.copy(dataProvider = Some(dataProvider))
  }

  override def doValidate(obj: T): List[FieldValidationError] = {
    val v = read(obj)
    val fves = validators.flatMap(_.doValidate(obj, v)).map(ve => FieldValidationError(this, ve.key, ve.params: _*))

    def valueMissing = v == null || !fieldType.valuePresent(v)

    if (required && valueMissing) {
      FieldValidationError(this, "Value is required") :: fves
    } else {
      fves
    }
  }

  override def generateJSONSchema(formId: String) = {
    // TODO: Until https://github.com/jdorn/json-editor/issues/208 is fixed, supporting only enums not depending on
    // TODO: the entity
    /*
    dataProvider match {
      case Some(dp) =>
        /*
        json to generate:
        {
          "type": "object",
          "id": "[formId]",
          "properties": {
            "[choicesFieldName]": {
              "type": "array",
              "options": {
                "hidden": true
              },
              "items": {
                "type": "[field type]"
              }
            },
            "primary_color": {
              "type": "[field type]",
              "watch": {
                "[choicesFieldAlias]": "[formId].[choicesFieldName]"
              },
              "enumSource": [
                {
                  "source": "[choicesFieldAlias]",
                  "title": "{{item}}",
                  "value": "{{item}}"
                }
              ]
            }
          }
        }
        */
        val choicesFieldName = name + "_choices_" + IdGenerator.nextId()
        val choicesFieldAlias = "choices_alias_" + IdGenerator.nextId()
        List(
          JField(choicesFieldName, JObject(
            JField("type", JString("array")),
            JField("options", JObject(JField("hidden", JBool(value = true)))),
            JField("items", JObject(JField("type", JString(fieldType.jsonSchemaName))))
          )),
          JField(name, JObject(
            JField("type", JString(fieldType.jsonSchemaName)),
            JField("description", JString(label.getOrElse(""))),
            JField("watch", JObject(JField(choicesFieldAlias, JString(s"$formId.$choicesFieldName")))),
            JField("enumSource", JArray(List(JObject(
              JField("source", JString(choicesFieldAlias)),
              JField("title", JString("{{item}}")),
              JField("value", JString("{{item}}"))
            ))))
          ))
        )
      case None =>
        List(
          JField(name, JObject(
            JField("type", JString(fieldType.jsonSchemaName)),
            JField("description", JString(label.getOrElse("")))
          ))
        )
    }
    */

    List(JField(name, JObject(
      JField("type", JString(fieldType.jsonSchemaName)) ::
        JField("description", JString(label.getOrElse(""))) ::
        (dataProvider match {
          case Some(dp) => JField("enum", JArray(JString("") :: dp.provider(null.asInstanceOf[T]).flatMap(fieldType.toJValue))) :: Nil
          case None => Nil
        })
    )))
  }

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

  override def generateJSONSchema(formId: String) = fields.flatMap(_.generateJSONSchema(formId))

  override def generateJSONValues(obj: T) = fields.flatMap(_.generateJSONValues(obj))

  override def applyJSONValues(obj: T, jsonFields: Map[String, JValue]): T = {
    fields.foldLeft(obj)((currentObj, field) => field.applyJSONValues(currentObj, jsonFields))
  }
}

case class TableField[T, U](
  name: String,
  read: T => List[U],
  write: (T, List[U]) => T,
  label: Option[String],
  embeddedForm: Form[U],
  createEmpty: () => U) extends Field[T, List[U]] {

  def label(newLabel: String) = this.copy(label = Some(newLabel))

  override def generateJSONSchema(formId: String) = List(JField(name, JObject(
    JField("type", JString("array")),
    JField("format", JString("table")),
    JField("title", JString(label.getOrElse(""))),
    JField("uniqueItems", JBool(value = true)),
    JField("items", embeddedForm.generateJSONSchema)
  )))

  override def generateJSONValues(obj: T) = List(JField(name, JArray(
    read(obj).map(embeddedForm.generateJSONValues)
  )))

  override def applyJSONValues(obj: T, jsonFields: Map[String, JValue]) = {
    val vs = for {
      JArray(formJValues) <- jsonFields.get(name).toList
      formJValue <- formJValues
    } yield {
      embeddedForm.applyJSONValues(createEmpty(), formJValue)
    }

    write(obj, vs)
  }

  override def doValidate(obj: T) = Nil
}

case class DataProvider[T, U](provider: T => List[U])

object IdGenerator {
  private val counter = new AtomicLong(0)
  def nextId() = "ID" + counter.getAndIncrement
}