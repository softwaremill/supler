package org.supler

import org.json4s.native._
import org.scalatest._
import org.supler.Supler._

class SuplerSubformTest extends FlatSpec with ShouldMatchers {
  // given
  case class Car(make: String, age: Int)
  val carForm = form[Car](f => List(
    f.field(_.make),
    f.field(_.age)
  ))

  case class PersonManyCars(name: String, cars: List[Car])
  val pmc1 = PersonManyCars("p1", List(Car("m1", 10), Car("m2", 20)))
  val pmc2 = PersonManyCars("p2", Nil)

  case class PersonManyCarsVector(name: String, cars: Vector[Car])
  val pmcv1 = PersonManyCarsVector("p1", Vector(Car("m1", 10), Car("m2", 20)))

  case class PersonOneCar(name: String, car: Car)
  val pc1 = PersonOneCar("p1", Car("m1", 10))

  case class PersonOptionalCal(name: String, car: Option[Car])
  val poc1 = PersonOptionalCal("p1", Some(Car("m1", 10)))
  val poc2 = PersonOptionalCal("p2", None)

  "subform" should "create a case class list field representation" in {
    // when
    object PersonMeta extends Supler[PersonManyCars] {
      val carsField = subform(_.cars, carForm)
    }

    // then
    import PersonMeta.carsField

    carsField.name should be ("cars")
    carsField.read(pmc1) should be (List(Car("m1", 10), Car("m2", 20)))
    carsField.read(pmc2) should be (Nil)
    carsField.write(pmc1, Nil).cars should be (Nil)
    carsField.write(pmc2, List(Car("m3", 30))).cars should be (List(Car("m3", 30)))
  }

  "subform" should "create a case class vector field representation" in {
    // when
    object PersonMeta extends Supler[PersonManyCarsVector] {
      val carsField = subform(_.cars, carForm)
    }

    // then
    import PersonMeta.carsField

    carsField.name should be ("cars")
    carsField.read(pmcv1) should be (Vector(Car("m1", 10), Car("m2", 20)))
    carsField.write(pmcv1, Vector()).cars should be (Vector())
  }

  "subform" should "create a case class single field representation" in {
    // when
    object PersonMeta extends Supler[PersonOneCar] {
      val carField = subform(_.car, carForm)
    }

    // then
    import PersonMeta.carField

    carField.name should be ("car")
    carField.read(pc1) should be (Car("m1", 10))
    carField.write(pc1, Car("m2", 20)).car should be (Car("m2", 20))
  }

  "subform" should "create a case class optional field representation" in {
    // when
    object PersonMeta extends Supler[PersonOptionalCal] {
      val carField = subform(_.car, carForm)
    }

    // then
    import PersonMeta.carField

    carField.name should be ("car")
    carField.read(poc1) should be (Some(Car("m1", 10)))
    carField.read(poc2) should be (None)
    carField.write(poc1, Some(Car("m2", 20))).car should be (Some(Car("m2", 20)))
    carField.write(poc2, None).car should be (None)
  }

  "subform" should "apply json values to a list field" in {
    // given
    import org.supler.Supler._
    val personForm = form[PersonManyCars](f => List(
      f.field(_.name),
      f.subform(_.cars, carForm)
    ))

    val jsonInOrder = parseJson("""
        |{
        | "cars": [
        |  {
        |   "make": "m1",
        |   "age": 10
        |  },
        |  {
        |   "make": "m2",
        |   "age": 20
        |  }
        | ]
        |}
      """.stripMargin)

    // when
    val result = personForm(PersonManyCars("", Nil)).applyJSONValues(jsonInOrder).formObjectAndErrors

    // then
    result.errors should be ('empty)
    result.obj should be (PersonManyCars("", List(Car("m1", 10), Car("m2", 20))))
  }

  "subform" should "apply json values to a single field" in {
    // given
    import org.supler.Supler._
    val personForm = form[PersonOneCar](f => List(
      f.field(_.name),
      f.subform(_.car, carForm)
    ))

    val json = parseJson("""
        |{
        | "car": {
        |  "make": "m1",
        |  "age": 10
        | }
        |}""".stripMargin)

    // when
    val result = personForm(PersonOneCar("", Car("m2", 20))).applyJSONValues(json).formObjectAndErrors

    // then
    result.errors should be ('empty)
    result.obj should be (PersonOneCar("", Car("m1", 10)))
  }

  "subform" should "apply json values to an optional field" in {
    // given
    import org.supler.Supler._
    val personForm = form[PersonOptionalCal](f => List(
      f.field(_.name),
      f.subform(_.car, carForm)
    ))

    val json1 = parseJson("""
        |{
        | "car": {
        |  "make": "m1",
        |  "age": 10
        | }
        |}""".stripMargin)

    val json2 = parseJson("{}")

    // when
    val result1 = personForm(PersonOptionalCal("", None)).applyJSONValues(json1).formObjectAndErrors
    val result2 = personForm(PersonOptionalCal("", None)).applyJSONValues(json2).formObjectAndErrors

    // then
    result1.errors should be ('empty)
    result1.obj should be (PersonOptionalCal("", Some(Car("m1", 10))))

    result2.errors should be ('empty)
    result2.obj should be (PersonOptionalCal("", None))
  }
}
