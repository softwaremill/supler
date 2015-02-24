package org.supler

import org.json4s.JsonAST.JObject
import org.json4s.native.JsonMethods._
import org.scalatest._

class FormMetaTest extends FlatSpec with ShouldMatchers {
  "meta" should "serialize to json" in {
    // given
    val m = FormMeta(Map()) + ("tomek", "domek") + ("witek", "sprytek")

    // when
    val json = compact(render(JObject(m.toJSON)))

    // then
    json should be("{\"supler_meta\":{\"tomek\":\"domek\",\"witek\":\"sprytek\"}}")
  }

  "meta" should "deserialize from json" in {
    // given
    val json =
      """
        |{
        |"supler_meta": {
        | "entityId": "123",
        | "power": "high"
        |},
        |"some_field": "foo",
        |"other_field": "bar"
        |}
      """.stripMargin
    val jsonParsed = parse(json)

    // when
    val meta = FormMeta.fromJSON(jsonParsed)

    // then
    meta("entityId") should be ("123")
    meta("power") should be ("high")
  }
}
