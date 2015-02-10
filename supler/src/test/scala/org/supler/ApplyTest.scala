package org.supler

import org.json4s.JsonAST._
import org.scalatest.{FlatSpec, ShouldMatchers}

class ApplyTest extends FlatSpec with ShouldMatchers {
  "form" should "apply json values to the entity given" in {
    // given
    case class Person(f1: String, f2: Option[Int], f3: Boolean, f4: Option[String])

    val form = Supler.form[Person](f => List(
      f.field(_.f1),
      f.field(_.f2),
      f.field(_.f3),
      f.field(_.f4)
    ))

    val jsonInOrder = JObject(
      JField("f1", JString("John")),
      JField("f2", JInt(10)),
      JField("f3", JBool(value = true)),
      JField("f4", JString("Something"))
    )

    val jsonOutOfOrder = JObject(
      JField("f3", JBool(value = true)),
      JField("f2", JInt(10)),
      JField("f4", JString("")),
      JField("f1", JString("John"))
    )

    val jsonPartial = JObject(
      JField("f1", JString("John")),
      JField("f2", JInt(10))
    )

    val p = Person("Mary", None, f3 = false, Some("Nothing"))

    // when
    val p1 = form(p).applyJSONValues(jsonInOrder).obj
    val p2 = form(p).applyJSONValues(jsonOutOfOrder).obj
    val p3 = form(p).applyJSONValues(jsonPartial).obj

    // then
    p1 should be (Person("John", Some(10), f3 = true, Some("Something")))
    p2 should be (Person("John", Some(10), f3 = true, None))
    p3 should be (Person("John", Some(10), f3 = false, Some("Nothing")))
  }
}
