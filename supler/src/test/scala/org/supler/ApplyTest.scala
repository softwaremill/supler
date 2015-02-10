package org.supler

import org.json4s.JsonAST._
import org.scalatest.{FlatSpec, ShouldMatchers}
import Supler._
import org.json4s.native._

class ApplyTest extends FlatSpec with ShouldMatchers {
  "form" should "apply json values to the entity given" in {
    // given
    case class Person(f1: String, f2: Option[Int], f3: Boolean, f4: Option[String])

    val personForm = form[Person](f => List(
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
    val p1 = personForm(p).applyJSONValues(jsonInOrder).obj
    val p2 = personForm(p).applyJSONValues(jsonOutOfOrder).obj
    val p3 = personForm(p).applyJSONValues(jsonPartial).obj

    // then
    p1 should be (Person("John", Some(10), f3 = true, Some("Something")))
    p2 should be (Person("John", Some(10), f3 = true, None))
    p3 should be (Person("John", Some(10), f3 = false, Some("Nothing")))
  }

  "form" should "apply null values to an optional and not-optional int fields" in {
    // given
    case class Data(f1: Int, f2: Option[Int])

    val dataForm = form[Data](f => List(
      f.field(_.f1),
      f.field(_.f2)
    ))

    val jsonBothNull = parseJson("""{"f1": null, "f2": null}""")
    val jsonOneNull = parseJson("""{"f1": 20, "f2": null}""")
    val jsonOneMissing = parseJson("""{"f1": 30}""")
    val jsonBothSet = parseJson("""{"f1": 40, "f2": 41}""")

    // when
    val d1 = dataForm(Data(10, Some(11))).applyJSONValues(jsonBothNull).obj
    val d2 = dataForm(Data(10, Some(11))).applyJSONValues(jsonOneNull).obj
    val d3 = dataForm(Data(10, Some(11))).applyJSONValues(jsonOneMissing).obj
    val d4 = dataForm(Data(10, Some(11))).applyJSONValues(jsonBothSet).obj

    // then
    d1 should be (Data(10, None))
    d2 should be (Data(20, None))
    d3 should be (Data(30, Some(11)))
    d4 should be (Data(40, Some(41)))
  }
}
