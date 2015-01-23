Frontend: Rendering the form
============================

At the minimum, you need a designated container on your page, where the form will be rendered, and when
the form JSON is available, create a new ``SuplerForm``:

.. code-block:: html
 
  <div>
    <div id="form-container"></div>
    <a href="#" class="btn btn-primary btn-lg" id="submit" role="button">Submit</a>
    <p id="feedback"></p>
  </div>

.. code-block:: javascript
 
  var formContainer = document.getElementById('form-container');
  var form = new SuplerForm(formContainer, {});
  form.render(formJson); // formJson is received from the server

If the JSON received from the server contains validation errors, they will be displayed as well.