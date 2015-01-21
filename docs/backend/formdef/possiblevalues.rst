Form definition: Narrowing possible values
==========================================

Very often a field can take a value from a restricted domain. In that case, it is possible to tell Supler what the possible values for a field are. The values can depend on the object (can be different for each instance of a class)::

  case class Car(make: String, year: Int)
  
  val carForm = form[Car](f => List(
    f.field(_.make).label("Make").possibleValues(c => List("Ford", "Toyota", "KIA", "Lada")),
    f.field(_.year).label("Year")
  ))

If a field specifies the list of possible values, it will be rendered by default as a dropdown.