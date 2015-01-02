Supler attribute requirements
=============================

Each field carries a number of meta-data elements allowing Supler to do its job.
In the most basic setting, the attributes are placed on the input element. The situation is a bit more complicated
when a single field translates to a number of input elements (checkboxes/radio buttons), or in the presence of subforms.

Regular field
-------------

* `supler:fieldName`: name of the field. Same as the `name` input attribute
* `supler:fieldType`: supler-type of the field. Used e.g. during serialization
* `supler:multiple`: if this field can take multiple values. For regular single-value fields this will be `false`.
* `supler:validationId`: id of the element where validation messages can be added
* `supler:path`: path to the element. Used e.g. during reloads and when applying validations after reloads

Checkable fields
----------------

Radio buttons/checkboxes. These need to be rendered with a containing element, which has some of the attributes.

Individual input: as above except `supler:path`.

Containing element:

* `supler:validationId`: there is a single validation element for all contained inputs
* `supler:path`: when looking for the element by-path, the containing element should be found

Note that the validation id needs to be present both on the individual and containing elements, so that the validation
element can be looked up both when triggered by a single input change, and when triggered by e.g. global validation.

Subforms
--------

Each element containing a subform:

* `supler:fieldName`
* `supler:fieldType`
* `supler:multiple`: if there are multiple subforms, this will be `true`

Other attributes don't have to be used.