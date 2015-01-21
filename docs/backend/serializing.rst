Backend: Serializing a form to JSON
===================================

To generate a JSON representation of a form, simply call its ``generateJSON`` method, passing in an object, basing on which a form will be generated::

  val personFormJson = personForm(person).generateJSON

The resulting JSON can be then sent to the client. Supler uses the Scala-standard `json4s <https://github.com/json4s/json4s>`_ to generate the JSON.

The JSON contains both the form structure and the form values. It is a custom format, however it's very easy to understand, and self-explanatory; the fields in the JSON correspond closely to the DSL-based definition.
