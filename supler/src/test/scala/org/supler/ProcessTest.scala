package org.supler

import org.json4s.native.JsonMethods._
import org.json4s.native._
import org.scalatest.{FlatSpec, ShouldMatchers}
import org.supler.Supler._
import org.supler.field.ActionResult

class ProcessTest extends FlatSpec with ShouldMatchers {

  case class Person(firstName: String, lastName: String)

  val personForm = form[Person](f => List(
    f.field(_.firstName).validate(minLength(3)),
    f.field(_.lastName).validate(minLength(3)),
    f.action("uppercase") { p => ActionResult(
      p.copy(firstName = p.firstName.toUpperCase, lastName = p.lastName.toUpperCase))
    }
      .validateAll()
  ))

  "process" should "validate filled fields if there's no action" in {
    // given
    val p = Person("", "")

    // when
    val result = personForm(p).process(parseJson( """{ "firstName": "jo", "lastName": "" }"""))

    // then
    result match {
      case f: FormWithObjectAndErrors[_] =>
        f.errors.length should be(1)
        f.obj should be(Person("jo", ""))
      case _ => fail("Unknown result: " + result)
    }
  }

  "process" should "run validations before actions and if there are errors, not run the action" in {
    // given
    val p = Person("", "")

    // when
    val result = personForm(p).process(parseJson( """{ "firstName": "jo", "lastName": "lo", "uppercase": true }"""))

    // then
    result match {
      case f: FormWithObjectAndErrors[_] =>
        f.errors.length should be(2)
        f.obj should be(Person("jo", "lo"))
      case _ => fail("Unknown result: " + result)
    }
  }

  "process" should "run the action if validation passes" in {
    // given
    val p = Person("", "")

    // when
    val result = personForm(p).process(parseJson( """{ "firstName": "john", "lastName": "low", "uppercase": true }"""))

    // then
    result match {
      case f: InitialFormWithObject[_] =>
        f.obj should be(Person("JOHN", "LOW"))
      case _ => fail("Unknown result: " + result)
    }
  }

  case class WorkPlace(boss: Person, employees: List[Person])

  val workPlaceForm = form[WorkPlace] { f => List(
    f.subform(_.boss, personForm),
    f.subform(_.employees, personForm)
  )
  }

  "process" should "evaluate modal subforms" in {
    // given
    val wp = WorkPlace(Person("Boss", "Bosowski"), List(Person("Leming", "Rycki"), Person("Prawak", "Narodowski")))

    // when
    val json = workPlaceForm(wp).process(parseJson( """{ "supler_modals":"boss", "boss": {"firstName": "john", "lastName": "low" } }""")).generateJSON()

    // then
    pretty(render(json)) should include (""""name":"boss",
                                           |      "enabled":true,
                                           |      "label":"",
                                           |      "type":"subform",
                                           |      "evaluated":true,""".stripMargin)
  }

  case class Mordor(workplaces: List[WorkPlace])

  val modalWorkplacesForm = form[Mordor] {f => List(
    f.subform(_.workplaces, workPlaceForm)
  )}

  val mordorForm = form[Mordor] { f => List(
    f.modal("mordor", m => m, (m: Mordor, mm: Mordor) => mm, modalWorkplacesForm)
  )
  }

  "process" should "evaluate deep modal subforms" in {
    // given
    val mordor = Mordor(List(WorkPlace(Person("Boss", "Bosowski"), List(Person("Leming", "Rycki"), Person("Prawak", "Narodowski")))))

    // when
    val json = mordorForm(mordor).process(
      parseJson(
        """{
          |"supler_modals":"mordor.workplaces[0].boss",
          |"mordor": {
          |"workplaces": [
          |   {"boss": {"firstName": "WillShow", "lastName": "WillShow" } } ] } }""".stripMargin)).generateJSON()

    // then
    val textjson = pretty(render(json))
    textjson should include ("WillShow")
  }

  val personWithActionsForm = form[Person] {f => List(
    f.field(_.firstName),
    f.field(_.lastName),
    f.modal("editPerson", p => p, (p: Person, u: Person) => p, personForm)
  )}

  val workplaceWithTableAndActionsForm = form[WorkPlace] {f => List(
    f.subform(_.employees, personWithActionsForm)
  )}

  "process" should "open modal on table" in {
    // given
    val workPlace = WorkPlace(Person("Boss", "Bosowski"), List(Person("Leming", "Rycki"), Person("Will", "Dissapear")))

    // when
    val json = workplaceWithTableAndActionsForm(workPlace).process(
      parseJson(
      """{
        |"supler_modals": "employees[0].editPerson",
        |"employees": [{
        |   "firstName": "Bonifacy",
        |   "lastName": "Pankracy",
        |   "editPerson": "employees[0].editPerson"
        |}]
        |}
      """.stripMargin
      )
    ).generateJSON()

    // then
    val textjson = pretty(render(json))
    textjson should include("""value":"Bonifacy""")
    textjson should include("""value":"Pankracy""")
    textjson shouldNot include("""value":"Will""")
    textjson shouldNot include("""value":"Dissapear""")
  }
}
