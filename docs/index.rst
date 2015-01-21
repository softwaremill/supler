What is Supler?
===============

Supler is a library which makes writing complex forms easier. It has a server-side (Scala) and a client-side (JavaScript) component.

On the server side Supler provides:

* a DSL for defining forms
* generating a JSON description of a form, reading values from a data object
* applying JSON, writing to a data object
* running server-side conversions and validations
* running server-side actions

On the frontend side Supler provides:

* generating HTML basing on JSON form description
* serializing a (possibly modified) form to JSON
* running client-side validations
* customization of the HTML generation process
* automatically refreshing the form after a field is changed or an action invoked

As important as Supler's features, are things that Supler **does not** do. Supler does not define or mandate how the objects backing the forms should work, how are they persisted, what is their lifecycle; it is agnostic as to which Javascript/web framework you use or how HTTP sessions are managed. The generated HTML has elements with predictable names and can be easily customized.

Your first Supler form
======================

Server-side
-----------

Let's say we have the following class on the backend::

  case class Person(name: String, age: Int, address: Option[String], likesChocolate: Boolean)

A form definition for the user's details may then be::

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

As you can see, a form contains a list of fields. Here we are using a convenience function, ``form``, to capture the class of the object once, so that we can later specify the fields using ``_.fieldName``.

Each field can be customized. For example, here every field has a label. Also, the ``age`` field has two validators: age must be > 1 and <= 150 (we are optimistic about the development of education and medicine). All fields which are not wrapped in an ``Option`` have also a "required" validation added.

Finally, besides the four fields, we have an action, which - as the label probably reveals - is supposed to save the form. Here we just print the object to the console. How you handle actions, and you actually "save" object is up to you, all you need to do is provide a closure accepting the modified data. We also specify that to invoke the action, the whole form must be valid.

The result of the save action is a custom JSON. Supler uses `json4s <http://json4s.org>`_ for JSON with the native backend; in fact, it is the only dependency of Supler. The custom JSON in this case is just a string message, "Saved" (presumably to be displayed to the user).

Having the form defined, we need to expose it to the world, most probably using some web or REST framework. You can use `servlets with JAX-RS <https://jax-rs-spec.java.net>`_, `Spray <http://spray.io>`_, `Play <https://www.playframework.com>`_, `Scalatra <http://www.scalatra.org>`_, or any custom framework you want. To keep the tutorial simple, let's assume we have two methods mapped to appropriate paths & http methods:

* ``getPersonForm(): JValue``, invoked on a ``GET /personform``
* ``postPersonForm(body: JValue): JValue``, invoked on a ``POST /personform`` with the body parsed as JSON

The implementation of get is quite straighforward::

  def getPersonForm(): JValue = {
    val person = lookupCurrentPerson()
    personForm(person).generateJSON
  }

Again, where do the specific ``Person`` instances come from, do they come from the session, or if they are looked up basing on HTP parameters, is outside the scope of Supler.

Once we have a ``Person`` instance, we apply it to the form (``personForm(person)``), and generate the description of the form, reading values from the given object.

The post method is similarly simple::

  def postPersonForm(body: JValue): JValue = {
    val person = lookupCurrentPerson()
    personForm(person).process(body).generateJSON
  }

What ``process`` does is:

* convert and apply values from the given json to the person object
* run validations
* if there are no errors, run the actions (if any)

If no action is invoked, this method can be used for doing server-side validation of a form; the result will contain any validation errors, which can be the displayed to the user. In our example, if the ``"save"`` action was invoked and the data was valid, the result of ``process(body).generateJSON`` would be the action's result: ``JString("Saved")``.

You can also invoke any of the processing steps by hand; this is covered later in the docs.

Frontend
--------

Time to display something! First we need a designated space on our HTML page where the form will be displayed:

.. code-block:: html

  <html>
  <head>...</head>
  <body>
    <div id="person_form_container"></div>
  </body>
  </html>

Then, when the page opens, we need to fetch and display the form. I will use [JQuery]() here, but of course any way of doing AJAX calls/networking will work, you don't need to use JQuery:

.. code-block:: javascript

  var form = new SuplerForm(
    document.getElementById('person_form_container', {})
  );
  
  $(document).ready(function() {
    $.get('/personform', function(data) {
      form.render(data);
    });
  });

Here we are creating a ``SuplerForm`` instance which as the first arguments requires the HTML element where the form should be rendered, and as the second options, which we'll be using shortly. Then, when the document is ready, we are calling the endpoint to get the JSON form description, and we render the results. This will display a 4-field & 1-button form to the user.

What about sending user changes, when the "Save" button is clicked? Well, we need to provide a way to send data back to the backend. This is done via the ``send_form_function`` option:

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

This is a fairly standard JQuery AJAX call. What is important, is that we are POSTing the form value (received as a parameter) serialized as JSON to the backend, and for handling responses we are using the provided ``renderResponseFn`` which will re-render the form if there are conversion/validation errors.

After a field is edited, and before an action is invoked, client-side validations are run. If they fail, a message is displayed to the user. Of course, validations are also run on the server, before actually running the action code.

Not all validations are both client- and server-side. Most of the built-in are, but you can also provide custom validations, which are server-side only, or which perform a simplified client-side validation. 

Finally, what if an action returns a custom JSON? This must be handled somehow as well. We need to provide a method which will handle such responses:

.. code-block:: javascript 

  var form = new SuplerForm(
    document.getElementById('person_form_container', {
      send_form_function: sendForm,
      custom_data_handler: function(data) {
        $("#user_feedback").html(data);
      },
    })
  );

And that's it! Like on the server-side, you can call any of the stages (serializing a form to JSON, validating, re-rendering with new data) by hand; this will also be covered later in the docs.

Setup
=====

As Supler has two parts, they are deployed in different repositories. The backend can be found in `Sonatype’s OSS repository <https://oss.sonatype.org/content/repositories/releases/com/softwaremill/supler_2.11/>`_, and if you have e.g. an SBT build you just need to add::

  libraryDependencies += "com.softwaremill" %% "supler" % "0.1.0"

The frontend is deployed to `Bower <http://bower.io/search/?q=supler>`_, and you can install it simply using ``bower install supler``. Or you can just grab ``supler.js`` directly from the
`GitHub tag <https://github.com/softwaremill/supler/blob/0.1.0/supler.js>`_.

Complete documentation
======================

.. toctree::
   :maxdepth: 2

   backend/formdef/basics
   backend/formdef/subforms
   backend/formdef/validation
   backend/formdef/possiblevalues
   backend/formdef/typetransformations
   backend/formdef/collections
   backend/formdef/static
   backend/formdef/actions
   backend/formdef/renderhints
   backend/serializing
   backend/applying
   frontend/rendering
   frontend/clientsideval
   frontend/serializing
   frontend/customizingrender
   frontend/i18n
   frontend/refreshes
   frontend/custombehavior
   frontend/customdata