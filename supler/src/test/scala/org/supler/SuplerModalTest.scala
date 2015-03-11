package org.supler

import org.json4s.native.JsonMethods._
import org.scalatest._
import org.supler.Supler._

class SuplerModalTest extends FlatSpec with ShouldMatchers {
  case class A(bs: List[B])
  case class B(name: String)

  val fbmodal = form[B](f => List(
    f.field(_.name)
  ))

  it should "open modal" in {
    // given
    val fa = form[A](f => List(
      f.modal("openFirst"){a => fbmodal(a.bs(0))}
    ))
    val b = B("No elo")
    val a = A(List(b))

    // when
    val Some(showableModal) = fa.findModal(
      EmptyPath,
      a,
      parse("""{"openFirst": true}""")
    )

    // then
    showableModal.path should be (EmptyPath.append("openFirst"))
    showableModal.form should be (InitialFormWithObject[B](fbmodal, b, None, FormMeta(Map())))
  }

  it should "open modal on subform" in {
    // given
    val fb = form[B](f => List(
      f.field(_.name),
      f.modal("openB"){fbmodal(_)}))

    val fa = form[A](f => List(
      f.subform(_.bs, fb)))

    val b = B("No elo")
    val a = A(List(b))

    // when
    val Some(showableModal) = fa.findModal(
      EmptyPath,
      a,
      parse("""{"bs": [ { "openB": true } ]}"""))

    // then
    showableModal.path should be (EmptyPath.appendWithIndex("bs", 0).append("openB"))
    showableModal.form should be (InitialFormWithObject[B](fbmodal, b, None, FormMeta(Map())))
  }
}
