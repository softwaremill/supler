package form

import entity.Person
import DSL._

object PersonForm {
  val takieSobiePoleOdCzapy = field[Person, Int](_.shoeNumber).validate(custom((e, v) => v == 10))

  val personForm = form[Person](f => List(
    f.field(_.name).validate(length(10), custom((entity, value) => value != null)).use(dataProvider(_ => List("a"))),
    f.row(f.field(_.lastName), f.field(_.lastName)),
    f.field(_.shoeNumber),
    takieSobiePoleOdCzapy
  ))
}
