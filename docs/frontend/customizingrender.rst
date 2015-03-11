.. _customizingrender:

Frontend: Customizing the rendering process
===========================================

The rendering process is fully customizable. By default, `Bootstrap <http://getbootstrap.com/>`_-based HTML is rendered,
but this can be changed either by providing HTML templates, or by overriding any of the rendering functions using the
options.

.. _customizingrender_renderhints:

Defining render hints on the frontend
-------------------------------------

Render hints can be specified per-field and influence how a field is rendered. All of the render hints supported by
default can be defined on the :ref:`backend <renderhints>`, but it is also possible to define them on the frontend.

This can be done through the the ``field_options`` option passed when creating a form:

.. code-block:: javascript

  new Supler.Form(container, {
    field_options: {
      'secretField': {
        'render_hint': 'password'
      },
      'friends[].bio': {
        'render_hint': {
          'name': 'textarea',
          'rows': 10,
          'cols': 20
        }
      }
    }
  });

A render hint can be just a name (string), or an object with a ``name`` property and additional parameters (like
the textarea example).

.. _customizingrender_templates:

Customizing via HTML templates
------------------------------

The generated HTML can be customized by providing templates, which will be used during the rendering process. By default
Supler looks for templates nested inside the element that will contain the form. For example:

.. code-block:: html
 
  <div id="form-container">
    <div supler:fieldTemplate supler:fieldPath="lastName">
      <div class="formGroup">
        <i>{{suplerLabel}} <span style="font-size: xx-small">(extra information)</span></i>
        {{suplerInput}}
        {{suplerValidation}}
      </div>
    </div>
  </div>

If the templates are defined somewhere else, you can provide additional ids of the elements from which templates
should be read by defining the ``field_templates`` option:

.. code-block:: javascript

  new Supler.Form(container, {
    field_templates: [ 'idOfElementWithTemplates1', 'idOfElementWithTemplates2' ]
  });

The templates are stacked top-to-bottom, that is the templates that are defined higher will take precedence, if
multiple templates match a given field.

Matching templates to fields
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The templates are applied to all matching fields. The matchers should be specified as attributes of the template.
Currently the following matchers are allowed:

* ``supler:fieldPath="..."`` where field path can be e.g. ``cars.model.name``
* ``supler:fieldType="..."`` where type can be e.g. ``string``, ``integer``, ``double``, ``static`` etc.
* ``supler:fieldRenderHint="..."`` where the render hint can be e.g. ``textarea``, ``password``, ``radio`` etc.

That way templates for a specific field or field type can be specified.

Types of templates
^^^^^^^^^^^^^^^^^^

* re-define the template for rendering fields

.. code-block:: html
 
  <div id="form-container">
    <div supler:fieldTemplate>
      // html with placeholders:
      // {{suplerLabel}}
      // {{suplerInput}}
      // {{suplerValidation}}
    </div>
  </div>

* re-define how labels are rendered

.. code-block:: html
 
  <div id="form-container">
    <div supler:fieldLabelTemplate>
      // html with placeholders:
      // {{suplerLabelForId}}
      // {{suplerLabelText}}
    </div>
  </div>

* re-define how validations are rendered

.. code-block:: html
 
  <div id="form-container">
    <div supler:fieldValidationTemplate>
      // html with placeholders:
      // {{suplerValidationId}}
    </div>
  </div>

* re-define how a field's input without possible values is rendered

.. code-block:: html
 
  <div id="form-container">
    <div supler:fieldInputTemplate>
      // html with placeholders:
      // {{suplerFieldInputAttrs}}
      // {{suplerFieldInputValue}}
    </div>
  </div>

This should always be combined with a filter to make sense. The attributes will contain normal attributes such
as ``id``, ``name``, as well as supler-specific meta-data. If ``{{suplerFieldInputValue}}`` is used,
the attributes won't include the field value (useful e.g. for textarea fields). Otherwise the attributes will
contain the value mapping.

* re-define how a field's input with possible values is rendered

.. code-block:: html
 
  <div id="form-container">
    <div supler:fieldInputTemplate supler:singleInput="true|false" supler:selectedAttrName="selected" supler:selectedAttrValue="selected">
      // html with placeholders:
      // {{suplerFieldInputContainerAttrs}}
      // must contain an element with the "supler:possibleValueTemplate" attribute;
      // that element will be repeated for each possible value. Placeholders:
      // {{suplerFieldInputAttrs}}, {{suplerFieldInputValue}}, {{suplerFieldInputLabel}}
    </div>
  </div>

To properly render a field with possible values, Supler needs to know if the element is rendered as a single input
(e.g. drop-down) or multiple inputs (e.g. radio/checkboxes).

Also, if an element is already selected, it must have an additional attribute, which will be added to the possible
value template. The attribute name & value are specified using ``supler:selectedAttrName`` and
``supler:selectedAttrValue``.

Not yet implemented
^^^^^^^^^^^^^^^^^^^

* re-define how a field overall is given (without separating into label/input/validation)

