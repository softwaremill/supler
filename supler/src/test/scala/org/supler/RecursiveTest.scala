package org.supler

import org.json4s.native._
import org.scalatest._
import Supler._

class RecursiveTest extends FlatSpec with ShouldMatchers {
  case class Person(name: String, children: List[Person])
  
  def personForm: Form[Person] = form[Person](f => 
    List(
      f.field(_.name),
      f.subform((p: Person) => p.children, personForm)
    )
  )
  
  "subform" should "apply json values to a list field" in {
  
  val jsonInOrder = parseJson("""
    |{
    | "name": "n",
    | "children": [
    |  {
    |   "name": "c1"
    |  },
    |  {
    |   "name": "c2"
    |  }
    | ]
    |}
  """.stripMargin)
  
  // when
  val result = personForm(Person("", Nil)).applyJSONValues(jsonInOrder)

  // then
  result.errors should be ('empty)
  result.obj should be (Person("n", List(Person("c1", Nil), Person("c2", Nil))))
  }
}
