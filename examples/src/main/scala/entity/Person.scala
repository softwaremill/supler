package entity

import org.supler.Supler

class Person {
  var name: String = "" // require, default
  var lastName: Option[String] = None // optional
  var shoeNumber: Int = 0
  var gender: String = ""
}

object PersonMeta extends Supler[Person] {
  val shoeNumberField = field(_.shoeNumber).validate(le(48))
}