Description of a form in JSON
=============================

Basing on that description, a form is rendered

```json
{
  "fields": {
    "field1": {
      "label": "...",
      "type": "text" / "integer" / "double" / "boolean",
      // optional fields 
      "validate": {
        "required": true,
        "minLength": 10,
        "maxLength": {
          "value": 20,
          "msg": "xxx"
        }
      },
      "multiple": false 
      "render_hint": "textarea" / "radio" / "checkbox" / "slider" / etc.,
      "placeholder": "...",
      "possible_values": [ "...", "...", "..." ],
      "value": ... // an array if multiple
    },
    "field2": {
      "label": "...",
      "type": "subform",
      "multiple": true
      "value": [
        {
        // recursive
        }, ...
      ] // or a single form if not multiple
    }
  }
}
```

HTML
====

Basic form workflow
-------------------

````html
<div id="form_container">
</div>
````

````javascript
// show
var form = new SuplerForm(
    document.getElementById("form-container"), 
    {
        // options - see below
    }
});
form.render(formJson); // read from the server

// serialize & send
form.toJson();

// parse the response
var suplerResponse = new SuplerResponse(responseJson);
suplerResponse.isSubmitted(); // true or false; if false - server-side valdiation errors

form.applyResponse(suplerResponse); // modify form, display validations
````

Customizing via options
-----------------------

How the form and each form fragment is rendered can be customized via options.

````javascript
// possible options - general
fieldOrder: ["x", "y", "z"]
validationTextTransform: function(str) {} // i18n

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
renderRhsField: function(renderInput, label, id) {}
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
* `superl:fieldRenderHint="..."` where the render hint can be e.g. `textarea`, `password`, `radio` etc.

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
  </div>
</div>
````

This should always be combined with a filter to make sense.
The attributes will contain normal attributes such as `id`, `name` and `value`, as well as supler-specific meta-data.

* re-define how a field's input with possible values is rendered

````html
<div id="form-container">
  <div supler:fieldInputTemplate super:singleInput="true|false">
    // html with placeholders:
    // {{suplerFieldInputContainerAttrs}}
    // must contain an element with the "supler:possibleValueInputTemplate" attribute;
    // that element will be repeated for each possible value. Placeholders:
    // {{suplerFieldInputAttrs}}
  </div>
</div>
````

To properly render a field with possible values, Supler needs to know if the element is rendered as a single
input (e.g. drop-down) or multiple inputs (e.g. radio/checkboxes). If it's a single element, no container is needed.

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

Other features
--------------

**Predictable naming**: form elements are named after fields. It should be easy to add custom JS handlers to form
elements.

Notes
-----

**Renderer types:**
* text
* number
* password
* textarea

multi-choice
* checkbox
* select-multi

single-choice
* select-single
* radio

**HTML<->form element mapping**
Unless otherwise stated, listed below are <input> types.

**Types**:
text
number 
file

(not supported for now)
color
week
time  
date 
datetime 
datetime-local 
month      
email
url

**Render hints**:
password
checkbox (for multi-select)
radio
range
<textarea>   
search
tel

<select>+<option> (multiple: true/false)

**Other**:
hidden
submit 
button   
image

Vocabulary
==========

* basic type: string, int, long, float, double, boolean