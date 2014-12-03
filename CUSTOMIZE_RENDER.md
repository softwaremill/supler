Customizing via HTML templates
==============================

The generated HTML can be customized by providing templates, which will be used during the rendering process.
All templates should be nested inside the element that will contain the form. For example:

````html
<div id="form-container">
  <div supler:fieldTemplate supler:fieldPath="lastName">
    <div class="formGroup">
      <i>{{suplerLabel}} <span style="font-size: xx-small">(extra information)</span></i>
      {{suplerInput}}
      {{suplerValidation}}
    </div>
  </div>
</div>
````

Matching templates to fields
----------------------------

The templates are applied to all matching fields. The matchers should be specified as attributes of the template.
Currently the following matchers are allowed:

* `supler:fieldPath="..."` where field path can be e.g. `cars.model.name`
* `supler:fieldType="..."` where type can be e.g. `string`, `integer`, `double`, `static` etc.
* `supler:fieldRenderHint="..."` where the render hint can be e.g. `textarea`, `password`, `radio` etc.

That way templates for a specific field or field type can be specified.

Types of templates
------------------

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

Not yet implemented
-------------------

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

Customizing via options
=======================

To override how a particular form element is rendered, simply provide a method in the options passed to `SuplerForm`:

````javascript
var formContainer = document.getElementById('form-container');
var form =  = new SuplerForm(formContainer, {
  renderStringField: function(label, id, validationId, name, value, options, compact) {
    return someHtml;
  }
});
form.render(formJson); // formJson is received from the server
````

How the form and each form fragment is rendered can be customized via options.

````javascript
// basic types
renderStringField: (label: string, id: string, validationId: string, name: string, value: any, options: any, compact: boolean): string
renderIntegerField: (label: string, id: string, validationId: string, name: string, value: any, options: any, compact: boolean): string
renderDoubleField: (label: string, id: string, validationId: string, name: string, value: any, options: any, compact: boolean): string
renderPasswordField: (label: string, id: string, validationId: string, name: string, value: any, options: any, compact: boolean): string
renderTextareaField: (label: string, id: string, validationId: string, name: string, value: any, options: any, compact: boolean): string
renderMultiChoiceCheckboxField: (label: string, id: string, validationId: string, name: string, value: any, possibleValues: SelectValue[], options: any, compact: boolean): string
renderMultiChoiceSelectField: (label: string, id: string, validationId: string, name: string, value: any, possibleValues: SelectValue[], options: any, compact: boolean): string
renderSingleChoiceRadioField: (label: string, id: string, validationId: string, name: string, value: any, possibleValues: SelectValue[], options: any, compact: boolean): string
renderSingleChoiceSelectField: (label: string, id: string, validationId: string, name: string, value: any, possibleValues: SelectValue[], options: any, compact: boolean): string

// templates
// [label] [input] [validation]
renderField: (input: string, label: string, id: string, validationId: string, compact: boolean) => string
renderLabel: (forId: string, label: string) => string
renderValidation: (validationId: string) => string

renderStaticField: (label: string, id: string, validationId: string, value: any, compact: boolean) => string
renderStaticText: (text: string) => string

renderSubformDecoration: (subform: string, label: string, id: string, name: string) => string
renderSubformListElement: (subformElement: string, options: any) => string;
renderSubformTable: (tableHeaders: string[], cells: string[][], elementOptions: any) => string;

// html form elements
renderHtmlInput: (inputType: string, id: string, name: string, value: any, options: any) => string
renderHtmlSelect: (id: string, name: string, value: string, possibleValues: SelectValue[], options: any) => string
renderHtmlRadios: (id: string, name: string, value: number, possibleValues: SelectValue[], options: any) => string
renderHtmlCheckboxes: (id: string, name: string, values: number[], possibleValues: SelectValue[], options: any) => string
renderHtmlTextarea: (id: string, name: string, value: any, options: any) => string

// misc
defaultFieldOptions: () => any
defaultHtmlInputOptions: (inputType: string, id: string, name: string, value: any, options: any) => any
defaultHtmlTextareaOptions: (id: string, name: string, options: any) => any
````