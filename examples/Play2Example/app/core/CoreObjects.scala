package org.demo.core

import java.util.UUID

trait WithPrimaryKey {
  def id: Option[Int]
}

case class PK(id:UUID) {
  override def toString = id.toString
  def ===(pk:Option[PK]):Boolean = pk match {
    case Some(cid) => id.compareTo(cid.id) == 0
    case _ => false
  }
}

object PK {
  def apply(uid:String):PK = new PK(UUID.fromString(uid))
  def generate = new PK(UUID.randomUUID())
  def asFormPK(pk:Option[String]) = pk.getOrElse(PK.generate.toString)
  def equalTo(first:Option[PK], second:Option[PK]) = if ((first.isDefined) && (second.isDefined)) {first.get.===(second)} else false
}

case class Email(value:String) {
  override def toString = value
}

object Email {
  implicit def stringToEmail(email:String) = Email(value = email)
}

case class Mobile(value:String)

object Mobile {
  implicit def stringToMobile(mobile:String) = Mobile(value = mobile)
}

case class PersonName(firstName:String, lastName:String)




