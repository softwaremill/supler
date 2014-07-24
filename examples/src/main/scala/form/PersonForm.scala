package form

import entity.Person
import form.Supler._

object PersonForm extends App {
  val takieSobiePoleOdCzapy = field[Person, Int](_.shoeNumber)
    .validate(custom((e, v) => v == 10, (e, v) => ValidationError("Żle!")))

  val person = new Person

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

  val p = new Person()
  p.shoeNumber = 10
  println(takieSobiePoleOdCzapy.read(p))
  println(takieSobiePoleOdCzapy.write(p, 20).shoeNumber)

  println(jsonSchema.toString())
}
