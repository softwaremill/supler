Form definition: Subforms
=========================

Fields can also correspond to other forms. Already defined forms can be freely re-used multiple times (forms are immutable). Currently this is limited to a list of sub-objects/sub-forms::

  case class Car(make: String, year: Int)
  case class Person(name: String, cars: List[Var])
  
  val carForm = ...
  
  val personForm = form[Person](f => List(
    f.field(_.name).label("Name"),
    f.subform(_.cars, carForm).label("Cars")
  ))
