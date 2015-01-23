package org.demo

import org.supler.Supler._
import org.json4s.JsonAST.JString
import org.supler.field.ActionResult

// The person form used one the http://docs.supler.io/en/latest/first.html#first page
object DocsPersonForm {
  case class Person(name: String, age: Int, address: Option[String], likesChocolate: Boolean)

  val docsPersonForm = form[Person](f => List(
    f.field(_.name).label("Name"),
    f.field(_.age).label("Age").validate(gt(1), le(150)),
    f.field(_.address).label("Address"),
    f.field(_.likesChocolate).label("Do you like chocolate?"),
    f.action("save") { p => ActionResult.custom(JString("Saved")) }.label("Save").validateAll()
  ))

  val aDocsPerson = Person("Brenda Walsh", 28, Some("Beverly Hills 90210, CA, USA"), likesChocolate = true)
}
