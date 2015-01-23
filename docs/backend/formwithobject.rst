.. _formwithobject:

Backend: form with object
=========================

By applying an object to a form definition, we get a ``FormWithObject[T]`` instance which contains a number of
operations, allowing to generate a JSON form description, apply new values to the object and validate the current
state.

Applying values and validating
------------------------------

After receiving a JSON representing an updated state, the form can be used to apply the values
to an object::

  personForm(person).applyValuesFromJSON(receivedJson)

This can then be chained with validation, or validation can be run on any object::

  personForm(person).doValidate()

  // chained:
  personForm(person).applyValuesFromJSON(receivedJson).doValidate()

The resulting type of each method is a ``FormWithObject[Person]``, which contains potential conversion/validation
errors and the current state of the object.

When validating, there is a special mode which runs the validations only for fields with filled-in values, not to show
the user validation errors for fields which haven't been yet edited at all: ``doValidate(ValidateFilled)``. This is
useful when validating partially-filled forms, and is also what ``process`` (described below) does when no action is
invoked.

Serializing a form to JSON
--------------------------

At any stage it is possible to convert the current state to JSON. In most cases the JSON will contain the form
representation. If an action was run which results in custom JSON only, the result will contain only that data.

The JSON form representation contains both the form structure and the form values. It is a custom format, however it's
very easy to understand, and self-explanatory; the fields in the JSON correspond closely to the DSL-based definition.
In case there were validation or conversion errors, they will be included as well.

To generate the JSON representation, simply call the ``generateJSON`` method::

  val personFormJson = personForm(person).generateJSON

The resulting JSON can be then sent to the client. Supler uses the Scala-standard
`json4s <https://github.com/json4s/json4s>`_ to generate the JSON.

Processing JSON
---------------

The ``FormWithObject.process(JValue)`` method was already described in the :ref:`introduction <first>`, so just a short
recap; process:

* converts and applies values from the given json to the backing object
* runs validations (if no action, only for filled fields, otherwise for the scope specified by the action)
* if there are no errors, runs the actions (if any)

This represents the most common flow when working with Supler. The result of ``process`` is a ``SuplerData`` instance,
which can either be a ``FormWithObject`` or, if a custom-data-only action was run, ``CustomDataOnly``.