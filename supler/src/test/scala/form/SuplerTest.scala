package form

import org.scalatest.{FlatSpec, ShouldMatchers}

class SuplerTest extends FlatSpec with ShouldMatchers {
  it should "create a field representation for a variable field" in {
    // given
    class Person {
      var f1: String = ""
      var f2: Option[Int] = Some(0)
    }

    val p1 = new Person { f1 = "s1"; f2 = Some(10) }
    val p2 = new Person { f1 = "s2"; f2 = None }

    // when
    object PersonMeta extends Supler[Person] {
      val f1Field = field(_.f1)
      val f2Field = field(_.f2)
    }

    // then
    import PersonMeta._

    f1Field.name should be ("f1")
    f1Field.read(p1) should be ("s1")
    f1Field.read(p2) should be ("s2")
    f1Field.write(p1, "s11").f1 should be ("s11")
    f1Field.write(p2, "s21").f1 should be ("s21")

    f2Field.name should be ("f2")
    f2Field.read(p1) should be (Some(10))
    f2Field.read(p2) should be (None)
    f2Field.write(p1, None).f2 should be (None)
    f2Field.write(p2, Some(20)).f2 should be (Some(20))
  }
}
