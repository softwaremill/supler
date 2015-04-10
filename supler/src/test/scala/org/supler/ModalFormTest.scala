package org.supler

import org.scalatest._

class ModalFormTest extends FlatSpec with ShouldMatchers {

  "supler" should "return modal response in applyJSONValues for modal request" in {

  }
}

object ModalFormTest {
  import org.supler.Supler._

  case class Person(name: String, cars: List[Car])

  case class Car(name: String, garages: List[Address])

  case class Address(street: String)

  val carModalForm = form[Car](f => List(
    f.field(_.name)
  ))

  val addressForm = form[Address](f => List(
    f.field(_.street)
  ))

  val carForm = form[Car](f => List(
    f.staticField(c => Message(c.name)),
    f.modal("editCar")(carModalForm(_)),
    f.subform(_.garages, addressForm)
  ))

  val personForm = form[Person](f => List(
    f.field(_.name),
    f.subform(_.cars, carForm).renderHint(asTable())
  ))
}