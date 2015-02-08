Form definition: Conditional fields
===================================

Form fields and subforms can be included and enabled conditionally, basing on the backing object's state.
The conditions can be defined using:

* ``f.field(_.likesChocolate).includeIf(person => person.hasNoAllergies)`` (included or not)
* ``f.field(_.likesChocolate).enabledIf(person => person.hasNoAllergies)`` (enabled / disabled)

If a field is not included (the test returns ``false``), the field won't be included in the JSON form representation
sent to the frontend. Hence, the field won't be visible at all.

If a field is disabled, it will be disabled in the frontend (usually grayed out), but still present in the JSON form
representation.

Both not included and disabled fields are not taken into account when applying values to a backing object from a
JSON object.

However, fields are always validated (even if not visible in the frontend or disabled). This is because validation
checks the object as a whole, and even when not editable, all field values should be valid. A failing validation of a
hidden field is most probably an error in the form definition. If you need to conditionally run validations, probably
the best choice is using optional fields (or optional subforms, which can be used to conditionally validate a group of
fields); the "conditionality" will then be also reflected in the model. Alternatively, you can use a custom validator.