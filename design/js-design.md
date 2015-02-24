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
var form = new Supler.Form(
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