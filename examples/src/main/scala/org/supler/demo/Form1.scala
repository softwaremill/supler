package org.supler.demo

import org.supler.Supler
import Supler._

object Form1 {
  val form1 = form[Person](f => List(
    f.field(_.firstName).label("First name"),
    f.field(_.lastName).label("Last name"),
    f.field(_.age).label("Age"),
    f.field(_.address1).label("Address 1"),
    f.field(_.address2).label("Address 2"),
    f.field(_.gender).label("Gender").use(dataProvider(_ => List("Male", "Female")))
  ))
}

case class Person(
  firstName: String,
  lastName: String,
  age: Int,
  address1: Option[String],
  address2: Option[String],
  gender: String)
