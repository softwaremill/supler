Frontend: Rendering the form
============================

Form container
--------------

At the minimum, you need a designated container on your page, where the form will be rendered, and when
the form JSON is available, create a new ``Supler.Form``:

.. code-block:: html
 
  <div>
    <div id="form-container"></div>
    <a href="#" class="btn btn-primary btn-lg" id="submit" role="button">Submit</a>
    <p id="feedback"></p>
  </div>

.. code-block:: javascript
 
  var formContainer = document.getElementById('form-container');
  var form = new Supler.Form(formContainer, {});
  form.render(formJson); // formJson is received from the server

If the JSON received from the server contains validation errors, they will be displayed as well.

Field order
-----------

You may choose to change the order of fields that comes from the backend. To do so, override ``field_order`` form option.

.. code-block:: javascript

  new Supler.Form(container, {
    field_order: [
        ['firstName', 'lastName'],
        ['address'],
        ['street', 'streetNo', 'apptNo'],
        ['postcode', 'city', 'country']
    ]
  });

The ``field_order`` field should be a two-dimensional string array with field names that represents form rows.

Note that if you have fields which have random names (static fields), you will have to name them to be able to reference
them in the field order.