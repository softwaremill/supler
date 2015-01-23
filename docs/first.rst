.. _first:

Your first Supler form
======================

.. raw:: html
   :file: first.html

Server-side
-----------

Let's say we have the following class on the backend::

  case class Person(name: String, age: Int, address: Option[String], likesChocolate: Boolean)

A form backed by instances of the ``Person`` class for editing a user's details can then have the following definition::

  import org.supler.Supler._
  
  val personForm = form[Person](f => List(
    f.field(_.name).label("Name"),
    f.field(_.age).label("Age").validate(gt(1), le(150)),
    f.field(_.address).label("Address"),
    f.field(_.likesChocolate).label("Do you like chocolate?"),
    f.action("save") { p => 
      println("Saving person: " + p)
      ActionResult.custom(JString("Saved")) 
    }.label("Save").validateAll()
  ))

As you can see, a form contains a list of fields. Here we are using a convenience function, ``form``, to capture the
class of the object once, so that we can later specify the fields using closures like: ``_.fieldName``, without any
type annotations.

Each field can be customized. For example, here every field has a label. Also, the ``age`` field has two validators:
age must be > 1 and <= 150 (we are optimistic about the development of education and medicine). All fields which are
not wrapped in an ``Option`` have also a "required" validation added.

Finally, besides the four fields, we have an action, which - as the label probably reveals - is supposed to save the
form. Here we just print the object to the console. How you handle actions, and how you actually "save" objects is up
to you, all you need to do is provide a closure accepting the modified data. We also specify that to invoke the action,
the whole form must be valid (using ``validateAll()``).

The result of the save action is a custom JSON. Supler uses `json4s <http://json4s.org>`_ for parsing & creating JSON
with the native backend; in fact, it is the only dependency of Supler. The custom JSON in this case is just a string
message, "Saved" (presumably to be displayed to the user on the frontend).

Having the form defined, we need to expose it to the world, which is typically done using some web or REST framework.
You can use `servlets with JAX-RS <https://jax-rs-spec.java.net>`_, `Spray <http://spray.io>`_,
`Play <https://www.playframework.com>`_, `Scalatra <http://www.scalatra.org>`_, or any custom framework you want.
To keep the tutorial simple, let's assume we have two methods mapped to appropriate paths & http methods:

* ``getPersonForm(): JValue``, invoked on a ``GET /personform``
* ``postPersonForm(body: JValue): JValue``, invoked on a ``POST /personform`` with the body parsed as JSON

The implementation of get is quite straightforward::

  def getPersonForm(): JValue = {
    val person = lookupCurrentPerson()
    personForm(person).generateJSON
  }

Again, where do the specific ``Person`` instances come from, do they come from the session, or if they are looked up
basing on HTTP parameters, is outside the scope of Supler.

Once we have a ``Person`` instance, we apply it to the form (``personForm(person)``), and generate the JSON description
of the form, reading field values from the given object.

The post method is similarly simple::

  def postPersonForm(body: JValue): JValue = {
    val person = lookupCurrentPerson()
    personForm(person).process(body).generateJSON
  }

What ``process`` does is:

* convert and apply values from the given json to the person object
* run validations
* if there are no errors, run the actions (if any)

If no action is invoked (``body`` has only field value mappings), this method can be used for doing server-side
validation of a form; the result will contain any validation errors, which can be the displayed to the user. In our
example, if the ``"save"`` action was invoked and the data was valid, the result of ``process(body).generateJSON``
would be the action's result: ``JString("Saved")``.

You can also invoke any of the processing steps by hand; this is covered later in the docs.

Frontend
--------

Time to display something! First we need a designated space on our HTML page where the form will be displayed:

.. code-block:: html

  <html>
  <head>
    <script src="/supler.js"></script>
  </head>
  <body>
    <div id="person_form_container"></div>
  </body>
  </html>

Then, when the page opens, we need to fetch and display the form. I will use `JQuery <http://jquery.com>`_ here, but
of course any way of doing AJAX calls/networking will work, JQuery is not a dependency of Supler:

.. code-block:: javascript

  var form = new SuplerForm(
    document.getElementById('person_form_container', {})
  );
  
  $(document).ready(function() {
    $.get('/personform', function(data) {
      form.render(data);
    });
  });

Here we are creating a ``SuplerForm`` instance which as the first arguments requires the HTML element where the form
should be rendered, and as the second options, which we'll be using shortly. Then, when the document is ready, we are
calling the endpoint to get the JSON form description, and we render the results. This will display a 4-field &
1-button form to the user.

What about sending user changes, when the "Save" button is clicked? Well, we need to provide a way to send data back
to the backend. This is configured via the ``send_form_function`` option:

.. code-block:: javascript

  var form = new SuplerForm(
    document.getElementById('person_form_container', {
      send_form_function: sendForm
    })
  );
  
  function sendForm(formValue, renderResponseFn, sendErrorFn) {
    $.ajax({
      url: '/personform',
      type: 'POST',
      data: JSON.stringify(formValue),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      success: renderResponseFn,
      error: sendErrorFn
    });
  };

This is a fairly standard JQuery AJAX call. What is important, is that we are POSTing the form value (received as a
parameter) serialized as JSON to the backend, and for handling responses we are using the provided ``renderResponseFn``
which will re-render the form if there are conversion/validation errors.

After a field is edited, and before an action is invoked, client-side validations are run. If they fail, a message is
displayed to the user. Of course, validations are also run on the server, before actually running the action code.

Not all validations are both client- and server-side. Most of the built-in are, but you can also provide custom
validations, which are server-side only, or which perform a simplified client-side validation.

Finally, what if an action returns a custom JSON? This must be handled somehow as well. We need to provide a method
which will handle such responses:

.. code-block:: javascript 

  var form = new SuplerForm(
    document.getElementById('person_form_container', {
      send_form_function: sendForm,
      custom_data_handler: function(data) {
        $("#user_feedback").html(data);
      },
    })
  );

And that's it! Like on the server-side, you can call any of the stages (serializing a form to JSON, validating,
re-rendering with new data) by hand; this will also be covered later in the docs.

What's next?
------------

The various Supler components are described in more detail in further sections. If you'd like to add Supler to your
project, head over to :ref:`setup <setup>`. If you have any questions, feel free to ask on the
`forum <https://groups.google.com/forum/#!forum/supler>`_.