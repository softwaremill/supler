package org.supler.demo

import form.Supler._

object Form1 {
  val form1 = form[Person](f => List(
    f.field(_.firstName).label("First name"),
    f.field(_.lastName).label("Last name"),
    f.field(_.age).label("Age"),
    f.field(_.address1).label("Address 1"),
    f.field(_.address2).label("Address 2")
  ))
}

case class Person(
  firstName: String,
  lastName: String,
  age: Int,
  address1: Option[String],
  address2: Option[String])
