Form definition: Basics
=======================

You can use any object and class as the backing object for a Supler form. The fields of the class which are editable
in the form must be either ``var``s, provide a Scala-style getter/setter, or immutable ``val``s in a ``case class``.
We recommend the latter, immutable approach.

A form consists of a list of fields belonging to a single class. Supler provides a convenience method, ``form``, which
captures the class of the object once, and can be used to quickly build forms. Here we are defining a form with three
fields::

  case class Person(firstName: String, lastName: String, age: Int)
  
  val personForm = form[Person](f => List(
    f.field(_.firstName),
    f.field(_.lastName),
    f.field(_.age)
  ))

The fields can be further customized. Almost always you'll want to specify the label of a field::

  f.field(_.firstName).label("First name")

The label can also be a key which will be looked up in the :ref:`i18n <i18n>` component on the frontend.

Stand-alone fields
------------------

Fields can be created without a form, and later used to compose other forms. This may help to centralize the definition
of some common fields. For example::

  case class Person(name: String, age: Int)
  
  val nameField = field[Person, String](_.name).label("Name")
  val ageField = field[Person, Int](_.age).label("Age").validate(gt(0), le(120))
  
  val personForm = form(_ => List(nameField, ageField))

Fields are immutable and can be freely re-used multiple times; e.g. adding a new validator, or changing the label,
creates a new field instance.