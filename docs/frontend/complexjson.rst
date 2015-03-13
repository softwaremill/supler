.. _complexjson:

Frontend: Handling fields serialized to json objects
====================================================

If a field is serialized to a JSON object (not a basic type, such as a string, number or boolean), we will need to add
custom code to display the field and read its value. To see how to (de)serialize fields to JSON objects on the backend,
see :ref:`the documentation on type transformers<transform_jsonobject>`.

For example, if the field is serialized to an object with two fields: ``x`` and ``y`` (a point), we need to provide
a method which renders two inputs instead of one, and which reads value from those two inputs and creates an object.

We can do both of these things by providing field options. If the name of the field is ``pointField``:

.. code-block:: javascript

  var sf = new Supler.Form(container, {
    field_options: {
      pointField: {
        render_options: {
          renderHtmlInput: function (inputType, value, options) {
            return Supler.HtmlUtil.renderTag('span', options,
              Supler.HtmlUtil.renderTag('input',
                { class: 'x-coord', type: 'number', value: value.x }) +
              Supler.HtmlUtil.renderTag('input',
                { class: 'y-coord', type: 'number', value: value.y })
            );
          }
        },
        read_value: function(element) {
          return {
            x: parseInt($('.x-coord', element).val()),
            y: parseInt($('.y-coord', element).val())
          }
        }
      }
    }
  });

To properly display the field, we override the ``renderHtmlInput`` method of the render options that will be used
for rendering the field. In the method, we create a container element which has all the supler-specific attributes
(passed as ``options``). These attributes will be used to identify elements from which field values can be later
read.

We are using the ``Supler.HtmlUtil.renderTag`` helper method, which simply renders a tak with the given attributes
and body. The body are two inputs: one for the ``x``, and one for the ``y`` coordinate.

Secondly, we provide a custom field-value reading method, by specifying the ``read_value`` field option. This option
takes an element, from which the value should be read (here, this will be the rendered ``span``). The return value
should be the json object, which will be then passed to the backend.