import form.{FormMacro, Supler}
import FormMacro._
import form.Supler

case class Tomek(name: String, lastName: String)

object Test extends App {
  val tomek = Tomek("Tomek", "Szymanski")

  Supler.newField("name")

//  field(tomek.lastName)
//
//  val closure = { t: Tomek =>
//    field(t.lastName)
//    field({o: Tomek => o.name})
//  }

//  closure(tomek)
}

