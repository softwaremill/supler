Description of a form in JSON
=============================

Basing on that description, a form is rendered

```json
{
  "fields": {
    "field1": {
      "label": "...",
      "type": "text" / "integer" / "real" / "boolean",
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
    formJson, // read from the server
    document.getElementById("form-container"), 
    {
        // options - see below
    }
});

// serialize & send
form.toJson();

// parse the response
var suplerResponse = new SuplerResponse(responseJson);
suplerResponse.isSubmitted(); // true or false; if false - server-side valdiation errors

form.applyResponse(suplerResponse); // modify form, display validations
````

Customizing via options
-----------------------

How each form fragment is rendered can be customized via options.

````json
// possible options
fieldOrder: ["x", "y", "z"]
validationTextTransform: function(str) {} // i18n
renderFieldTemplate: function(renderLabel, renderInput, renderValidation) {}
renderFieldValidationTemplate: function(validationText) {}
renderLabelTemplate: function(label) {}
// for each supported type and rendering hint
renderTextField: function(name, value, attrs) {}
renderRadioField: function(name, values) {}
renderCheckboxField: function(name, values) {}
renderSelectField: function(name, values) {}
...
// rendering HTML elements (invoked by the above)
renderInputHTML: function(name, value, attrs) {}
renderTextareaHTML: function(name, value, attrs) {}
````

Customizing vis HTML
--------------------

Rendering can also be customized via HTML. HTML customizations generate options which override any of the default
and provided options.

Use-cases:

* re-define the template of rendering fields

````html
<div id="form-container">
  <supler:fieldTemplate>
    // any html
    <supler:fieldTemplate:label />
    // any html
    <supler:fieldTemplate:input />
    // any html
    <supler:fieldTemplate:validation />
    // any html
  </supler:fieldTemplate>
</div>
````

* re-define how validations are rendered

````html
<div id="form-container">
  <supler:fieldValidationTemplate>
    // any html
    <supler:fieldValidationTemplate:validationText />
    // any html
  </supler:fieldValidationTemplate>
</div>
````

* re-define how a field *type* is rendered

````html
<div id="form-container">
  <supler:renderFieldTypeAs fieldType="[field type name]">
    // must contain an element with the name attr set to "suplerName" - will be replaced
  </supler:renderFieldAs>
</div>
````

* re-define how a specific field is rendered

````html
<div id="form-container">
  <supler:renderFieldAs fieldName="[field name]">
    // any html
    // must contain an element with the name attr same as the field
  </supler:renderFieldAs>
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

Notes: HTML<->form element mapping
---------------------------

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