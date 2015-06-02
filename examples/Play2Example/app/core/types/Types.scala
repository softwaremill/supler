package org.demo.core.types

trait DefaultEnum extends Enumeration {
  self =>
  def default: self.Value
  def options: List[Tuple2[String,String]] = values.map { value => (value.toString, value.toString.capitalize) }.toList
}

object UserStatus extends DefaultEnum {
  type UserStatus = Value
    val ACTIVE, INACTIVE = Value
    override def default = {
      UserStatus.INACTIVE
    }
}
