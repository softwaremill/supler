Form definition: Collection-valued fields
=========================================

Multi-valued fields of basic types are also supported.
Currently this is limited to sets, and rendered as checkboxes::

  case class Person(name: String, favoriteColors: Set[String])
  
  val personForm = form[Person](f => List(
    f.field(_.name).label("Name"),
    f.setField(_.favoriteColors).label("Favorite colors").possibleValues(_ => Set("red", "green", "blue", "black"))
  ))
