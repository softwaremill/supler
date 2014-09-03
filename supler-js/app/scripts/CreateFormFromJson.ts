class CreateFormFromJson {
    private idCounter: number = 0;

    constructor(private renderOptions: RenderOptions, private validatorFnFactories: any) {}

    formFromJson(formJson): CreateFormResult {
        var fields = formJson.fields;
        var html = "";
        var validatorDictionary: ElementValidatorDictionary = {};
        Util.foreach(fields, (field, fieldJson) => {
            var fieldResult = this.fieldFromJson(field, fieldJson, validatorDictionary, false);
            if (fieldResult) {
                html += fieldResult + "\n";
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
            "class": "form-control",
            "supler:fieldName": fieldName,
            "supler:fieldType": fieldJson.type,
            "supler:multiple": fieldJson.multiple,
            "supler:validationId": validationId
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
                return "";
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
        var html = "";
        html += HtmlUtil.renderTag("fieldset", {"id": id, "name": fieldName }, false);
        html += "\n";
        html += "<legend>" + fieldJson.label + "</legend>\n";

        if (fieldJson.render_hint === "list") {
            for (var i in fieldJson.value) {
                html += HtmlUtil.renderTag("div", {
                    "class": "well",
                    "supler:fieldType": "subform",
                    "supler:fieldName": fieldName,
                    "supler:multiple": fieldJson.multiple }, false);
                var result = this.formFromJson(fieldJson.value[i]);
                html += result.html;
                Util.copyProperties(validatorDictionary, result.validatorDictionary);
                html += "</div>\n";
            }
        } else { // table
            html += '<table class="table">\n';

            html += '<tr>';
            var headers = this.getTableHeaderLabels(fieldJson);
            headers.forEach((header) => html += '<th>' + header + '</th>');
            html += '</tr>\n';

            for (var i in fieldJson.value) {
                html += '<tr>\n';
                var subfieldsJson = fieldJson.value[i].fields;
                Util.foreach(subfieldsJson, (subfield, subfieldJson) => {
                    var fieldResult = this.fieldFromJson(subfield, subfieldJson, validatorDictionary, true);
                    if (fieldResult) {
                        html += '<td>' + fieldResult + '</td>\n';
                    }
                });
                html += '</tr>\n';
            }

            html += '</table>\n';
        }

        html += "</fieldset>\n";
        return html;
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
        return "id" + this.idCounter;
    }
}

class CreateFormResult {
    constructor(public html: string, public validatorDictionary: ElementValidatorDictionary) {}
}