package org.supler.errors

import org.supler.FieldPath

trait ValidationScope {
  /**
   * @param parentPath Path of the parent of the field for which validation is to be checked.
   */
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
