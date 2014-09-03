class CreateFormFromJson {
    private idCounter: number = 0;

    constructor(private renderOptions: RenderOptions, private validatorFnFactories: any) {}

    formFromJson(formJson): CreateFormResult {
        var fields = formJson.fields;
        var html = '';
        var validatorDictionary: ElementValidatorDictionary = {};
        Util.foreach(fields, (field, fieldJson) => {
            var fieldResult = this.fieldFromJson(field, fieldJson, validatorDictionary, false);
            if (fieldResult) {
                html += fieldResult + '\n';
            }
        });

        return new CreateFormResult(html, validatorDictionary);
    }

    private fieldFromJson(fieldName: string, fieldJson: any, validatorDictionary: ElementValidatorDictionary,
        compact: boolean): string {

        var id = this.nextId();
        var validationId = this.nextId();

        var html = this.fieldHtmlFromJson(id, validationId, fieldName, fieldJson, validatorDictionary, compact);

        if (html) {
            validatorDictionary[id] = new ElementValidator(this.fieldValidatorFns(fieldJson));
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
        validatorDictionary: ElementValidatorDictionary, compact: boolean): string {

        var fieldOptions = {
            'class': 'form-control',
            'supler:fieldName': fieldName,
            'supler:fieldType': fieldJson.type,
            'supler:multiple': fieldJson.multiple,
            'supler:validationId': validationId
        };

        switch(fieldJson.type) {
            case FieldTypes.STRING:
                return this.stringFieldFromJson(id, validationId, fieldName, fieldJson, fieldOptions, compact);

            case FieldTypes.INTEGER:
                return this.renderOptions.renderIntegerField(fieldJson.label, id, validationId, fieldName, fieldJson.value, fieldOptions, compact);

            case FieldTypes.SUBFORM:
                return this.subformFieldFromJson(id, fieldName, fieldJson, validatorDictionary);

            default:
                return null;
        }
    }

    private stringFieldFromJson(id, validationId, fieldName, fieldJson, fieldOptions, compact) {
        if (fieldJson.possible_values) {
            if (fieldJson.multiple) {
                return '';
            } else {
                return this.renderOptions.renderSingleChoiceSelectField(fieldJson.label, id, validationId, fieldName,
                    fieldJson.value, fieldJson.possible_values, fieldOptions, compact);
            }
        } else {
            return this.renderOptions.renderStringField(fieldJson.label, id, validationId, fieldName, fieldJson.value,
                fieldOptions, compact);
        }
    }

    private subformFieldFromJson(id, fieldName, fieldJson, validatorDictionary) {
        return this.renderOptions.renderSubformDecoration(() => {
            var html = '';
            if (fieldJson.render_hint === 'list') {
                for (var k in fieldJson.value) {
                    var options = {
                        'supler:fieldType': 'subform',
                        'supler:fieldName': fieldName,
                        'supler:multiple': fieldJson.multiple
                    };
                    
                    html += this.renderOptions.renderSubformListElement(() => {
                        var result = this.formFromJson(fieldJson.value[k]);
                        Util.copyProperties(validatorDictionary, result.validatorDictionary);
                        return result.html;
                    }, options);
                }
            } else { // table
                var headers = this.getTableHeaderLabels(fieldJson);
                var cells: string[][] = [];

                for (var i=0; i<fieldJson.value.length; i++) {
                    var j = 0;
                    cells[i] = [];

                    var subfieldsJson = fieldJson.value[i].fields;
                    Util.foreach(subfieldsJson, (subfield, subfieldJson) => {
                        cells[i][j] = this.fieldFromJson(subfield, subfieldJson, validatorDictionary, true);
                        j += 1;
                    });
                }

                html += this.renderOptions.renderSubformTable(headers, cells);
            }

            return html;
        }, fieldJson.label, id, name);
    }

    private getTableHeaderLabels(fieldJson: any): string[] {
        if (fieldJson.value.length > 0) {
            var firstRow = fieldJson.value[0];
            var result = [];
            Util.foreach(firstRow.fields, (fieldName, fieldValue) => result.push(fieldValue.label));
            return result;
        } else {
            return [];
        }
    }

    private nextId() {
        this.idCounter += 1;
        return 'id' + this.idCounter;
    }
}

class CreateFormResult {
    constructor(public html: string, public validatorDictionary: ElementValidatorDictionary) {}
}