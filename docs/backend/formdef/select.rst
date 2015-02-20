Form definition: Select fields
==============================

Very often a field can take a value from a restricted range of values. In such cases you can use select fields. You
need to provide a function which, optionally depending on the backing object, returns a list of possible values.

Unlike normal fields, select fields don't require a full transformer which allows the value to be serialized to JSON
and back. It is sufficient to provide a label-for-value generating function. When applying, values are looked up on the
possible values list basing on the selected index.

Select one field
----------------

If only one value can be selected, the possible values function should return a ``List[U]``, while the field value
should be a single ``U`` or an ``Option[U]``.

For example::

  case class CarMake(name: String)
  case class Car(make: CarMake, year: Int)
  
  val carForm = form[Car](f => List(
    f.selectOneField(_.make)(_.name)
      .possibleValues(c => List(CarMake("Ford"), CarMake("Toyota"), CarMake("KIA")))
      .label("Make"),
    f.field(_.year).label("Year")
  ))

Here ``_.name`` is the function that generates ``String`` labels for a value.

By default select-one fields are rendered as a dropdown. They can be also rendered as radio buttons.

Select many field
-----------------

If multiple values can be selected, the possible values function should return a ``List[U]``, while the field value
should be a ``Set[U]`` (there's no ordering)::

  case class Person(name: String, favoriteColors: Set[String])

  val personForm = form[Person](f => List(
    f.field(_.name).label("Name"),
    f.selectManyField(_.favoriteColors, identity)
      .possibleValues(_ => Set("red", "green", "blue", "black"))
      .label("Favorite colors")
  ))

Note that here the label is the same as the value (``identity`` is the label-for-value function).

Select-many fields are rendered as checkboxes.