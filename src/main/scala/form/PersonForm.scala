package form

import entity.Person
import Supler._

object PersonForm {
  val takieSobiePoleOdCzapy = field[Person, Int](_.shoeNumber)
    .validate(custom((e, v) => v == 10, (e, v) => ValidationError("Żle!")))

  val personForm = form[Person](f => List(
    f.field(_.name)
      .validate(
        minLength(10),
        custom((e, v) => v != null, (e, v) => ValidationError("null!")))
      .use(dataProvider(_ => List("a"))),
    f.field(_.lastName) || f.field(_.lastName),
    f.field(_.shoeNumber).validate(ge(3)),
    takieSobiePoleOdCzapy
  ))
}
