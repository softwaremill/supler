Form definition: Basics
=======================

You can use any object and class as the backing object for a Supler form. The fields of the class which are editable
in the form must be either ``var``-s, provide a Scala-style getter/setter, or immutable ``val``-s in a ``case class``.
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

.. note::
  An (editable) field can be used on a form only once.

The fields can be further customized. Almost always you'll want to specify the label of a field::

  f.field(_.firstName).label("First name")

The label can also be a key which will be looked up in the :ref:`i18n <i18n>` component on the frontend.

.. note::

  All Supler objects (fields, forms, ...) are immutable and can be freely re-used (or shared between threads). Adding a
  new validator to a field, changing the label, adding fields to forms creates new field/forms instances.

Stand-alone fields
------------------

Fields can be created without a form, and later used to compose other forms. This may help to centralize the definition
of some common fields. For example::

  case class Person(name: String, age: Int)
  
  val nameField = field[Person, String](_.name).label("Name")
  val ageField = field[Person, Int](_.age).label("Age").validate(gt(0), le(120))
  
  val personForm = form(_ => List(nameField, ageField))


Multiple fields in rows
-----------------------

If you would like to have your fields rendered one text to the other as opposed to a horizontal list, you can use the ``||``
operator::

  case class Person(firstName: String, lastName: String, age: Int)

  val personForm = form[Person](f => List(
    f.field(_.firstName) || f.field(_.lastName),
    f.field(_.age)
  ))

the above example will render first name and last name in the first row and the age in second.

.. note::

  The default twitter-bootstrap based frontend implementation is constrained for a maximum of 12 fields in a row. You can
  specify more, but the extra fields will be always wrapped in a new row.