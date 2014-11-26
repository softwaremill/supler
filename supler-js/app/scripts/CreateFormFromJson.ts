class CreateFormFromJson {
    private idCounter: number = 0;

    constructor(private renderOptions: RenderOptions, private i18n: I18n, private validatorFnFactories: any) {}

    renderForm(formJson): RenderFormResult {
        var fields = formJson.fields;
        var html = '';
        var elementDictionary: ElementDictionary = {};
        Util.foreach(fields, (field, fieldJson) => {
            var fieldResult = this.fieldFromJson(field, fieldJson, elementDictionary, false);
            if (fieldResult) {
                html += fieldResult + '\n';
            }
        });

        return new RenderFormResult(html, elementDictionary);
    }

    private fieldFromJson(fieldName: string, fieldJson: any, elementDictionary: ElementDictionary,
        compact: boolean): string {

        var id = this.nextId();
        var validationId = this.nextId();

        var html = this.fieldHtmlFromJson(id, validationId, fieldName, fieldJson, elementDictionary, compact);

        if (html) {
            elementDictionary[id] = new ElementValidator(this.fieldValidatorFns(fieldJson));
            return html;
        } else {
            return null;
        }
    }

    private fieldValidatorFns(fieldJson): ValidatorFn[] {
        var validators = [];

        var typeValidator = this.validatorFnFactories['type_' + fieldJson.type];
        if (typeValidator) validators.push(typeValidator());

        var validatorsJson = fieldJson.validate;
        if (validatorsJson) {
            Util.foreach(validatorsJson, (validatorName, validatorJson) => {
                if (this.validatorFnFactories[validatorName]) {
                    validators.push(this.validatorFnFactories[validatorName](validatorJson));
                }
            })
        }

        return validators;
    }

    private fieldHtmlFromJson(id: string, validationId: string, fieldName: string, fieldJson: any,
        elementDictionary: ElementDictionary, compact: boolean): string {

        var fieldOptions = Util.copyProperties({
            'supler:fieldName': fieldName,
            'supler:fieldType': fieldJson.type,
            'supler:multiple': fieldJson.multiple,
            'supler:validationId': validationId
        }, this.renderOptions.defaultFieldOptions());

        var label = this.labelFor(fieldJson.label);

        switch(fieldJson.type) {
            case FieldTypes.STRING:
                return this.stringFieldFromJson(label, id, fieldName, fieldJson, validationId, fieldOptions, compact);

            case FieldTypes.INTEGER:
                return this.renderOptions.renderIntegerField(label, id, validationId, fieldName, fieldJson.value, fieldOptions, compact);

            case FieldTypes.BOOLEAN:
                return this.booleanFieldFromJson(label, id, validationId, fieldName, fieldJson, fieldOptions, compact);

            case FieldTypes.SELECT:
                return this.selectFieldFromJson(label, id, validationId, fieldName, fieldJson, fieldOptions, compact);

            case FieldTypes.SUBFORM:
                return this.subformFieldFromJson(label, id, fieldName, fieldJson, elementDictionary);

            case FieldTypes.STATIC:
                return this.staticFieldFromJson(label, id, validationId, fieldJson, compact);

            default:
                return null;
        }
    }

    private stringFieldFromJson(label, id, fieldName, fieldJson, validationId, fieldOptions, compact) {
        var renderHintName = this.getRenderHintName(fieldJson);
        if (renderHintName === 'password') {
            return this.renderOptions.renderPasswordField(label, id, validationId, fieldName, fieldJson.value,
                fieldOptions, compact);
        } else if (renderHintName === 'textarea') {
            var fieldOptionsWithDim = Util.copyProperties(
                { rows: fieldJson.render_hint.rows, cols: fieldJson.render_hint.cols },
                fieldOptions);
            return this.renderOptions.renderTextareaField(label, id, validationId, fieldName, fieldJson.value,
                fieldOptionsWithDim, compact);
        } else {
            return this.renderOptions.renderStringField(label, id, validationId, fieldName, fieldJson.value,
                fieldOptions, compact);
        }
    }

    private booleanFieldFromJson(label, id, validationId, fieldName, fieldJson, fieldOptions, compact) {
        var possibleSelectValues = [
            new SelectValue(0, this.i18n.label_boolean_false()),
            new SelectValue(1, this.i18n.label_boolean_true())
        ];

        return this.renderOptions.renderSingleChoiceRadioField(label, id, validationId, fieldName,
            fieldJson.value ? 1 : 0, possibleSelectValues, fieldOptions, compact);
    }

    private selectFieldFromJson(label, id, validationId, fieldName, fieldJson, fieldOptions, compact) {
        var renderHintName = this.getRenderHintName(fieldJson);

        var possibleSelectValues = fieldJson.possible_values.map(v => new SelectValue(v.index, this.labelFor(v.label)));

        if (fieldJson.multiple) {
            return this.renderOptions.renderMultiChoiceCheckboxField(label, id, validationId, fieldName,
                fieldJson.value, possibleSelectValues, fieldOptions, compact);
        } else {
            if (!fieldJson.validate || !fieldJson.validate.required) {
                possibleSelectValues = [ new SelectValue(null, "") ].concat(possibleSelectValues);
            }

            if (renderHintName == 'radio') {
                return this.renderOptions.renderSingleChoiceRadioField(label, id, validationId, fieldName,
                    fieldJson.value, possibleSelectValues, fieldOptions, compact);
            } else {
                return this.renderOptions.renderSingleChoiceSelectField(label, id, validationId, fieldName,
                    fieldJson.value, possibleSelectValues, fieldOptions, compact);
            }
        }
    }

    private subformFieldFromJson(label, id, fieldName, fieldJson, elementDictionary) {
        var subformHtml = '';
        var options = {
            'supler:fieldType': FieldTypes.SUBFORM,
            'supler:fieldName': fieldName,
            'supler:multiple': fieldJson.multiple
        };
        if (this.getRenderHintName(fieldJson) === 'list') {
            for (var k in fieldJson.value) {
                var subformResult = this.renderForm(fieldJson.value[k]);
                Util.copyProperties(elementDictionary, subformResult.elementDictionary);

                subformHtml += this.renderOptions.renderSubformListElement(subformResult.html, options);
            }
        } else { // table
            var headers = this.getTableHeaderLabels(fieldJson);
            var cells: string[][] = [];

            for (var i=0; i<fieldJson.value.length; i++) {
                var j = 0;
                cells[i] = [];

                var subfieldsJson = fieldJson.value[i].fields;
                Util.foreach(subfieldsJson, (subfield, subfieldJson) => {
                    cells[i][j] = this.fieldFromJson(subfield, subfieldJson, elementDictionary, true);
                    j += 1;
                });
            }

            subformHtml += this.renderOptions.renderSubformTable(headers, cells, options);
        }

        return this.renderOptions.renderSubformDecoration(subformHtml, label, id, name);
    }

    private staticFieldFromJson(label, id, validationId, fieldJson, compact) {
        var value = this.i18n.fromKeyAndParams(fieldJson.value.key, fieldJson.value.params);
        if (!value) value = '-';
        return this.renderOptions.renderStaticField(label, id, validationId, value, compact);
    }

    private getRenderHintName(fieldJson: any): string {
        if (fieldJson.render_hint) {
            return fieldJson.render_hint.name;
        } else {
            return null;
        }
    }

    private getTableHeaderLabels(fieldJson: any): string[] {
        if (fieldJson.value.length > 0) {
            var firstRow = fieldJson.value[0];
            var result = [];
            Util.foreach(firstRow.fields, (fieldName, fieldValue) => result.push(this.labelFor(fieldValue.label)));
            return result;
        } else {
            return [];
        }
    }

    private labelFor(rawLabel: any): string {
        return this.i18n.fromKeyAndParams(rawLabel, []);
    }

    private nextId() {
        this.idCounter += 1;
        return 'id' + this.idCounter;
    }
}

class RenderFormResult {
    constructor(public html: string, public elementDictionary: ElementDictionary) {}
}
