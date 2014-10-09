package org.supler.demo

import org.joda.time.DateTime
import org.joda.time.format.ISODateTimeFormat
import org.supler.Supler
import Supler._
import org.supler.transformation.StringTransformer
import org.supler.errors.ErrorMessage

object PersonForm {
  val carMakesAndModels = Map(
    "Ford" -> List("Ka", "Focus", "Mondeo", "Transit"),
    "Toyota" -> List("Aygo", "Yaris", "Corolla", "Auris", "Verso", "Avensis", "Rav4"),
    "KIA" -> List("Picanto", "Venga", "cee'd", "sport c'eed", "Carens", "Sportage"),
    "Lada" -> List("Niva")
  )

  val carForm = form[Car](f => List(
    f.field(_.make).possibleValues(_ => carMakesAndModels.keys.toList).label("Make"),
    //f.field(_.model).use(dataProvider(car => carMakesAndModels(car.make))),
    f.field(_.year).validate(gt(1900)).label("Year")
  ))

  val legoSetForm = form[LegoSet](f => List(
    f.field(_.name).label("label_lego_name"),
    f.field(_.theme).label("label_lego_theme").possibleValues(_ => List("City", "Technic", "Duplo", "Space", "Friends", "Universal")),
    f.field(_.number).label("label_lego_setnumber").validate(lt(100000)),
    f.field(_.age).label("label_lego_age").validate(ge(0), le(50))
  ))

  implicit val dateTimeTransformer = new StringTransformer[DateTime] {
    override def serialize(t: DateTime) = ISODateTimeFormat.date().print(t)

    override def deserialize(u: String) = try {
      Right(ISODateTimeFormat.date().parseDateTime(u))
    } catch {
      case e: IllegalArgumentException => Left("error_custom_illegalDateFormat")
    }
  }

  val personForm = form[Person](f => List(
    f.field(_.firstName).label("label_person_firstname"),
    f.field(_.lastName).label("label_person_lastname")
      .validate(custom((e, v) => v.length <= e.firstName.length, (e, v) => ErrorMessage("error_custom_lastNameLongerThanFirstName"))),
    f.field(_.age).label("Age"),
    f.field(_.birthday).label("Birthday"),
    f.field(_.likesBroccoli).label("Likes broccoli"),
    f.field(_.address1).label("Address 1"),
    f.field(_.address2).label("Address 2"),
    f.setField(_.favoriteColors).label("Favorite colors").possibleValues(_ => List("red", "green", "blue", "magenta")),
    f.field(_.gender).label("Gender").possibleValues(_ => List("Male", "Female")).renderHint(asRadio()),
    f.field(_.secret).label("Secret").renderHint(asPassword()),
    f.field(_.bio).label("Biography").renderHint(asTextarea(rows = 6)),
    f.subform(_.cars, carForm, Car(null, 0)).label("Cars").renderHint(asList()),
    f.subform(_.legoSets, legoSetForm, LegoSet(null, null, 0, 0)).label("Lego sets")
  ))
}

case class Person(
  firstName: String,
  lastName: String,
  birthday: DateTime,
  age: Int,
  address1: Option[String],
  address2: Option[String],
  gender: String,
  secret: Option[String],
  bio: Option[String],
  favoriteColors: Set[String],
  likesBroccoli: Boolean,
  cars: List[Car],
  legoSets: List[LegoSet])

case class Car(
  make: String,
  //model: String,
  year: Int
)

case class LegoSet(
  name: String,
  theme: String,
  number: Int,
  age: Int
)