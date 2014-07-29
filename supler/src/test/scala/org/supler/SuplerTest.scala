package org.supler

import org.json4s.JsonAST._
import org.scalatest.{FlatSpec, ShouldMatchers}

class SuplerTest extends FlatSpec with ShouldMatchers {
  "field" should "create a variable field representation" in {
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
    f1Field.required should be (true)
    f1Field.fieldType should be (StringFieldType)
    f1Field.generateJSONValues(p1) should be (List(JField("f1", JString("s11"))))
    f1Field.generateJSONValues(p2) should be (List(JField("f1", JString("s21"))))

    f2Field.name should be ("f2")
    f2Field.read(p1) should be (Some(10))
    f2Field.read(p2) should be (None)
    f2Field.write(p1, None).f2 should be (None)
    f2Field.write(p2, Some(20)).f2 should be (Some(20))
    f2Field.required should be (false)
    f2Field.fieldType should be (OptionalFieldType(IntFieldType))
    f2Field.generateJSONValues(p1) should be (Nil)
    f2Field.generateJSONValues(p2) should be (List(JField("f2", JInt(20))))
  }

  "field" should "create a case class field representation" in {
    // given
    case class Person(f1: String, f2: Option[Int], f3: Boolean, f4: String)

    val p1 = Person("s1", Some(10), f3 = true, "x1")
    val p2 = Person("s2", None, f3 = false, "x2")

    // when
    object PersonMeta extends Supler[Person] {
      val f1Field = field(_.f1)
      val f2Field = field(_.f2)
      val f3Field = field(_.f3)
      val f4Field = field(_.f4)
    }

    // then
    import PersonMeta._

    f1Field.name should be ("f1")
    f1Field.read(p1) should be ("s1")
    f1Field.read(p2) should be ("s2")
    f1Field.write(p1, "s11").f1 should be ("s11")
    f1Field.write(p2, "s21").f1 should be ("s21")
    f1Field.required should be (true)
    f1Field.fieldType should be (StringFieldType)
    f1Field.generateJSONValues(p1) should be (List(JField("f1", JString("s1"))))
    f1Field.generateJSONValues(p2) should be (List(JField("f1", JString("s2"))))

    f2Field.name should be ("f2")
    f2Field.read(p1) should be (Some(10))
    f2Field.read(p2) should be (None)
    f2Field.write(p1, None).f2 should be (None)
    f2Field.write(p2, Some(20)).f2 should be (Some(20))
    f2Field.required should be (false)
    f2Field.fieldType should be (OptionalFieldType(IntFieldType))
    f2Field.generateJSONValues(p1) should be (List(JField("f2", JInt(10))))
    f2Field.generateJSONValues(p2) should be (Nil)

    f3Field.name should be ("f3")
    f3Field.read(p1) should be (true)
    f3Field.read(p2) should be (false)
    f3Field.write(p1, false).f3 should be (false)
    f3Field.write(p2, true).f3 should be (true)
    f3Field.required should be (true)
    f3Field.fieldType should be (BooleanFieldType)
    f3Field.generateJSONValues(p1) should be (List(JField("f3", JBool(true))))
    f3Field.generateJSONValues(p2) should be (List(JField("f3", JBool(false))))

    f4Field.name should be ("f4")
    f4Field.read(p1) should be ("x1")
    f4Field.read(p2) should be ("x2")
    f4Field.write(p1, "x11").f4 should be ("x11")
    f4Field.write(p2, "x21").f4 should be ("x21")
    f4Field.required should be (true)
    f4Field.fieldType should be (StringFieldType)
    f4Field.generateJSONValues(p1) should be (List(JField("f4", JString("x1"))))
    f4Field.generateJSONValues(p2) should be (List(JField("f4", JString("x2"))))
  }

  "form" should "generate json values basing on the entity passed" in {
    // given
    case class Person(f1: String, f2: Option[Int], f3: Boolean)

    val form = Supler.form[Person](f => List(
      f.field(_.f1),
      f.field(_.f2),
      f.field(_.f3)
    ))

    val p = Person("John", Some(10), f3 = true)

    // when
    val json = form.generateJSONValues(p)

    // then
    json should be (JObject(
      JField("f1", JString("John")),
      JField("f2", JInt(10)),
      JField("f3", JBool(value = true))
    ))
  }

  "form" should "apply json values to the entity given" in {
    // given
    case class Person(f1: String, f2: Option[Int], f3: Boolean)

    val form = Supler.form[Person](f => List(
      f.field(_.f1),
      f.field(_.f2),
      f.field(_.f3)
    ))

    val jsonInOrder = JObject(
      JField("f1", JString("John")),
      JField("f2", JInt(10)),
      JField("f3", JBool(value = true))
    )

    val jsonOutOfOrder = JObject(
      JField("f3", JBool(value = true)),
      JField("f2", JInt(10)),
      JField("f1", JString("John"))
    )

    val jsonPartial = JObject(
      JField("f1", JString("John")),
      JField("f2", JInt(10))
    )

    val p = Person("Mary", None, f3 = false)

    // when
    val p1 = form.applyJSONValues(p, jsonInOrder)
    val p2 = form.applyJSONValues(p, jsonOutOfOrder)
    val p3 = form.applyJSONValues(p, jsonPartial)

    // then
    p1 should be (Person("John", Some(10), f3 = true))
    p2 should be (Person("John", Some(10), f3 = true))
    p3 should be (Person("John", Some(10), f3 = false))
  }
}
