package org.supler

import org.supler.field.{Field, SubformField}

import scala.annotation.tailrec

sealed trait FieldPath {
  def findFieldAndObject(form: Form[_], parentObj: AnyRef): Option[(Field[_], AnyRef)]

  def getCurrentFormAndObj(form: Form[_], parentObj: AnyRef): (Form[_], AnyRef)

  def append(fieldName: String) = SingleFieldPath(this, fieldName)

  def appendWithIndex(fieldName: String, index: Int) = SingleIndexedFieldPath(this, fieldName, index)

  override lazy val toString = {
    @tailrec
    def gatherComponents(fp: FieldPath, acc: List[String]): List[String] = fp match {
      case EmptyPath => acc
      case SingleFieldPath(p, n) => gatherComponents(p, n :: acc)
      case SingleIndexedFieldPath(p, n, i) => gatherComponents(p, s"$n[$i]" :: acc)
    }

    gatherComponents(this, Nil).mkString(FieldPath.PathSeparator)
  }

  def childOf(otherPath: FieldPath): Boolean

  private[supler] def findFieldByName(name: String, rows: List[Row[_]], obj: AnyRef): Option[(Field[_], AnyRef)] = {
    val allFields: List[Field[_]] = rows.map {
      case MultiFieldRow(fields) => fields
      case field => List(field.asInstanceOf[Field[_]])
    }.flatten
    allFields.find(_.name.equals(name)).map((_, obj))
  }
}

object EmptyPath extends FieldPath {
  override def childOf(otherPath: FieldPath) = this == otherPath

  override def findFieldAndObject(form: Form[_], parentObj: AnyRef) = None

  override def getCurrentFormAndObj(form: Form[_], parentObj: AnyRef) = (form, parentObj)
}

case class SingleFieldPath(parent: FieldPath, fieldName: String) extends FieldPath {
  override def childOf(otherPath: FieldPath) = this == otherPath || parent.childOf(otherPath)

  override def findFieldAndObject(form: Form[_], parentObj: AnyRef) = {
    val currentFormAndObj = parent.getCurrentFormAndObj(form, parentObj)
    findFieldByName(fieldName, currentFormAndObj._1.rows, currentFormAndObj._2)
  }

  override def getCurrentFormAndObj(form: Form[_], parentObj: AnyRef) = (form, parentObj)
}

case class SingleIndexedFieldPath(parent: FieldPath, fieldName: String, index: Int) extends FieldPath {
  override def childOf(otherPath: FieldPath) = this == otherPath || parent.childOf(otherPath) ||
    SingleFieldPath(parent, fieldName).childOf(otherPath)

  override def findFieldAndObject(form: Form[_], parentObj: AnyRef) = {
    val currentFormAndObj = parent.getCurrentFormAndObj(form, parentObj)
    findFieldByName(fieldName, currentFormAndObj._1.rows, currentFormAndObj._2)
  }

  override def getCurrentFormAndObj(form: Form[_], parentObj: AnyRef): (Form[_], AnyRef) = {
    val currentFormAndObj = parent.getCurrentFormAndObj(form, parentObj)
    findFieldByName(fieldName, currentFormAndObj._1.rows, currentFormAndObj._2)
      .map { f =>
        val subform = f._1.asInstanceOf[SubformField[Any, Any, Any, Any]]
        (subform.embeddedForm, subform.getObjectByIndex(index, f._2))
      }
      .getOrElse(throw new IllegalStateException("Expected embedded form"))
  }
}

object FieldPath {
  private[supler] val PathSeparator = "."

  private val IndexedPathPartRgx = """(.*)\[(\d+)\]""".r.pattern

  private def isIndexedFieldPathPath(pathPart: String): Option[(String, Int)] = {
    val matcher = IndexedPathPartRgx.matcher(pathPart)
    if (matcher.matches()) {
      Some(matcher.group(1), matcher.group(2).toInt)
    } else {
      None
    }
  }

  def parse(path: String): FieldPath = {
    if (path == null || path.isEmpty) {
      EmptyPath
    }
    else {
      path.split(PathSeparator.charAt(0)).foldLeft(EmptyPath.asInstanceOf[FieldPath])(
        (path, field) => isIndexedFieldPathPath(field) match {
          case Some((indexedField, index)) => SingleIndexedFieldPath(path, indexedField, index)
          case _ => SingleFieldPath(path, field)
        }
      )
    }
  }
}
