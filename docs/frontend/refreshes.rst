Frontend: Updating the form basing on server-side form changes
==============================================================

The form can be automatically updated after each field edit (value change), and when actions are performed. To do that, two things are necessary. First, a ``send_form_function`` option must be specified. This should be a javascript function, accepting form representation (as a JS object) and callbacks for handling response and errors, to be called when the backend responds with an updated form representation or if the request fails. For example, when using JQuery, this can be:

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

Secondly, we need to provide a server-side endpoint which will refresh the form with the given values, validate and generate back the response. When validating, there is a special mode which runs the validations only for fields with filled-in values, not to show the user validation errors for fields which haven't been yet edited at all. This can be done with the convenience ``personForm(person).process(receivedJson)`` method. This invokes apply, validate, run action and generate JSON in succession.

Concurrent sends are handled as well. Only the results of the last send triggered by value changes will be taken into account. Only one action can be in progress at a time (hence errors must be reported using ``sendErrorFn``). It could be a good idea to block the UI while an action is executing, so that no form changes are made during action execution (which would be lost). The ``isAction`` flag can be used to achieve that (there is usually no need to block the UI for value-change refreshes).