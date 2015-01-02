class CreateFormFromJson {
  private idCounter:number = 0;

  constructor(private renderOptionsGetter:RenderOptionsGetter,
    private i18n:I18n,
    private validatorFnFactories:any) {
  }

  renderForm(formJson):RenderFormResult {
    var fields = formJson.fields;
    var html = '';
    var elementDictionary:ElementDictionary = {};
    Util.foreach(fields, (field, fieldJson) => {
      var fieldResult = this.fieldFromJson(field, fieldJson, elementDictionary, false);
      if (fieldResult) {
        html += fieldResult + '\n';
      }
    });

    return new RenderFormResult(html, elementDictionary);
  }

  private fieldFromJson(fieldName: string, fieldJson: any, elementDictionary: ElementDictionary, compact: boolean):string {

    var id = this.nextId();
    var validationId = this.nextId();

    var fieldData = new FieldData(id, validationId, fieldName, fieldJson, this.labelFor(fieldJson.label));
    var html = this.fieldHtmlFromJson(fieldData, elementDictionary, compact);

    if (html) {
      elementDictionary[id] = new ElementValidator(this.fieldValidatorFns(fieldJson));
      return html;
    } else {
      return null;
    }
  }

  private fieldValidatorFns(fieldJson):ValidatorFn[] {
    var validators = [];

    var typeValidator = this.validatorFnFactories['type_' + fieldJson.type];
    if (typeValidator) validators.push(typeValidator.apply(this));

    var validatorsJson = fieldJson.validate;
    if (validatorsJson) {
      Util.foreach(validatorsJson, (validatorName, validatorJson) => {
        if (this.validatorFnFactories[validatorName]) {
          validators.push(this.validatorFnFactories[validatorName](validatorJson, fieldJson));
        }
      })
    }

    return validators;
  }

  private fieldHtmlFromJson(fieldData: FieldData, elementDictionary: ElementDictionary, compact: boolean): string {

    var renderOptions = this.renderOptionsGetter.forField(fieldData.path, fieldData.type, fieldData.getRenderHintName());

    var fieldOptions = Util.copyProperties({
      'supler:fieldName': fieldData.name,
      'supler:fieldType': fieldData.type,
      'supler:multiple': fieldData.multiple,
      'supler:validationId': fieldData.validationId,
      'supler:path': fieldData.path
    }, renderOptions.defaultFieldOptions());

    switch (fieldData.type) {
      case FieldTypes.STRING:
        return this.stringFieldFromJson(renderOptions, fieldData, fieldOptions, compact);

      case FieldTypes.INTEGER:
        return renderOptions.renderIntegerField(fieldData, fieldOptions, compact);

      case FieldTypes.BOOLEAN:
        return this.booleanFieldFromJson(renderOptions, fieldData, fieldOptions, compact);

      case FieldTypes.SELECT:
        return this.selectFieldFromJson(renderOptions, fieldData, fieldOptions, compact);

      case FieldTypes.SUBFORM:
        return this.subformFieldFromJson(renderOptions, fieldData, elementDictionary);

      case FieldTypes.STATIC:
        return this.staticFieldFromJson(renderOptions, fieldData, compact);

      case FieldTypes.ACTION:
        return this.actionFieldFromJson(renderOptions, fieldData, fieldOptions, compact);

      default:
        return null;
    }
  }

  private stringFieldFromJson(renderOptions, fieldData: FieldData, fieldOptions, compact) {
    if (fieldData.getRenderHintName() === 'password') {
      return renderOptions.renderPasswordField(fieldData, fieldOptions, compact);
    } else if (fieldData.getRenderHintName() === 'textarea') {
      var fieldOptionsWithDim = Util.copyProperties(
        {rows: fieldData.json.render_hint.rows, cols: fieldData.json.render_hint.cols},
        fieldOptions);
      return renderOptions.renderTextareaField(fieldData, fieldOptionsWithDim, compact);
    } else {
      return renderOptions.renderStringField(fieldData, fieldOptions, compact);
    }
  }

  private booleanFieldFromJson(renderOptions, fieldData: FieldData, fieldOptions, compact) {
    var possibleSelectValues = [
      new SelectValue(0, this.i18n.label_boolean_false()),
      new SelectValue(1, this.i18n.label_boolean_true())
    ];

    fieldData.value = fieldData.value ? 1 : 0;

    return renderOptions.renderSingleChoiceRadioField(fieldData, possibleSelectValues,
      this.checkableContainerOptions(fieldData.id, fieldOptions), fieldOptions, compact);
  }

  private selectFieldFromJson(renderOptions, fieldData: FieldData, fieldOptions, compact) {
    var possibleSelectValues = fieldData.json.possible_values.map(v => new SelectValue(v.index, this.labelFor(v.label)));

    var containerOptions = this.checkableContainerOptions(fieldData.id, fieldOptions);

    if (fieldData.multiple) {
      return renderOptions.renderMultiChoiceCheckboxField(fieldData, possibleSelectValues,
        containerOptions, fieldOptions, compact);
    } else {
      var isRequired = fieldData.json.validate && fieldData.json.validate.required;
      var noValueSelected = fieldData.value === fieldData.json.empty_value;
      var isRadio = fieldData.getRenderHintName() === 'radio';

      if (!isRadio && (!isRequired || noValueSelected)) {
        possibleSelectValues = [new SelectValue(-1, "")].concat(possibleSelectValues);
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

  private checkableContainerOptions(id: string, elementOptions) {
    // radio buttons and checkboxes need to be grouped inside an element with the form field's id and validation
    // id, so that it could be found e.g. during validation.
    return {
      'id': id,
      'supler:validationId': elementOptions[SuplerAttributes.VALIDATION_ID],
      'supler:path': elementOptions[SuplerAttributes.PATH]
    };
  }

  private subformFieldFromJson(renderOptions, fieldData: FieldData, elementDictionary) {
    var subformHtml = '';
    var options = {
      'supler:fieldType': FieldTypes.SUBFORM,
      'supler:fieldName': fieldData.name,
      'supler:multiple': fieldData.multiple
    };
    if (fieldData.getRenderHintName() === 'list') {
      for (var k in fieldData.value) {
        var subformResult = this.renderForm(fieldData.value[k]);
        Util.copyProperties(elementDictionary, subformResult.elementDictionary);

        subformHtml += renderOptions.renderSubformListElement(subformResult.html, options);
      }
    } else { // table
      var headers = this.getTableHeaderLabels(fieldData.json);
      var cells:string[][] = [];

      for (var i = 0; i < fieldData.value.length; i++) {
        var j = 0;
        cells[i] = [];

        var subfieldsJson = fieldData.value[i].fields;
        Util.foreach(subfieldsJson, (subfield, subfieldJson) => {
          cells[i][j] = this.fieldFromJson(subfield, subfieldJson, elementDictionary, true);
          j += 1;
        });
      }

      subformHtml += renderOptions.renderSubformTable(headers, cells, options);
    }

    return renderOptions.renderSubformDecoration(subformHtml, fieldData.label, fieldData.id, fieldData.name);
  }

  private staticFieldFromJson(renderOptions, fieldData: FieldData, compact) {
    var value = this.i18n.fromKeyAndParams(fieldData.value.key, fieldData.value.params);
    if (!value) value = '-';
    fieldData.value = value;

    return renderOptions.renderStaticField(fieldData, compact);
  }

  private actionFieldFromJson(renderOptions, fieldData: FieldData, fieldOptions, compact) {
    return renderOptions.renderActionField(fieldData, fieldOptions, compact);
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

class RenderFormResult {
  constructor(public html:string, public elementDictionary:ElementDictionary) {
  }
}
