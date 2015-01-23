Frontend: Handling custom data
==============================

Actions can result in custom data being returned by the server. Custom data can come either together with a form, or
without. There are two ways to handle custom data. First, you can specify the ``custom_data_handler`` option, which
should be a function accepting the data object. The function will be invoked after rendering the form
with ``render`` (or calling the ``renderResponseFn``):

.. code-block:: javascript

  function handleData(data) {
      $('#messages').html('Server response: ' + data);
  }

  var form = new SuplerForm(formContainer, {
    custom_data_handler: handleData,
    // other options
  });

The second way is to get the custom data by hand, using ``SuplerForm.getCustomData(json)`` (where ``json`` is what you
receive from the server), and if the result is not null, handling it as desired.