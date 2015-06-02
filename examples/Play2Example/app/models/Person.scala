package org.demo

import org.demo.core.types.UserStatus.UserStatus
import org.joda.time.DateTime
import org.demo.core._

//case class Person(name:core.PersonName,
case class Person(firstName:String,lastName:String,
                   email:Email,
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
                   legoSets: List[LegoSet],
                   registrationDate: DateTime,
                   id : String,
                   status:UserStatus,
                   a1: String)

case class Car(
                make: String,
                model: String,
                year: Int
                )

case class LegoSet(
                    name: String,
                    theme: String,
                    number: Int,
                    age: Int
                    )

