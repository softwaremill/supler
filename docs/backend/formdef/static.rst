Form definition: Label (static) fields
======================================

Fields can also be non-editable and display static content - a label. Note that the value of such fields will **not**
be included when the form is serialized on the frontend, and sent back to the server::

  case class Person(name: String, registrationId: String)
  
  val personForm = form[Person](f => List(
    f.field(_.name).label("Name"),
    f.staticField(_.registrationId).label("Registration id")
  ))

Static fields have random names by default. If you'd like to customize the field order, assign a name to the
static field using the ``name`` method.