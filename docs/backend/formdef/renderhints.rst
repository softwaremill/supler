.. _renderhints:

Form definition: Render hints
=============================

In some cases there are a couple possible renderings of a field. In such case, you can specify a render hint, which
will influence how the field is rendered. It is also possible to specify custom rendering.

For example, to render a text field as a password::

  case class Login(username: String, password: String)
  
  val loginForm = form[Login](f => List(
    f.field(_.username).label("Username"),
    f.field(_.password).label("Password").renderHint(asPassword())
  ))

Supported render hints:

* for subforms: ``asList()`` (default), ``asTable()``
* for text fields: ``asPassword()``, ``asTextarea(rows = 10)``, ``asHidden()``
* for single-select fields: ``asRadio()``, ``asDropdown()``

Custom render hints
-------------------

You can also specify custom render hints which can be used as selectors for field options or for templates, customizing
how fields are displayed. To create a custom render hint, you can use the ``customRenderHint(name)`` method. If the
render hint takes additional data, you can provide any number of JSON fields::

  f.field(_.password).label("Password").renderHint(customRenderHint("blinking", JField("interval", JInt(20))))

