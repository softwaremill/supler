package org.supler

import java.util.Date

import org.json4s.native.JsonMethods._
import org.scalatest._
import org.supler.Supler._

class TransformerTest extends FlatSpec with ShouldMatchers {

  case class DateObj(date: Date)

  val dateForm = form[DateObj](f => List(
    f.field(_.date)
  ))

  "date transformer" should "add date hint by default" in {
    // given
    val dateObj = DateObj(new Date())

    // when
    val json = dateForm(dateObj).generateJSON

    // then
    compact(render(json)) should include (""""render_hint":{"name":"date"}""")
  }
}
