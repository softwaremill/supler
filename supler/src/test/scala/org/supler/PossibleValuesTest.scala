package org.supler

import org.scalatest._
import org.supler.Supler._
import org.json4s.native.JsonMethods._

class PossibleValuesTest extends FlatSpec with ShouldMatchers {
  case class Select1Required(field1: String)

  val fReq = form[Select1Required](f => List(
    f.field(_.field1).label("Field 1").possibleValues(_ => List("a", "b", "c"))
  ))

  it should "apply a new value from the possible values" in {
    // when
    val result = fReq(Select1Required("a")).applyJSONValues(parse("""{"field1": 1}"""))

    // then
    result.obj should be (Select1Required("b"))
  }

  it should "leave an empty selection intact and fail validation" in {
    // when
    val result = fReq(Select1Required("")).applyJSONValues(parse("""{"field1": -1}"""))

    // then
    result.obj should be (Select1Required(""))
    result.doValidate().errors should have size (1)
  }
}