.. code-block:: html
 
  <div id="form-container">
    <div supler:fieldFlatTemplate>
      // html with placeholders:
      // {{suplerFieldInputAttrs}}
      // {{suplerFieldLabelForId}}
      // {{suplerFieldLabelText}}
      // {{suplerFieldValidationId}}
    </div>
  </div>

* re-define how a subform is rendered

.. code-block:: html
 
  <div id="form-container">
    <div supler:subformDecorationTemplate>
      // html with placeholders:
      // {{suplerSubformLabel}}
      // {{suplerSubform}}
      // {{suplerSubformContainerAttrs}}
    </div>
  </div>

* re-define how a subform element is rendered (as-list rendering)

.. code-block:: html
 
  <div id="form-container">
    <div supler:subformListElementTemplate>
      // html with placeholders:
      // {{suplerSubformElement}}
      // {{suplerSubformElementContainerAttrs}}
    </div>
  </div>

* re-define how a subform element is rendered (as-table rendering)

.. code-block:: html

  <div id="form-container">
    <div supler:subformTableTemplate>
      // html with placeholders:
      // {{suplerSubformTableHeaders}}
      // {{suplerSubformTableCells}}
    </div>
  </div>

The table headers are a series of ``<tr><th>`` tags.
The table cells are a series of ``<tr><td></td><td></td>..></tr>...`` tags.

* re-define the order of fields
 
.. code-block:: html

  <div id="form-container" supler:fieldOrder="x, y, z">
  </div>

.. _customizingrender_fieldoptions_javascript:

Customizing via local javascript options
----------------------------------------

Rendering can also be customized by providing customizations using javascript instead of HTML templates. You can
override any of the methods available on ``RenderOptions`` (see below for a complete list) using field options:

.. code-block:: javascript

  new Supler.Form(container, {
    field_options: {
      'bio': {
        'render_options': {
          renderLabel: function(forId, label) { return '<div>some html</div>'; }
        }
      }
    }
  });

It is also possible to match using render hints, instead of field names/paths. You need to prefix the field option name
with ``render_hint:``. For example, to provide custom javascript rendering options for all fields with render hint
``date``:

.. code-block:: javascript

  new Supler.Form(container, {
    field_options: {
      'render_hint:date': {
        'render_options': {
          renderLabel: function(forId, label) { return '<div>this is a date</div>'; }
        }
      }
    }
  });

Customizing via global javascript options
-----------------------------------------

To override how particular types of form elements are rendered globally, simply provide a method in the ``render_options``
option passed to ``Supler.Form``; you can even provide a whole alternative implementation of the ``RenderOptions``
interface:
 
.. code-block:: javascript 

  var formContainer = document.getElementById('form-container');
  var form = new Supler.Form(formContainer, {
    render_options: {
      renderStringField: function(label, id, validationId, name, value, options, compact) {
        return someHtml;
      }
    }
  });
  form.render(formJson); // formJson is received from the server

Methods available for overriding:
 
.. code-block:: javascript 

  // basic types
  renderTextField: (fieldData: FieldData, options: any, compact: boolean): string
  renderHiddenField: (fieldData: FieldData, options: any, compact: boolean): string
  renderTextareaField: (fieldData: FieldData, options: any, compact: boolean): string
  renderMultiChoiceCheckboxField: (fieldData: FieldData, possibleValues: SelectValue[], options: any, compact: boolean): string
  renderMultiChoiceSelectField: (fieldData: FieldData, possibleValues: SelectValue[], options: any, compact: boolean): string
  renderSingleChoiceRadioField: (fieldData: FieldData, possibleValues: SelectValue[], options: any, compact: boolean): string
  renderSingleChoiceSelectField: (fieldData: FieldData, possibleValues: SelectValue[], options: any, compact: boolean): string
  renderActionField: (fieldData: FieldData, options: any, compact: boolean): string
  
  // templates
  // [label] [input] [validation]
  renderField: (input: string, fieldData: FieldData, compact: boolean) => string
  renderLabel: (forId: string, label: string) => string
  renderValidation: (validationId: string) => string

  renderRow: (fields: string) => string

  renderForm: (rows: string) => string

  renderStaticField: (label: string, id: string, validationId: string, value: any, compact: boolean) => string
  renderStaticText: (text: string) => string
  
  renderSubformDecoration: (subform: string, label: string, id: string, name: string) => string
  renderSubformListElement: (subformElement: string, options: any) => string;
  renderSubformTable: (tableHeaders: string[], cells: string[][], elementOptions: any) => string;
  
  // html form elements
  renderHtmlInput: (inputType: string, value: any, options: any) => string
  renderHtmlSelect: (value: number, possibleValues: SelectValue[], options: any) => string
  renderHtmlRadios: (value: any, possibleValues: SelectValue[], options: any) => string
  renderHtmlCheckboxes: (value: any, possibleValues: SelectValue[], options: any) => string
  renderHtmlTextarea: (value: string, options: any) => string
  
  // misc
  additionalFieldOptions: () => any
  inputTypeFor: (fieldData:FieldData) => string
