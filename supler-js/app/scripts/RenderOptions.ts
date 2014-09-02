interface RenderSingleChoiceField {
    (label: string, id: string, validationId: string, name: string, value: any, options: any): string
}

interface RenderMultiChoiceField {
    (label: string, id: string, validationId: string, name: string, value: any, possibleValues: any[], options: any): string
}

interface RenderOptions {
    // main field rendering entry points
    // basic types
    renderStringField: RenderSingleChoiceField
    renderIntegerField: RenderSingleChoiceField
    renderDoubleField: RenderSingleChoiceField
    renderBooleanField: RenderSingleChoiceField
    renderPasswordField: RenderSingleChoiceField
    renderTextareaField: RenderSingleChoiceField
    renderMultiChoiceCheckboxField: RenderMultiChoiceField
    renderMultiChoiceSelectField: RenderMultiChoiceField
    renderSingleChoiceRadioField: RenderMultiChoiceField
    renderSingleChoiceSelectField: RenderMultiChoiceField

    // templates
    // Rhs - [label] [input] [validation] (input on the right from the label)
    renderRhsField: (renderInput: () => string, label: string, id: string, validationId: string) => string
    renderLabel: (forId: string, label: string) => string
    renderValidation: (validationId: string) => string

    // html form elements
    renderHtmlInput: (inputType: string, id: string, name: string, value: any, options: any) => string
    renderHtmlSelect: (id: string, name: string, value: string, possibleValues: any[], options: any) => string
}

class DefaultRenderOptions implements RenderOptions {
    constructor() {
    }

    renderStringField(label, id, validationId, name, value, options) {
        return this.renderRhsField(() => this.renderHtmlInput("text", id, name, value, options), label, id, validationId);
    }

    renderIntegerField(label, id, validationId, name, value, options) {
        return this.renderRhsField(() => this.renderHtmlInput("number", id, name, value, options), label, id, validationId);
    }

    renderDoubleField(label, id, validationId, name, value, options) {
        return this.renderRhsField(() => this.renderHtmlInput("number", id, name, value, options), label, id, validationId);
    }

    renderBooleanField(label, id, validationId, name, value, options) {
        return "";
    }

    // text field render hints
    renderPasswordField(label, id, validationId, name, value, options) {
        return this.renderRhsField(() => this.renderHtmlInput("password", id, name, value, options), label, id, validationId);
    }

    renderTextareaField(label, id, validationId, name, value, options) {
        return "";
    }

    renderMultiChoiceCheckboxField(label, id, validationId, name, values, possibleValues, options) {
        return "";
    }

    renderMultiChoiceSelectField(label, id, validationId, name, values, possibleValues, options) {
        return "";
    }

    renderSingleChoiceRadioField(label, id, validationId, name, value, possibleValues, options) {
        return "";
    }

    renderSingleChoiceSelectField(label, id, validationId, name, value, possibleValues, options) {
        return this.renderRhsField(() => this.renderHtmlSelect(id, name, value, possibleValues, options), label, id, validationId);
    }

    //

    renderRhsField(renderInput, label, id, validationId) {
        return '<div class="form-group">' +
            this.renderLabel(id, label) +
            "\n" +
            renderInput() +
            "\n" +
            this.renderValidation(validationId) +
            "\n" +
            '</div>';
    }

    renderLabel(forId, label) {
        return '<label for="' + forId + '">' + label + '</label>';
    }

    renderValidation(validationId) {
        return '<div class="text-danger" id="' + validationId + '"></div>';
    }

    //

    renderHtmlInput(inputType, id, name, value, options) {
        return HtmlUtil.renderTag("input", Util.copyProperties({ "id": id, "type": inputType, "name": name, "value": value }, options), true);
    }

    renderHtmlSelect(id, name, value, possibleValues, options) {
        var html = "";
        html += HtmlUtil.renderTag("select", Util.copyProperties({ "id": id, "name": name }, options), false);
        html += "\n";
        Util.foreach(possibleValues, (i, v) => {
            var selected = "";
            if (v === value) {
                selected = " selected ";
            }

            html += '<option value="' + v + '"' + selected + '>';
            html += v;
            html += '</option>\n';
        });
        html += "</select>\n";
        return html;
    }
}