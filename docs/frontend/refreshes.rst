.. _refreshes:

Frontend: Updating the form basing on server-side form changes
==============================================================

The form can be automatically updated after each field edit (value change) and when actions are performed. To do that,
two things are necessary. First, a ``send_form_function`` option must be specified. This should be a javascript
function, accepting form representation (as a JS object) and callbacks for handling response and errors, to be called
when the backend responds with an updated form representation or if the request fails. For example, when using JQuery,
this can be:

.. code-block:: javascript
 
  function sendForm(formValue, renderResponseFn, sendErrorFn, isAction, triggeringElement) {
      $.ajax({
          url: '/refresh_form.json',
          type: 'POST',
          data: JSON.stringify(formValue),
          dataType: 'json',
          contentType: 'application/json; charset=utf-8',
          success: renderResponseFn,
          error: sendErrorFn
      });
  }

  var form = new SuplerForm(formContainer, {
    send_form_function: sendForm,
    // other options
  });

Secondly, we need to provide a server-side endpoint which will refresh the form with the given values, validate and
generate back the response (the server can use the :ref:`process <formwithobject>` method, or any other way of
processing the data).

Concurrent sends are handled as well. Only the results of the last send triggered by value changes will be taken into
account. Only one action can be in progress at a time (hence errors must be reported using ``sendErrorFn`` to allow
subsequent actions to execute after a failed one). It could be a good idea to block the UI while an action is executing,
so that no form changes are made during action execution (which would be lost). The ``isAction`` flag can be used to
determine, if the callback is triggered by an action (there is usually no need to block the UI for value-change
refreshes).