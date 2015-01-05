package org.supler.errors

import org.supler.FieldPath

trait ValidationScope {
  def shouldValidate(parentPath: FieldPath, valueMissing: Boolean): Boolean
}
object ValidateFilled extends ValidationScope {
  override def shouldValidate(parentPath: FieldPath, valueMissing: Boolean) = !valueMissing
}
object ValidateAll extends ValidationScope {
  override def shouldValidate(parentPath: FieldPath, valueMissing: Boolean) = true
}
object ValidateNone extends ValidationScope {
  override def shouldValidate(parentPath: FieldPath, valueMissing: Boolean) = false
}
case class ValidateInPath(rootPath: FieldPath) extends ValidationScope {
  override def shouldValidate(parentPath: FieldPath, valueMissing: Boolean) = parentPath.childOf(rootPath)
}
