package org.supler

import org.scalatest.{FlatSpec, ShouldMatchers}
import Supler._
import org.supler.field.ActionResult
import org.json4s.native._

class SuplerDataTest extends FlatSpec with ShouldMatchers {

  case class Person(firstName: String, lastName: String)

  val personForm = form[Person](f => List(
    f.field(_.firstName).validate(minLength(3)),
    f.field(_.lastName).validate(minLength(3)),
    f.action("uppercase") { p => ActionResult(
      p.copy(firstName = p.firstName.toUpperCase, lastName = p.lastName.toUpperCase)) }
      .validateAll()
  ))

  "process" should "validate filled fields if there's no action" in {
    // given
    val p = Person("", "")

    // when
    val result = personForm(p).process(parseJson("""{ "firstName": "jo", "lastName": "" }"""))

    // then
    result match {
      case f: FormWithObjectAndErrors[_] =>
        f.errors.length should be (1)
        f.obj should be (Person("jo", ""))
      case _ => fail("Unknown result: " + result)
    }
  }

  "process" should "run validations before actions and if there are errors, not run the action" in {
    // given
    val p = Person("", "")

    // when
    val result = personForm(p).process(parseJson("""{ "firstName": "jo", "lastName": "lo", "uppercase": true }"""))

    // then
    result match {
      case f: FormWithObjectAndErrors[_] =>
        f.errors.length should be (2)
        f.obj should be (Person("jo", "lo"))
      case _ => fail("Unknown result: " + result)
    }
  }

  "process" should "run the action if validation passes" in {
    // given
    val p = Person("", "")

    // when
    val result = personForm(p).process(parseJson("""{ "firstName": "john", "lastName": "low", "uppercase": true }"""))

    // then
    result match {
      case f: InitialFormWithObject[_] =>
        f.obj should be (Person("JOHN", "LOW"))
      case _ => fail("Unknown result: " + result)
    }
  }
}
