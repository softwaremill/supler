module Supler {
  export class CreateFormFromJson {
    private idCounter:number = 0;

    constructor(private renderOptionsGetter:RenderOptionsGetter,
                private i18n:I18n,
                private validatorFnFactories:any,

                private fieldsOptions:FieldsOptions,
                private fieldOrder: string[][]) {
    }

    renderForm(meta,
               formJson,
               formElementDictionary:FormElementDictionary = new FormElementDictionary()):RenderFormResult {
      var fields = formJson.fields.slice();

      var rowsHtml = '';

      (this.fieldOrder || formJson.fieldOrder).forEach(row => {
        rowsHtml += this.row((<string[]>row).map(fieldName => this.findField(fieldName, fields)),
          formElementDictionary, this.renderOptionsGetter.defaultRenderOptions())
      });

      if (fields.filter(f => f).length > 0) {
        Log.warn("There are fields sent from the server that were not shown on the form: [" +
          fields.filter(f => f).map(f => f.name).join(',') +
        "]");
      }

      return new RenderFormResult(
        this.generateMeta(meta) + this.renderOptionsGetter.defaultRenderOptions().renderForm(rowsHtml),
        formElementDictionary);
    }

    private findField(fieldName: string, fields: any[]) {
      for (var i = 0; i < fields.length; i++) {
        if (fields[i] && fields[i]['name'] == fieldName) {
          var lookedForField = fields[i];
          delete fields[i];
          return lookedForField;
        }
      }
      Log.warn('Trying to access field not found in JSON: '+fieldName);
      return null;
    }

    private generateMeta(meta:any) {
      if (meta) {
        var html = '<span class="supler_meta" style="display: none; visibility: hidden">\n';
        Util.foreach(meta, (metaKey, metaValue) => {
          var attributes = {'type': 'hidden', 'value': metaValue};
          attributes[SuplerAttributes.FIELD_TYPE] = FieldTypes.META;
          attributes[SuplerAttributes.FIELD_NAME] = metaKey;

          html += HtmlUtil.renderTag('input', attributes) + '\n';
        });
        return html + '</span>\n';
      } else {
        return '';
      }
    }

    private row(fields: Object[], formElementDictionary:FormElementDictionary, renderOptions: RenderOptions) {
      var fieldsHtml = '';
      fields.forEach(field => {
        fieldsHtml += this.fieldFromJson(field, formElementDictionary, false, fields.length)
      });
      return renderOptions.renderRow(fieldsHtml);
    }

    private fieldFromJson(fieldJson:any, formElementDictionary:FormElementDictionary, compact:boolean, fieldsPerRow: number):string {

      var id = this.nextId();
      var validationId = this.nextId();

      var fieldData = new FieldData(id, validationId, fieldJson, this.labelFor(fieldJson.label), fieldsPerRow);

      var fieldOptions = this.fieldsOptions.forField(fieldData);
      if (fieldOptions && fieldOptions.renderHint) {
        fieldData = fieldData.withRenderHintOverride(fieldOptions.renderHint);
      }

      var html = this.fieldHtmlFromJson(fieldData, formElementDictionary, compact);

      if (html) {
        formElementDictionary.getElement(id).validator = new ElementValidator(
          this.fieldValidatorFns(fieldData),
          fieldData.validate.required,
          fieldJson.empty_value);
        return html;
      } else {
        return null;
      }
    }

    private fieldValidatorFns(fieldData:FieldData):ValidatorFn[] {
      var validators = [];

      var typeValidator = this.validatorFnFactories['type_' + fieldData.type];
      if (typeValidator) validators.push(typeValidator.apply(this));

      var validatorsJson = fieldData.validate;
      Util.foreach(validatorsJson, (validatorName, validatorJson) => {
        if (this.validatorFnFactories[validatorName]) {
          validators.push(this.validatorFnFactories[validatorName](validatorJson, fieldData.json));
        }
      });

      return validators;
    }

    private fieldHtmlFromJson(fieldData:FieldData,
                              formElementDictionary:FormElementDictionary,
                              compact:boolean):string {

      var renderOptions = this.renderOptionsGetter.forField(fieldData.path, fieldData.type, fieldData.getRenderHintName());

      var fieldOptions = Util.copyProperties({
        'id': fieldData.id,
        // the field name must be unique for a value, so that e.g. radio button groups in multiple subforms work
        // correctly, hence we cannot use the field's name.
        'name': fieldData.path,
        'supler:fieldName': fieldData.name,
        'supler:fieldType': fieldData.type,
        'supler:multiple': fieldData.multiple,
        'supler:validationId': fieldData.validationId,
        'supler:path': fieldData.path
      }, renderOptions.additionalFieldOptions());

      if (!fieldData.enabled) {
        fieldOptions['disabled'] = true;
      }

      switch (fieldData.type) {
        case FieldTypes.STRING:
        case FieldTypes.INTEGER:
        case FieldTypes.FLOAT:
          return this.textFieldFromJson(renderOptions, fieldData, fieldOptions, compact);

        case FieldTypes.BOOLEAN:
          return this.booleanFieldFromJson(renderOptions, fieldData, fieldOptions, compact);

        case FieldTypes.SELECT:
          return this.selectFieldFromJson(renderOptions, fieldData, fieldOptions, compact);

        case FieldTypes.SUBFORM:
          return this.subformFieldFromJson(renderOptions, fieldData, formElementDictionary);

        case FieldTypes.STATIC:
          return this.staticFieldFromJson(renderOptions, fieldData, compact);

        case FieldTypes.ACTION:
          return this.actionFieldFromJson(renderOptions, fieldData, fieldOptions, formElementDictionary, compact);

        case FieldTypes.MODAL:
          return this.modalFieldFromJson(renderOptions, fieldData, fieldOptions, formElementDictionary, compact);

        default:
          return null;
      }
    }

    private textFieldFromJson(renderOptions, fieldData:FieldData, fieldOptions, compact) {
      if (fieldData.getRenderHintName() === 'textarea') {
        var renderHint = fieldData.getRenderHint();
        var fieldOptionsWithDim = Util.copyProperties(
          {rows: renderHint.rows, cols: renderHint.cols},
          fieldOptions);
        return renderOptions.renderTextareaField(fieldData, fieldOptionsWithDim, compact);
      } else if (fieldData.getRenderHintName() === 'hidden') {
        return renderOptions.renderHiddenField(fieldData, fieldOptions, compact);
      } else if (fieldData.getRenderHintName() === 'date') {
        return renderOptions.renderDateField(fieldData, fieldOptions, compact);
      } else {
        return renderOptions.renderTextField(fieldData, fieldOptions, compact);
      }
    }

    private booleanFieldFromJson(renderOptions, fieldData:FieldData, fieldOptions, compact) {
      var possibleSelectValues = [
        new SelectValue("0", this.i18n.label_boolean_false()),
        new SelectValue("1", this.i18n.label_boolean_true())
      ];

      fieldData.value = fieldData.value ? "1" : "0";

      return renderOptions.renderSingleChoiceRadioField(fieldData, possibleSelectValues,
        this.checkableContainerOptions(fieldData.id, fieldOptions), fieldOptions, compact);
    }

    private selectFieldFromJson(renderOptions, fieldData:FieldData, fieldOptions, compact) {
      var possibleSelectValues = fieldData.json.possible_values.map(v => new SelectValue(v.id, this.labelFor(v.label)));

      var containerOptions = this.checkableContainerOptions(fieldData.id, fieldOptions);

      if (fieldData.multiple) {
        return renderOptions.renderMultiChoiceCheckboxField(fieldData, possibleSelectValues,
          containerOptions, fieldOptions, compact);
      } else {
        var isRequired = fieldData.json.validate && fieldData.json.validate.required;
        var noValueSelected = fieldData.value === fieldData.json.empty_value;
        var isRadio = fieldData.getRenderHintName() === 'radio';

        if (!isRadio && (!isRequired || noValueSelected)) {
          possibleSelectValues = [new SelectValue(null, "")].concat(possibleSelectValues);
        }

        if (isRadio) {
          return renderOptions.renderSingleChoiceRadioField(fieldData, possibleSelectValues,
            containerOptions, fieldOptions, compact);
        } else {
          return renderOptions.renderSingleChoiceSelectField(fieldData, possibleSelectValues,
            containerOptions, fieldOptions, compact);
        }
      }
    }

    /**
     * When using the container options, which include the id, the ids of the elements should be changed.
     */
    private checkableContainerOptions(id:string, elementOptions) {
      // radio buttons and checkboxes need to be grouped inside an element with the form field's id and validation
      // id, so that it could be found e.g. during validation.
      return {
        'id': id,
        'supler:validationId': elementOptions[SuplerAttributes.VALIDATION_ID],
        'supler:path': elementOptions[SuplerAttributes.PATH]
      };
    }

    private subformFieldFromJson(renderOptions, fieldData:FieldData, formElementDictionary:FormElementDictionary) {
      var subformHtml = '';
      var options = {
        'supler:fieldType': FieldTypes.SUBFORM,
        'supler:fieldName': fieldData.name,
        'supler:multiple': fieldData.multiple
      };

      var values;
      // value can be undefined for an optional subform
      if (typeof fieldData.value !== 'undefined') {
        values = fieldData.multiple ? fieldData.value : [fieldData.value];
      } else values = [];

      this.propagateDisabled(fieldData, values);

      if (fieldData.getRenderHintName() === 'list') {
        for (var k in values) {
          var subformResult = this.renderForm(null, values[k], formElementDictionary);
          subformHtml += renderOptions.renderSubformListElement(subformResult.html, options);
        }
      } else { // table
        var headers = this.getTableHeaderLabels(fieldData.json);
        var cells:string[][] = [];

        for (var i = 0; i < values.length; i++) {
          var j = 0;
          cells[i] = [];

          var subfieldsJson = values[i].fields;
          Util.foreach(subfieldsJson, (subfield, subfieldJson) => {
            cells[i][j] = this.fieldFromJson(subfieldJson, formElementDictionary, true, -1);
            j += 1;
          });
        }

        subformHtml += renderOptions.renderSubformTable(headers, cells, options);
      }

      return renderOptions.renderSubformDecoration(subformHtml, fieldData.label, fieldData.id, fieldData.name);
    }

    private propagateDisabled(fromFieldData:FieldData, toSubforms:any) {
      if (!fromFieldData.enabled) {
        for (var k in toSubforms) {
          Util.foreach(toSubforms[k].fields, (k, v) => v.enabled = false);
        }
      }
    }

    private staticFieldFromJson(renderOptions, fieldData:FieldData, compact) {
      var value = this.i18n.fromKeyAndParams(fieldData.value.key, fieldData.value.params);
      if (!value) value = '-';
      fieldData.value = value;

      return renderOptions.renderStaticField(fieldData, compact);
    }

    private actionFieldFromJson(renderOptions, fieldData:FieldData, fieldOptions,
                                formElementDictionary:FormElementDictionary, compact) {

      formElementDictionary.getElement(fieldData.id).validationScope =
        ValidationScopeParser.fromJson(fieldData.json.validation_scope);

      return renderOptions.renderActionField(fieldData, fieldOptions, compact);
    }

    private modalFieldFromJson(renderOptions, fieldData:FieldData, fieldOptions,
                               formElementDictionary:FormElementDictionary, compact) {

      formElementDictionary.getElement(fieldData.id).validationScope = ValidateNone;

      return renderOptions.renderModalField(fieldData, fieldOptions, compact);
    }

    private getTableHeaderLabels(fieldJson:any):string[] {
      if (fieldJson.value.length > 0) {
        var firstRow = fieldJson.value[0];
        var result = [];
        Util.foreach(firstRow.fields, (fieldName, fieldValue) => {
          if (fieldValue.type === FieldTypes.ACTION) result.push(''); else result.push(this.labelFor(fieldValue.label));
        });
        return result;
      } else {
        return [];
      }
    }

    private labelFor(rawLabel:any):string {
      return this.i18n.fromKeyAndParams(rawLabel, []);
    }

    private nextId() {
      this.idCounter += 1;
      return 'id' + this.idCounter;
    }
  }

  export class RenderFormResult {
    constructor(public html:string, public formElementDictionary:FormElementDictionary) {
    }
  }
}
