package form

import entity.Person
import DSL._

object PersonForm {
  val personForm = form[Person](
    row(field(_.name, length(10), validation((entity, value: String) => value != null), dataProvider(_ => List("a")))),
    row(field(_.lastName), field(_.lastName)),
    row(field(_.shoeNumber))
  )
}
