package org.supler

import org.scalatest._
import org.supler.Supler._
import org.supler.validation._

class SuplerValidationTest extends FlatSpec with ShouldMatchers {
  "field" should "validate required" in {
    // given
    case class Person(f1: String, f2: Option[String], f3: Int, f4: Option[Int])

    val p1 = Person("s1", Some("x1"), 10, Some(11))
    val p2 = Person("", None, 0, None)
    val p3 = Person(null, null, 12, null)

    // when
    object PersonMeta extends Supler[Person] {
      val f1Field = field(_.f1)
      val f2Field = field(_.f2)
      val f3Field = field(_.f3)
      val f3Field2 = field(_.f3).emptyValue(Some(10))
      val f4Field = field(_.f4)
    }

    // then
    import PersonMeta._

    f1Field.doValidate(EmptyPath, p1, None, ValidateAll).size should be (0)
    f1Field.doValidate(EmptyPath, p2, None, ValidateAll).size should be (1)
    f1Field.doValidate(EmptyPath, p3, None, ValidateAll).size should be (1)

    f2Field.doValidate(EmptyPath, p1, None, ValidateAll).size should be (0)
    f2Field.doValidate(EmptyPath, p2, None, ValidateAll).size should be (0)
    f2Field.doValidate(EmptyPath, p3, None, ValidateAll).size should be (0)

    f3Field.doValidate(EmptyPath, p1, None, ValidateAll).size should be (0)
    f3Field.doValidate(EmptyPath, p2, None, ValidateAll).size should be (1)
    f3Field.doValidate(EmptyPath, p3, None, ValidateAll).size should be (0)

    f3Field2.doValidate(EmptyPath, p1, None, ValidateAll).size should be (1)
    f3Field2.doValidate(EmptyPath, p2, None, ValidateAll).size should be (0)
    f3Field2.doValidate(EmptyPath, p3, None, ValidateAll).size should be (0)

    f4Field.doValidate(EmptyPath, p1, None, ValidateAll).size should be (0)
    f4Field.doValidate(EmptyPath, p2, None, ValidateAll).size should be (0)
    f4Field.doValidate(EmptyPath, p3, None, ValidateAll).size should be (0)
  }

  "field" should "not validate empty values if validating only filled" in {
    // given
    case class Person(f1: String)

    val p1 = Person("aaaa")
    val p2 = Person("aa")
    val p3 = Person("")
    val p4 = Person(null)

    // when
    object PersonMeta extends Supler[Person] {
      val f1Field = field(_.f1).validate(minLength(3))
    }

    // then
    import PersonMeta._

    f1Field.doValidate(EmptyPath, p1, None, ValidateAll).size should be (0)
    f1Field.doValidate(EmptyPath, p2, None, ValidateAll).size should be (1)
    f1Field.doValidate(EmptyPath, p3, None, ValidateAll).size should be (2)
    f1Field.doValidate(EmptyPath, p4, None, ValidateAll).size should be (1)

    f1Field.doValidate(EmptyPath, p1, None, ValidateFilled).size should be (0)
    f1Field.doValidate(EmptyPath, p2, None, ValidateFilled).size should be (1)
    f1Field.doValidate(EmptyPath, p3, None, ValidateFilled).size should be (0)
    f1Field.doValidate(EmptyPath, p4, None, ValidateFilled).size should be (0)
  }

