package form

import entity.Person
import org.supler.{ValidationError, Supler}
import Supler._
import org.json4s._

object PersonForm extends App {
  val takieSobiePoleOdCzapy = field[Person, Int](_.shoeNumber).label("Od Czapy")
    .validate(custom((e, v) => v == 10, (e, v) => ValidationError("Żle!")))

  val person = new Person

  val personForm = form[Person](f => List(
    f.field(_.name)
      .label("Name")
      .validate(
        minLength(10),
        custom((e, v) => v != null, (e, v) => ValidationError("null!"))),
    f.field(_.lastName).label("Last Name") || f.field(_.lastName).label("Second Last Name"),
    f.field(_.shoeNumber).label("Shoe Number").validate(ge(3)),
    f.field(_.gender).label("Gender").use(dataProvider(_ => List("Male", "Female")))
  ))

  val pf2 = personForm + takieSobiePoleOdCzapy
  val pf3 = personForm ++ List(takieSobiePoleOdCzapy, takieSobiePoleOdCzapy)

  def renderJson(jvalue: JValue) = {
    import org.json4s.native._
    prettyJson(renderJValue(jvalue))
  }

  val p = new Person()
  p.shoeNumber = 10
  println(takieSobiePoleOdCzapy.read(p))
  println(takieSobiePoleOdCzapy.write(p, 2).shoeNumber)

  println(personForm.doValidate(p))

  println(renderJson(personForm.generateJSONSchema(p)))
  println(renderJson(personForm.generateJSONValues(p)))
}
