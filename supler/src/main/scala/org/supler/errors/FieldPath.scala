package org.supler.errors

import scala.annotation.tailrec

sealed trait FieldPath {
  def append(fieldName: String) = SingleFieldPath(this, fieldName)
  def appendWithIndex(fieldName: String, index: Int) = SingleIndexedFieldPath(this, fieldName, index)

  override def toString = {
    @tailrec
    def gatherComponents(fp: FieldPath, acc: List[String]): List[String] = fp match {
      case EmptyPath => acc
      case SingleFieldPath(p, n) => gatherComponents(p, n :: acc)
      case SingleIndexedFieldPath(p, n, i) => gatherComponents(p, s"$n[$i]" :: acc)
    }

    gatherComponents(this, Nil).mkString(".")
  }
}

object EmptyPath extends FieldPath

case class SingleFieldPath(parent: FieldPath, fieldName: String) extends FieldPath

case class SingleIndexedFieldPath(parent: FieldPath, fieldName: String, index: Int) extends FieldPath

