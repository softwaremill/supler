package org.supler

import org.json4s.native.JsonMethods._
import org.scalatest.{FlatSpec, ShouldMatchers}
import org.supler.Supler._

class ConditionalFieldsTest extends FlatSpec with ShouldMatchers {
  case class Person(f1: String, f2: String, flag: Boolean)

  val personFormIncl = form[Person](f => List(
    f.field(_.f1).includeIf(_.flag),
    f.field(_.f2)
  ))

  val personFormEn = form[Person](f => List(
    f.field(_.f1).enabledIf(_.flag),
    f.field(_.f2)
  ))

  val personValuesJson = parse(
    """{
      | "f1": "v11",
      | "f2": "v22"
      |}""".stripMargin)

  it should "include a conditional field in the json depending on the entity" in {
    // when
    val jsonWithFlagTrue = personFormIncl(Person("v1", "v2", flag = true)).generateJSON
    val jsonWithFlagFalse = personFormIncl(Person("v1", "v2", flag = false)).generateJSON

    // then
    pretty(render(jsonWithFlagTrue)) should include ("f1")
    pretty(render(jsonWithFlagFalse)) should not include ("f1")
  }

  it should "apply values to a conditional field only if it is included" in {
    // when
    val rTrue = personFormIncl(Person("v1", "v2", flag = true)).applyJSONValues(personValuesJson).formObjectAndErrors
    val rFalse = personFormIncl(Person("v1", "v2", flag = false)).applyJSONValues(personValuesJson).formObjectAndErrors

    // then
    rTrue.obj should be (Person("v11", "v22", flag = true))
    rFalse.obj should be (Person("v1", "v22", flag = false))
  }

  it should "apply values to a conditional field only if it is enabled" in {
    // when
    val rTrue = personFormEn(Person("v1", "v2", flag = true)).applyJSONValues(personValuesJson).formObjectAndErrors
    val rFalse = personFormEn(Person("v1", "v2", flag = false)).applyJSONValues(personValuesJson).formObjectAndErrors

    // then
    rTrue.obj should be (Person("v11", "v22", flag = true))
    rFalse.obj should be (Person("v1", "v22", flag = false))
  }

  it should "validate fields even if they are not included" in {
    // when
    val rTrue = personFormIncl(Person("", "v2", flag = true)).doValidate()
    val rFalse = personFormIncl(Person("", "v2", flag = false)).doValidate()

    // then
    rTrue.validationErrors should have size (1)
    rFalse.validationErrors should have size (1)
  }

  it should "validate fields even if they are not enabled" in {
    // when
    val rTrue = personFormEn(Person("", "v2", flag = true)).doValidate()
    val rFalse = personFormEn(Person("", "v2", flag = false)).doValidate()

    // then
    rTrue.validationErrors should have size (1)
    rFalse.validationErrors should have size (1)
  }
}
