package org.supler

import org.scalatest._
import org.supler.field.{ValueCompleteActionResult, RunActionContext, ActionResult}
import org.supler.Supler._

class SuplerActionTest extends FlatSpec with ShouldMatchers {
  case class A(bs: List[B])
  case class B(cs: List[C])
  case class C(name: String)

  it should "run an action" in {
    // given
    val fc = form[C](f => List(
      f.field(_.name),
      f.action("a") { c => ActionResult(c.copy(name = c.name + "*")) }))

    val fb = form[B](f => List(
      f.subform(_.cs, fc)))

    val fa = form[A](f => List(
      f.subform(_.bs, fb)))

    // when
    val result = fa.runAction(
      A(List(B(List(C("_"))))),
      org.json4s.native.JsonMethods.parse("""{"bs": [ { "cs": [ { "a": true } ] } ]}"""),
      RunActionContext(Nil))

    // then
    result should be (ValueCompleteActionResult(A(List(B(List(C("_*")))))))
  }

  it should "run parent actions" in {
    // given
    var callLog: List[String] = Nil

    def fc(remove: C => ActionResult[C]) = form[C](f => List(
      f.field(_.name),
      f.action("a") { c => callLog ::= "c"; remove(c.copy(name = c.name + "*"))}))

    def fb(remove: B => ActionResult[B]) = form[B](f => List(
      f.subform(_.cs, fc(f.parentAction { (b, j, c) => callLog ::= s"b $j $c"; remove(b)}))))

    val fa = form[A](f => List(
      f.subform(_.bs, fb(f.parentAction { (a, i, b) => callLog ::= s"a $i $b"; ActionResult(a)}))))

    // when
    val result = fa.runAction(
      A(List(B(List(C("_"))))),
      org.json4s.native.JsonMethods.parse( """{"bs": [ { "cs": [ { "a": true } ] } ]}"""),
      RunActionContext(Nil))

    // then
    result should be (ValueCompleteActionResult(A(List(B(List(C("_")))))))
    callLog should be (List(
      "a 0 B(List(C(_)))",
      "b 0 C(_*)",
      "c"
    ))
  }
}
