package org.supler

import org.scalatest._
import org.supler.Supler._

class FieldUniquenessTest extends FlatSpec with ShouldMatchers {

  case class Person(name: String, lastname: String)

  "supler" should "throw error when same field used multiple times" in {
    // expect
    val error = the[Exception] thrownBy form[Person](f => List(
      f.field(_.name),
      f.field(_.name),
      f.field(_.lastname)
    ))

    error.getMessage should endWith("Supler does not support same field multiple times on a form, but those were used: name")
  }

  "supler" should "throw error specifying many fields used multiple times" in {
    // expect
    val error = the[Exception] thrownBy form[Person](f => List(
      f.field(_.name),
      f.field(_.name),
      f.field(_.lastname),
      f.field(_.lastname)
    ))

    error.getMessage should endWith("Supler does not support same field multiple times on a form, but those were used: name, lastname")
  }
}
