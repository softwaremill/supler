package org.supler

import scala.annotation.tailrec

sealed trait FieldPath {
  private val PathSeparator = "."

  def append(fieldName: String) = SingleFieldPath(this, fieldName)
  def appendWithIndex(fieldName: String, index: Int) = SingleIndexedFieldPath(this, fieldName, index)

  override lazy val toString = {
    @tailrec
    def gatherComponents(fp: FieldPath, acc: List[String]): List[String] = fp match {
      case EmptyPath => acc
      case SingleFieldPath(p, n) => gatherComponents(p, n :: acc)
      case SingleIndexedFieldPath(p, n, i) => gatherComponents(p, s"$n[$i]" :: acc)
    }

    gatherComponents(this, Nil).mkString(PathSeparator)
  }

  def childOf(otherPath: FieldPath): Boolean
}

object EmptyPath extends FieldPath {
  override def childOf(otherPath: FieldPath) = this == otherPath
}

case class SingleFieldPath(parent: FieldPath, fieldName: String) extends FieldPath {
  override def childOf(otherPath: FieldPath) = this == otherPath || parent.childOf(otherPath)
}

case class SingleIndexedFieldPath(parent: FieldPath, fieldName: String, index: Int) extends FieldPath {
  override def childOf(otherPath: FieldPath) = this == otherPath || parent.childOf(otherPath) ||
    SingleFieldPath(parent, fieldName).childOf(otherPath)
}

