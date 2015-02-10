Form definition: Subforms
=========================

Fields can also have "complex" types and correspond to other forms. Already defined forms can be freely re-used
multiple times (forms are immutable). Currently single-valued subforms, optional subforms, and `List`s/`Vector`s of
subforms are supported. For example::

  case class Car(make: String, year: Int)
  case class Person(name: String, cars: List[Var])
  
  val carForm = ...
  
  val personForm = form[Person](f => List(
    f.field(_.name).label("Name"),
    f.subform(_.cars, carForm).label("Cars")
  ))

By default subforms are rendered as a list. You can also render subforms as a table, see the section on
:ref:`render hints <renderhints>`.