Customizing via options
-----------------------

How the form and each form fragment is rendered can be customized via options.

````javascript
// possible options - general
fieldOrder: ["x", "y", "z"]

// per-type & render-hint entry points
renderStringField: function(label, id, name, value, options) {}
renderIntegerField: function(label, id, name, value, options) {}
renderDoubleField: function(label, id, name, value, options) {}
renderBooleanField: function(label, id, name, value, options) {}
renderPasswordField: function(label, id, name, value, options) {}
renderTextareaField: function(label, id, name, value, options) {}
renderMultiChoiceCheckboxField: function(label, id, name, values, possibleValues, options) {}
renderMultiChoiceSelectField: function(label, id, name, value, options) {}
renderSingleChoiceRadioField: function(label, id, name, value, options) {}
renderSingleChoiceSelectField: function(label, id, name, value, options) {}

// templates
renderField: function(renderInput, label, id) {}
renderLabel: function(forId, label) {}
renderValidation: function() {}
````

Customizing via HTML
--------------------

Rendering can also be customized via HTML. HTML customizations generate options which override any of the default
and provided options.

All of the templates can be narrowed down by using filters:

* `supler:fieldPath="..."` where field path can be e.g. `cars.model.name`
* `supler:fieldType="..."` where type can be e.g. `string`, `integer`, `double`, `static` etc.
* `supler:fieldRenderHint="..."` where the render hint can be e.g. `textarea`, `password`, `radio` etc.

That way templates for a specific field or field type can be specified.

Use-cases:

* re-define the template of rendering fields

````html
<div id="form-container">
  <div supler:fieldTemplate>
    // html with placeholders:
    // {{suplerLabel}}
    // {{suplerInput}}
    // {{suplerValidation}}
  </div>
</div>
````

* re-define how labels are rendered

````html
<div id="form-container">
  <div supler:fieldLabelTemplate>
    // html with placeholders:
    // {{suplerLabelForId}}
    // {{suplerLabelText}}
  </div>
</div>
````

* re-define how validations are rendered

````html
<div id="form-container">
  <div supler:fieldValidationTemplate>
    // html with placeholders:
    // {{suplerValidationId}}
  </div>
</div>
````

* re-define how a field's input without possible values is rendered

````html
<div id="form-container">
  <div supler:fieldInputTemplate>
    // html with placeholders:
    // {{suplerFieldInputAttrs}}
    // {{suplerFieldInputValue}}
  </div>
</div>
````

This should always be combined with a filter to make sense.
The attributes will contain normal attributes such as `id`, `name`, as well as supler-specific meta-data.
If `{{suplerFieldInputValue}}` is used, the attributes won't include the field value (useful e.g. for textarea fields).
Otherwise the attributes will contain the value mapping.

* re-define how a field's input with possible values is rendered

````html
<div id="form-container">
  <div supler:fieldInputTemplate super:singleInput="true|false" supler:selectedAttrName="selected" supler:selectedAttrValue="selected">
    // html with placeholders:
    // {{suplerFieldInputContainerAttrs}}
    // must contain an element with the "supler:possibleValueTemplate" attribute;
    // that element will be repeated for each possible value. Placeholders:
    // {{suplerFieldInputAttrs}}, {{suplerFieldInputValue}}, {{suplerFieldInputLabel}}
  </div>
</div>
````

To properly render a field with possible values, Supler needs to know if the element is rendered as a single
input (e.g. drop-down) or multiple inputs (e.g. radio/checkboxes).

Also, if an element is already selected, it must have an additional attribute, which will be added to the possible
value template. The attribute name & value are specified using `supler:selectedAttrName` and `supler:selectedAttrValue`.

* re-define how a field overall is given (without separating into label/input/validation)

````html
<div id="form-container">
  <div supler:fieldFlatTemplate>
    // html with placeholders:
    // {{suplerFieldInputAttrs}}
    // {{suplerFieldLabelForId}}
    // {{suplerFieldLabelText}}
    // {{suplerFieldValidationId}}
  </div>
</div>
````

* re-define how a subform is rendered

````html
<div id="form-container">
  <div supler:subformDecorationTemplate>
    // html with placeholders:
    // {{suplerSubformLabel}}
    // {{suplerSubform}}
    // {{suplerSubformContainerAttrs}}
  </div>
</div>
````

* re-define how a subform element is rendered (as-list rendering)

````html
<div id="form-container">
  <div supler:subformListElementTemplate>
    // html with placeholders:
    // {{suplerSubformElement}}
    // {{suplerSubformElementContainerAttrs}}
  </div>
</div>
````

* re-define how a subform element is rendered (as-table rendering)

````html
<div id="form-container">
  <div supler:subformTableTemplate>
    // html with placeholders:
    // {{suplerSubformTableHeaders}}
    // {{suplerSubformTableCells}}
  </div>
</div>
````

The table headers are a series of `<tr><th>` tags.
The table cells are a series of `<tr><td></td><td></td>..></tr>...` tags.

* re-define the order of fields

````html
<div id="form-container" supler:fieldOrder="x, y, z">
</div>
````