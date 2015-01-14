package org.supler

import org.supler.field._
import org.supler.transformation.FullTransformer

import scala.language.experimental.macros
import scala.reflect.macros.blackbox

object SuplerFieldMacros {
  def field_impl[T: c.WeakTypeTag, U: c.WeakTypeTag](c: blackbox.Context)
    (param: c.Expr[T => U])
    (transformer: c.Expr[FullTransformer[U, _]]): c.Expr[BasicField[T, U]] = {

    import c.universe._

    val (fieldName, paramRepExpr) = extractFieldName(c)(param)

    val readFieldValueExpr = generateFieldRead[T, U](c)(fieldName)

    val classSymbol = implicitly[WeakTypeTag[T]].tpe.typeSymbol.asClass

    val writeFieldValueExpr = generateFieldWrite[T, U](c)(fieldName, classSymbol)

    val fieldValueType = implicitly[WeakTypeTag[U]].tpe

    val isOption = fieldValueType.typeSymbol.asClass.fullName == "scala.Option"
    val isRequiredExpr = c.Expr[Boolean](Literal(Constant(!isOption)))

    // If the field is a boolean, both values are non-empty by default. For other types, there's a reasonable default
    // which can be considered as "empty" (for "required" validation).
    val emptyValue = if (fieldValueType <:< typeOf[Boolean]) reify[Option[U]] { None } else {
      defaultForType(c)(fieldValueType) match {
        case Some(defaultExpr) => c.Expr[Option[U]](reify { Some(defaultExpr.splice) }.tree)
        case None => c.Expr[Option[U]](reify { None }.tree)
      }
    }

    reify {
      FactoryMethods.newBasicField(paramRepExpr.splice,
        readFieldValueExpr.splice,
        writeFieldValueExpr.splice,
        isRequiredExpr.splice,
        transformer.splice,
        emptyValue.splice)
    }
  }

  def setField_impl[T: c.WeakTypeTag, U: c.WeakTypeTag](c: blackbox.Context)
    (param: c.Expr[T => Set[U]])
    (transformer: c.Expr[FullTransformer[U, _]]): c.Expr[SetField[T, U]] = {

    import c.universe._

    val (fieldName, paramRepExpr) = extractFieldName(c)(param)

    val readFieldValueExpr = generateFieldRead[T, Set[U]](c)(fieldName)

    val classSymbol = implicitly[WeakTypeTag[T]].tpe.typeSymbol.asClass

    val writeFieldValueExpr = generateFieldWrite[T, Set[U]](c)(fieldName, classSymbol)

    reify {
      FactoryMethods.newSetField(paramRepExpr.splice,
        readFieldValueExpr.splice,
        writeFieldValueExpr.splice,
        transformer.splice)
    }
  }

  def subform_impl[T: c.WeakTypeTag, ContU, U: c.WeakTypeTag, Cont[_]](c: blackbox.Context)
    (param: c.Expr[T => ContU], form: c.Expr[Form[U]])
    (container: c.Expr[SubformContainer[ContU, U, Cont]]): c.Expr[SubformField[T, ContU, U, Cont]] = {

    subform_createempty_impl[T, ContU, U, Cont](c)(param, form, null)(container)
  }

  def subform_createempty_impl[T: c.WeakTypeTag, ContU, U: c.WeakTypeTag, Cont[_]](c: blackbox.Context)
    (param: c.Expr[T => ContU], form: c.Expr[Form[U]], createEmpty: c.Expr[() => U])
    (container: c.Expr[SubformContainer[ContU, U, Cont]]): c.Expr[SubformField[T, ContU, U, Cont]] = {

    import c.universe._

    val (fieldName, paramRepExpr) = extractFieldName(c)(param)

    val readFieldValueExpr = generateFieldRead[T, Cont[U]](c)(fieldName)

    val classSymbol = implicitly[WeakTypeTag[T]].tpe.typeSymbol.asClass

    val writeFieldValueExpr = generateFieldWrite[T, Cont[U]](c)(fieldName, classSymbol)

    val createEmptyOpt = if (createEmpty == null) {
      reify { None }
    } else {
      reify { Some(createEmpty.splice) }
    }

    reify {
      FactoryMethods.newSubformField(container.splice)(
        paramRepExpr.splice,
        readFieldValueExpr.splice,
        writeFieldValueExpr.splice,
        form.splice,
        createEmptyOpt.splice)
    }
  }

  object FactoryMethods {
    def newBasicField[T, U, S](fieldName: String, read: T => U, write: (T, U) => T, required: Boolean,
      transformer: FullTransformer[U, S], emptyValue: Option[U]): BasicField[T, U] = {

      BasicField[T, U](fieldName, read, write, List(), None, None, required, transformer, None, emptyValue)
    }

    def newSubformField[T, ContU, U, Cont[_]](c: SubformContainer[ContU, U, Cont])
      (fieldName: String, read: T => Cont[U], write: (T, Cont[U]) => T,
        embeddedForm: Form[U], createEmpty: Option[() => U]): SubformField[T, ContU, U, Cont] = {

      SubformField[T, ContU, U, Cont](c, fieldName, read, write, None, embeddedForm, createEmpty, SubformListRenderHint)
    }

    def newSetField[T, U](fieldName: String, read: T => Set[U], write: (T, Set[U]) => T,
      transformer: FullTransformer[U, _]): SetField[T, U] = {

      SetField[T, U](fieldName, read, write, Nil, None, None, transformer, None)
    }
  }

  private def extractFieldName(c: blackbox.Context)(param: c.Expr[_]): (String, c.Expr[String]) = {
    import c.universe._
    val fieldName = param match {
      case Expr(
      Function(
      List(ValDef(Modifiers(_, _, _), TermName(termDef: String), TypeTree(), EmptyTree)),
      Select(Ident(TermName(termUse: String)), TermName(field: String)))) if termDef == termUse =>
        field
      case _ => throw new IllegalArgumentException("Illegal field reference " + show(param.tree) + "; please use _.fieldName instead")
    }

    val paramRepTree = Literal(Constant(fieldName))
    val paramRepExpr = c.Expr[String](paramRepTree)

    (fieldName, paramRepExpr)
  }

  private def generateFieldRead[T, U](c: blackbox.Context)(fieldName: String): c.Expr[T => U] = {
    import c.universe._

    // obj => obj.[fieldName]
    val readFieldValueTree = Function(List(ValDef(Modifiers(Flag.PARAM), TermName("obj"), TypeTree(), EmptyTree)),
      Select(Ident(TermName("obj")), TermName(fieldName)))

    c.Expr[T => U](readFieldValueTree)
  }

  private def generateFieldWrite[T, U](c: blackbox.Context)(fieldName: String, classSymbol: c.universe.ClassSymbol): c.Expr[(T, U) => T] = {
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

  def defaultForType(c: blackbox.Context)(tpe: c.universe.Type): Option[c.universe.Expr[_]] = {
    import c.universe._

    if (tpe <:< typeOf[Int]) return Some(reify { 0 })
    if (tpe <:< typeOf[Long]) return Some(reify { 0L })
    if (tpe <:< typeOf[Float]) return Some(reify { 0.0f })
    if (tpe <:< typeOf[Double]) return Some(reify { 0.0d })
    if (tpe <:< typeOf[String]) return Some(reify { "" })
    if (tpe <:< typeOf[Boolean]) return Some(reify { false })

    if (tpe <:< typeOf[Option[_]]) return Some(reify { None })
    if (tpe <:< typeOf[List[_]]) return Some(reify { Nil })
    if (tpe <:< typeOf[Set[_]]) return Some(reify { Set() })

    None
  }
}
