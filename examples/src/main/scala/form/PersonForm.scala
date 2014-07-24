package form

import entity.Person
import form.Supler._

object PersonForm extends App {
  val takieSobiePoleOdCzapy = field[Person, Int](_.shoeNumber).label("Od Czapy")
    .validate(custom((e, v) => v == 10, (e, v) => ValidationError("Żle!")))

  val person = new Person

  val personForm = form[Person](f => List(
    f.field(_.name)
      .label("Name")
      .validate(
        minLength(10),
        custom((e, v) => v != null, (e, v) => ValidationError("null!")))
      .use(dataProvider(_ => List("a"))),
    f.field(_.lastName).label("Last Name") || f.field(_.lastName).label("Second Last Name"),
    f.field(_.shoeNumber).label("Shoe Number").validate(ge(3)),
    takieSobiePoleOdCzapy
  ))

  val p = new Person()
  p.shoeNumber = 10
  println(takieSobiePoleOdCzapy.read(p))
  println(takieSobiePoleOdCzapy.write(p, 2).shoeNumber)

  println(personForm.doValidate(p))

  println(personForm.generateSchema)
}
