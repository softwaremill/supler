Frontend: Options reference
===========================

Here's a summary of all options that can be used when defining a Supler form.

.. code-block:: javascript

  new Supler.Form(container, {
    send_form_function: doAjax, // [1]
    i18n: { // [2]
      error_custom_someDescription: 'You cannot do that!',
      error_custom_complex: function(parameter) { return parameter + ' is a bad choice'; }
    },
    field_options: {
      'secretField': {
        render_hint: 'password' // [3]
      },
      'friends[].bio': {
        render_options: {
          renderLabel: function(forId, label) { return '<div>some html</div>'; } // [4]
        }
        read_value: function(element) { return ... } // [5]
      },
      'render_hint:radio': {

      }
    },
    after_render_function: enrichForm, // [6]
    custom_data_handler: displayCustomData, // [7]
    validators: {
      good_value: function(json) { return (fieldValue) => { return "error"; } }
    },
    render_options: new Bootstrap3RenderOptions(), // or any subset of methods from RenderOptions
    field_templates: [ 'idOfElementWithTemplates1', 'idOfElementWithTemplates2' ] // [8]
  });

When specifying field options and dealing with lists of subforms, options for nested fields can be defined using the
``subformField[].fieldName`` syntax (``[]`` means every subform in subforms list). If you want to specify options
for single subforms and fields, you can use indexes such as ``subformField[2].fieldName``.

Options details:

* [1] :ref:`refreshes`
* [2] :ref:`i18n`
* [3] :ref:`customizingrender_renderhints`
* [4] :ref:`customizingrender_fieldoptions_javascript`
* [5] :ref:`complexjson`
* [6] :ref:`afterrender`
* [7] :ref:`customdatahandler`
* [8] :ref:`customizingrender_templates`