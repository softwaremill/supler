package org.supler

import org.scalatest._
import org.supler.Supler._
import org.json4s.native.JsonMethods._

class SelectFieldTest extends FlatSpec with ShouldMatchers {
  case class Select1Required(field1: String)
  case class Select1Optional(field1: Option[String])

  val fReqField1 = selectOneField[Select1Required, String](_.field1)(identity)
    .possibleValues(_ => List("a", "b", "c")).label("Field 1")

  val fReq = form[Select1Required](f => List(fReqField1))

  val fOpt = form[Select1Optional](f => List(
    f.selectOneField(_.field1)(_.getOrElse("")).possibleValues(_ => List(Some("a"), Some("b")))
  ))

  it should "apply from possible values basing on list index when no custom id function is provided" in {
    // when
    val result = fReq(Select1Required("a")).applyJSONValues(parse("""{"field1": "1"}"""))

    // then
    result.obj should be (Select1Required("b"))
  }

  it should "not apply and leave value intact, fail validation if no value is selected and a value is required" in {
    // when
    val result = fReq(Select1Required("")).applyJSONValues(parse("""{"field1": null}"""))

    // then
    result.obj should be (Select1Required(""))
    result.doValidate().errors should have size (1)
  }

  it should "apply an empty value if no value is selected and a value is optional, pass validation" in {
    // when
    val result = fOpt(Select1Optional(Some("a"))).applyJSONValues(parse("""{"field1": null}"""))

    // then
    result.obj should be (Select1Optional(None))
    result.doValidate().errors should have size (0)
  }

  it should "apply a selected value basing on custom id when custom id function is provided" in {
    // given
    val fReqCustomId = form[Select1Required](f => List(fReqField1.idForValue(s => s+s)))

    // when
    val result = fReqCustomId(Select1Required("a")).applyJSONValues(parse("""{"field1": "bb"}"""))

    // then
    result.obj should be (Select1Required("b"))
  }

  it should "use list indexes when serializing when no custom id function is provided" in {
    // when
    val json = fReq(Select1Required("a")).generateJSON

    // then
    val renderedJson = compact(render(json))
    renderedJson should include (""""id":"0"""")
    renderedJson should include (""""id":"1"""")
  }

  it should "use custom ids when serializing when custom id function is provided" in {
    // given
    val fReqCustomId = form[Select1Required](f => List(fReqField1.idForValue(s => s+s)))

    // when
    val json = fReqCustomId(Select1Required("a")).generateJSON

    // then
    val renderedJson = compact(render(json))
    renderedJson should include (""""id":"aa"""")
    renderedJson should include (""""id":"bb"""")
  }
}
