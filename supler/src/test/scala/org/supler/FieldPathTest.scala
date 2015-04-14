package org.supler

import org.scalatest.{FlatSpec, ShouldMatchers}
import org.supler.field.{BasicField, ModalField}

class FieldPathTest extends FlatSpec with ShouldMatchers {
  val serializeData = List(
    (EmptyPath, ""),
    (EmptyPath.append("f"), "f"),
    (EmptyPath.append("f").append("g"), "f.g"),
    (EmptyPath.append("f").append("g").append("h"), "f.g.h"),
    (EmptyPath.appendWithIndex("f", 10).append("g"), "f[10].g"),
    (EmptyPath.appendWithIndex("f", 10).appendWithIndex("g", 9), "f[10].g[9]")
  )

  for ((path, expectedResult) <- serializeData) {
    it should s"serialize $path into $expectedResult" in {
      path.toString should be(expectedResult)
    }
  }

  var childOfData = List(
    (EmptyPath, EmptyPath, true),
    (EmptyPath.append("f"), EmptyPath.append("f"), true),
    (EmptyPath.append("f").append("g"), EmptyPath.append("f").append("g"), true),
    (EmptyPath.append("f"), EmptyPath, true),
    (EmptyPath, EmptyPath.append("f"), false),
    (EmptyPath.append("f").append("g"), EmptyPath.append("f"), true),
    (EmptyPath.append("f"), EmptyPath.append("f").append("g"), false),
    (EmptyPath.append("field10"), EmptyPath.append("field1"), false),
    (EmptyPath.appendWithIndex("field", 9), EmptyPath.append("field"), true),
    (EmptyPath.appendWithIndex("field", 9), EmptyPath.appendWithIndex("field", 9), true),
    (EmptyPath.appendWithIndex("field", 9), EmptyPath.appendWithIndex("field", 8), false),
    (EmptyPath.appendWithIndex("field", 9).append("g"), EmptyPath.appendWithIndex("field", 9), true)
  )

  for ((path, candidateParent, expectedResult) <- childOfData) {
    it should s"check if $path is a child of $candidateParent, returning $expectedResult" in {
      path.childOf(candidateParent) should be(expectedResult)
    }
  }

  val stringsToParse = List(
    ("", EmptyPath),
    (null, EmptyPath),
    ("this.is.sparta", SingleFieldPath(SingleFieldPath(SingleFieldPath(EmptyPath, "this"), "is"), "sparta")),
    ("this.is[0].sparta[10]", SingleIndexedFieldPath(SingleIndexedFieldPath(SingleFieldPath(EmptyPath, "this"), "is", 0), "sparta", 10))
  )

  for ((stringPath, expected) <- stringsToParse) {
    it should s"parse '$stringPath' into FieldPath properly" in {
      FieldPath.parse(stringPath) should be(expected)
    }
  }

  import org.supler.ModalFormTest._

  val person = Person("Witold", Car("Lada", Address("Stritskaya") :: Address("Otherskaya") :: Nil) :: Car("Bentley", List(Address("Warsaw 1"))) :: Nil)

  "supler" should "find string field by path" in {
    // given
    val fieldAndObject = personForm.findFieldAndObjectByPath("name", person)

    // expect
    fieldAndObject.map(_._1.isInstanceOf[BasicField[_, _]]) shouldBe Some(true)
    fieldAndObject.map(_._1.name) shouldBe Some("name")
    fieldAndObject.map(_._2) shouldBe Some(person)
  }

  "supler" should "find modal field by path" in {
    // given
    val fieldAndObject = personForm.findFieldAndObjectByPath("cars[0].editCar", person)

    // expect
    fieldAndObject.map(_._1.isInstanceOf[ModalField[_, _]]) shouldBe Some(true)
    fieldAndObject.map(_._1.name) shouldBe Some("editCar")
    fieldAndObject.map(_._2) shouldBe Some(person.cars(0))
  }

  "supler" should "find field in double embedded subform" in  {
    // given
    val fieldAndObject = personForm.findFieldAndObjectByPath("cars[0].garages[1].street", person)

    // expect
    fieldAndObject.map(_._1.isInstanceOf[BasicField[_, _]]) shouldBe Some(true)
    fieldAndObject.map(_._1.name) shouldBe Some("street")
    fieldAndObject.map(_._2) shouldBe Some(person.cars(0).garages(1))
  }
}
