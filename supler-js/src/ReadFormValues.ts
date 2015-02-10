class ReadFormValues {
  /**
   * @param element Element from which to read field values
   * @param selectedActionId The id of the element corresponding to the selected action. `null` if no action selected.
   * @param result The object to which found mappings will be added.
   * @returns An object containing mappings from found form field names to form field values.
   */
  static getValueFrom(element, selectedActionId = null, result = {}) {
    var fieldType = element.getAttribute(SuplerAttributes.FIELD_TYPE);
    var multiple = element.getAttribute(SuplerAttributes.MULTIPLE) === 'true';

    // disabled element values are not included in the form's value
    if (element.disabled) {
      return result;
    }

    if (fieldType) {
      var fieldName = element.getAttribute(SuplerAttributes.FIELD_NAME);
      switch (fieldType) {
        case FieldTypes.STRING:
          ReadFormValues.appendFieldValue(result, fieldName, this.getElementValue(element), multiple);
          break;

        case FieldTypes.INTEGER:
          ReadFormValues.appendFieldValue(result, fieldName, this.parseIntOrNull(this.getElementValue(element)), multiple);
          break;

        case FieldTypes.SELECT:
          ReadFormValues.appendFieldValue(result, fieldName, this.parseIntOrNull(this.getElementValue(element)), multiple);
          break;

        case FieldTypes.BOOLEAN:
          ReadFormValues.appendFieldValue(result, fieldName, this.parseBooleanOrNull(this.getElementValue(element)), multiple);
          break;

        case FieldTypes.ACTION:
          if (element.id === selectedActionId) {
            ReadFormValues.appendFieldValue(result, fieldName, true, false);
          }
          break;

        case FieldTypes.SUBFORM:
          fieldName = element.getAttribute(SuplerAttributes.FIELD_NAME);
          var subResult = this.getValueFromChildren(element, selectedActionId, {});
          ReadFormValues.appendFieldValue(result, fieldName, subResult, multiple);
          break;
      }
    } else if (element.children.length > 0) {
      // flattening
      this.getValueFromChildren(element, selectedActionId, result);
    }

    return result;
  }

  private static getValueFromChildren(element, selectedActionId, result) {
    var children = element.children;

    for (var i = 0; i < children.length; i++) {
      this.getValueFrom(children[i], selectedActionId, result);
    }

    return result;
  }

  private static getElementValue(element) {
    if ((element.type === 'radio' || element.type === 'checkbox') && !element.checked) {
      return null;
    } else {
      return element.value;
    }
  }

  private static appendFieldValue(result, fieldName, fieldValue, multiple) {
    if (multiple) {
      // Always initializing to an empty array, if not yet set
      result[fieldName] = result[fieldName] || [];

      if (fieldValue !== null) {
        result[fieldName].push(fieldValue);
      }
    } else {
      // We need to serialize the null values for optional non-string fields. However, if the field already has
      // a non-null, non-undefined value, keeping it. This is needed e.g. for radios and checkboxes.
      if (result[fieldName] === null || typeof result[fieldName] === 'undefined') {
        result[fieldName] = fieldValue;
      }
    }
  }

  private static parseIntOrNull(v):number {
    var p = parseInt(v);
    if (isNaN(p)) {
      return null;
    } else {
      return p;
    }
  }

  private static parseBooleanOrNull(v):boolean {
    var p = parseInt(v);
    if (isNaN(p)) {
      return null;
    } else {
      return p === 1;
    }
  }
}
