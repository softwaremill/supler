module Supler {
  export class ReadFormValues {
    constructor(private fieldsOptions:FieldsOptions) {
    }
    /**
     * @param element Element from which to read field values
     * @param selectedActionId The id of the element corresponding to the selected action. `null` if no action selected.
     * @param result The object to which found mappings will be added.
     * @returns An object containing mappings from found form field names to form field values.
     */
    getValueFrom(element, selectedButtonId = null, result = {}) {
      var fieldType = element.getAttribute(SuplerAttributes.FIELD_TYPE);

      // disabled element values are not included in the form's value
      if (element.disabled) {
        return result;
      }

      if (fieldType) {
        var fieldOptions = this.fieldsOptions.forField(element.getAttribute('name'), fieldType, null);
        var fieldName = element.getAttribute(SuplerAttributes.FIELD_NAME);
        var multiple = element.getAttribute(SuplerAttributes.MULTIPLE) === 'true';

        if (fieldOptions && fieldOptions.readValue) {
          var v = fieldOptions.readValue(element);
          this.appendFieldValue(result, fieldName, v, multiple);
        } else {
          this.getValueDefault(element, fieldType, fieldName, multiple, selectedButtonId, result);
        }
      } else if (element.children.length > 0) {
        // flattening
        this.getValueFromChildren(element, selectedButtonId, result);
      }

      return result;
    }

    private getValueDefault(element:HTMLElement, fieldType:string, fieldName:string, multiple: boolean,
                            selectedButtonId:string, result:any) {

      switch (fieldType) {
        case FieldTypes.STRING:
          this.appendFieldValue(result, fieldName, this.getElementValue(element), multiple);
          break;

        case FieldTypes.INTEGER:
          this.appendFieldValue(result, fieldName, this.parseIntOrNull(this.getElementValue(element)), multiple);
          break;

        case FieldTypes.FLOAT:
          this.appendFieldValue(result, fieldName, this.parseFloatOrNull(this.getElementValue(element)), multiple);
          break;

        case FieldTypes.SELECT:
          this.appendFieldValue(result, fieldName, this.getElementValue(element), multiple);
          break;

        case FieldTypes.BOOLEAN:
          this.appendFieldValue(result, fieldName, this.parseBooleanOrNull(this.getElementValue(element)), multiple);
          break;

        case FieldTypes.ACTION:
          if (element.id === selectedButtonId) {
            this.appendFieldValue(result, fieldName, true, false);
          }
          break;

        case FieldTypes.SUBFORM:
          fieldName = element.getAttribute(SuplerAttributes.FIELD_NAME);
          var subResult = this.getValueFromChildren(element, selectedButtonId, {});
          this.appendFieldValue(result, fieldName, subResult, multiple);
          break;

        case FieldTypes.META:
          this.appendMetaValue(result, fieldName, this.getElementValue(element));
          break;

        case FieldTypes.MODAL:
          if (element.id === selectedButtonId) {
            this.appendFieldValue(result, fieldName, true, false);
          }
          break;

        default:
          throw new Error("Unknown type: " + fieldType + ", cannot read value!");

      }
    }

    private getValueFromChildren(element, selectedActionId, result) {
      var children = element.children;

      for (var i = 0; i < children.length; i++) {
        this.getValueFrom(children[i], selectedActionId, result);
      }

      return result;
    }

    private getElementValue(element) {
      if ((element.type === 'radio' || element.type === 'checkbox') && !element.checked) {
        return null;
      } else if (element.nodeName === 'SELECT') {
        var option = element.options[element.selectedIndex];
        if (option.hasAttribute('value')) return option.value; else return null;
      } else {
        return element.value;
      }
    }

    private appendFieldValue(result, fieldName, fieldValue, multiple) {
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

    private appendMetaValue(result, fieldName, fieldValue) {
      var meta;
      if (!(meta = result[FormSections.META])) {
        result[FormSections.META] = (meta = {});
      }

      meta[fieldName] = fieldValue;
    }

    private parseIntOrNull(v):number {
      var p = parseInt(v);
      if (isNaN(p)) {
        return null;
      } else {
        return p;
      }
    }

    private parseFloatOrNull(v):number {
      var p = parseFloat(v);
      if (isNaN(p)) {
        return null;
      } else {
        return p;
      }
    }

    private parseBooleanOrNull(v):boolean {
      if (v === null) {
        return null;
      } else return v === "1";
    }
  }
}
