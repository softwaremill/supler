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

Use-cases:

* re-define the template of rendering RHS fields

````html
<div id="form-container">
  <div supler:rhsFieldTemplate>
    // any html with optional placeholders:
    // {{suplerLabel}}
    // {{suplerInput}}
    // {{suplerValidation}}
  </div>
</div>
````

* re-define how labels are rendered

````html
<div id="form-container">
  <div supler:labelTemplate>
    // any html with optional placeholders:
    // {{suplerLabelForId}}
    // {{suplerLabelText}}
  </div>
</div>
````

* re-define how validations are rendered

````html
<div id="form-container">
  <div supler:validationTemplate>
    // any html with optional placeholders:
    // {{suplerValidationId}}
  </div>
</div>
````

* re-define how a field's input of a given *type* is rendered

````html
<div id="form-container">
  <div supler:fieldInputTypeTemplate="[field type name]">
    // any html with optional placeholders:
    // {{suplerFieldId}}
    // {{suplerFieldName}}
    // {{suplerFieldValue}}
  </div>
</div>
````

* re-define how a field overall of a given *type* is rendered

````html
<div id="form-container">
  <div supler:fieldTypeTemplate="[field type name]">
    // any html with optional placeholders:
    // {{suplerFieldId}}
    // {{suplerFieldName}}
    // {{suplerFieldValue}}
    // {{suplerFieldLabel}}
    // {{suplerFieldValidationId}}
  </div>
</div>
````

* re-define how a specific field's input is rendered (given a field path)

````html
<div id="form-container">
  <div supler:namedFieldInputTemplate="[field path]">
    // any html with optional placeholders:
    // {{suplerFieldId}}
    // {{suplerFieldName}}
    // {{suplerFieldValue}}
  </div>
</div>
````

* re-define how a specific field overall is rendered (given a field path)

````html
<div id="form-container">
  <div supler:namedFieldTemplate="[field path]">
    // any html with optional placeholders:
    // {{suplerFieldId}}
    // {{suplerFieldName}}
    // {{suplerFieldValue}}
    // {{suplerFieldLabel}}
    // {{suplerFieldValidationId}}
  </div>
</div>
````

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