  "form" should "validate the specified form fragment" in {
    // given
    case class Person(size: Int)
    case class City(name: String, people: List[Person])

    val personForm = form[Person](f => List(f.field(_.size).validate(gt(0))))
    val cityForm = form[City](f => List(
      f.field(_.name),
      f.subform(_.people, personForm)
    ))

    val c1 = City("city1", List(Person(10), Person(20)))
    val c2 = City("city2", List(Person(-10)))
    val c3 = City("", List(Person(20), Person(-10), Person(0)))

    // when
    cityForm.doValidate(EmptyPath, c1, None, ValidateAll).size should be (0)
    cityForm.doValidate(EmptyPath, c2, None, ValidateAll).size should be (1)
    cityForm.doValidate(EmptyPath, c3, None, ValidateAll).size should be (4)

    cityForm.doValidate(EmptyPath, c1, None, ValidateFilled).size should be (0)
    cityForm.doValidate(EmptyPath, c2, None, ValidateFilled).size should be (1)
    cityForm.doValidate(EmptyPath, c3, None, ValidateFilled).size should be (1)

    cityForm.doValidate(EmptyPath, c1, None, ValidateNone).size should be (0)
    cityForm.doValidate(EmptyPath, c2, None, ValidateNone).size should be (0)
    cityForm.doValidate(EmptyPath, c3, None, ValidateNone).size should be (0)

    cityForm.doValidate(EmptyPath, c1, None, ValidateInPath(EmptyPath)).size should be (0)
    cityForm.doValidate(EmptyPath, c2, None, ValidateInPath(EmptyPath)).size should be (1)
    cityForm.doValidate(EmptyPath, c3, None, ValidateInPath(EmptyPath)).size should be (4)

    cityForm.doValidate(EmptyPath, c1, None, ValidateInPath(EmptyPath.append("people"))).size should be (0)
    cityForm.doValidate(EmptyPath, c2, None, ValidateInPath(EmptyPath.append("people"))).size should be (1)
    cityForm.doValidate(EmptyPath, c3, None, ValidateInPath(EmptyPath.append("people"))).size should be (3)

    cityForm.doValidate(EmptyPath, c1, None, ValidateInPath(EmptyPath.appendWithIndex("people", 1))).size should be (0)
    cityForm.doValidate(EmptyPath, c2, None, ValidateInPath(EmptyPath.appendWithIndex("people", 1))).size should be (0)
    cityForm.doValidate(EmptyPath, c3, None, ValidateInPath(EmptyPath.appendWithIndex("people", 1))).size should be (1)
  }

  "field" should "validate an optional string field only if the field has a value" in {
    // given
    case class Data(f: Option[String])

    val dataOkSome = Data(Some("abcde"))
    val dataError = Data(Some("ab"))
    val dataOkNone = Data(None)

    // when
    object DataMeta extends Supler[Data] {
      val field1 = field(_.f).validate(ifDefined(minLength(3)))
    }

    // then
    import DataMeta._

    field1.doValidate(EmptyPath, dataOkSome, None, ValidateAll).size should be (0)
    field1.doValidate(EmptyPath, dataError, None, ValidateAll).size should be (1)
    field1.doValidate(EmptyPath, dataOkNone, None, ValidateAll).size should be (0)
  }

  "field" should "validate ints, longs, doubles and floats" in {
    // given
    case class IntData(f1: Int)
    case class LongData(f1: Long)
    case class DoubleData(f1: Double)
    case class FloatData(f1: Float)

    val intDataOk = IntData(20)
    val intDataError = IntData(5)

    val longDataOk = LongData(20L)
    val longDataError = LongData(5L)

    val doubleDataOk = DoubleData(10.3d)
    val doubleDataError = DoubleData(10.1d)

    val floatDataOk = FloatData(10.3f)
    val floatDataError = FloatData(10.1f)

    // when
    val intForm = form[IntData](f => List(f.field(_.f1).validate(gt(10))))
    val longForm = form[LongData](f => List(f.field(_.f1).validate(gt(10L))))
    val doubleForm = form[DoubleData](f => List(f.field(_.f1).validate(gt(10.2d))))
    val floatForm = form[FloatData](f => List(f.field(_.f1).validate(gt(10.2f))))

    // then
    intForm(intDataOk).doValidate().errors.size should be (0)
    intForm(intDataError).doValidate().errors.size should be (1)

    longForm(longDataOk).doValidate().errors.size should be (0)
    longForm(longDataError).doValidate().errors.size should be (1)

    doubleForm(doubleDataOk).doValidate().errors.size should be (0)
    doubleForm(doubleDataError).doValidate().errors.size should be (1)

    floatForm(floatDataOk).doValidate().errors.size should be (0)
    floatForm(floatDataError).doValidate().errors.size should be (1)
  }
}
