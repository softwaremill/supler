interface RenderAnyValueField {
    (label: string, id: string, validationId: string, name: string, value: any, options: any, compact: boolean): string
}

interface RenderPossibleValuesField {
    (label: string, id: string, validationId: string, name: string, value: any, possibleValues: SelectValue[], options: any, compact: boolean): string
}

interface RenderOptions {
    // main field rendering entry points
    // basic types
    renderStringField: RenderAnyValueField
    renderIntegerField: RenderAnyValueField
    renderDoubleField: RenderAnyValueField
    renderBooleanField: RenderAnyValueField
    renderPasswordField: RenderAnyValueField
    renderTextareaField: RenderAnyValueField
    renderMultiChoiceCheckboxField: RenderPossibleValuesField
    renderMultiChoiceSelectField: RenderPossibleValuesField
    renderSingleChoiceRadioField: RenderPossibleValuesField
    renderSingleChoiceSelectField: RenderPossibleValuesField

    // templates
    // Rhs - [label] [input] [validation] (input on the right from the label)
    renderRhsField: (input: string, label: string, id: string, validationId: string, compact: boolean) => string
    renderLabel: (forId: string, label: string) => string
    renderValidation: (validationId: string) => string

    renderSubformDecoration: (subform: string, label: string, id: string, name: string) => string
    renderSubformListElement: (subformElement: string, options: any) => string;
    renderSubformTable: (tableHeaders: string[], cells: string[][], elementOptions: any) => string;

    // html form elements
    renderHtmlInput: (inputType: string, id: string, name: string, value: any, options: any) => string
    renderHtmlSelect: (id: string, name: string, value: string, possibleValues: SelectValue[], options: any) => string
    renderHtmlRadios: (id: string, name: string, value: string, possibleValues: SelectValue[], options: any) => string

    // misc
    defaultFieldOptions: () => any
}

class DefaultRenderOptions implements RenderOptions {
    constructor() {
    }

    renderStringField(label, id, validationId, name, value, options, compact) {
        return this.renderRhsField(this.renderHtmlInput('text', id, name, value, options), label, id, validationId, compact);
    }

    renderIntegerField(label, id, validationId, name, value, options, compact) {
        return this.renderRhsField(this.renderHtmlInput('number', id, name, value, options), label, id, validationId, compact);
    }

    renderDoubleField(label, id, validationId, name, value, options, compact) {
        return this.renderRhsField(this.renderHtmlInput('number', id, name, value, options), label, id, validationId, compact);
    }

    renderBooleanField(label, id, validationId, name, value, options, compact) {
        return '';
    }

    // text field render hints
    renderPasswordField(label, id, validationId, name, value, options, compact) {
        return this.renderRhsField(this.renderHtmlInput('password', id, name, value, options), label, id, validationId, compact);
    }

    renderTextareaField(label, id, validationId, name, value, options, compact) {
        var tag = HtmlUtil.renderTag('textarea', Util.copyProperties({ 'id': id, 'name': name }, options), false);
        if (value) tag += value;
        tag += '</textarea>';
        return this.renderRhsField(tag, label, id, validationId, compact);
    }

    renderMultiChoiceCheckboxField(label, id, validationId, name, values, possibleValues, options, compact) {
        return '';
    }

    renderMultiChoiceSelectField(label, id, validationId, name, values, possibleValues, options, compact) {
        return '';
    }

    renderSingleChoiceRadioField(label, id, validationId, name, value, possibleValues, options, compact) {
        return this.renderRhsField(this.renderHtmlRadios(id, name, value, possibleValues, options), label, id, validationId, compact);
    }

    renderSingleChoiceSelectField(label, id, validationId, name, value, possibleValues, options, compact) {
        return this.renderRhsField(this.renderHtmlSelect(id, name, value, possibleValues, options), label, id, validationId, compact);
    }

    //

    renderRhsField(input, label, id, validationId, compact) {
        var labelPart;
        if (compact) {
            labelPart = '';
        } else {
            labelPart = this.renderLabel(id, label) + '\n';
        }

        return '<div class="form-group">' +
            labelPart +
            input +
            '\n' +
            this.renderValidation(validationId) +
            '\n' +
            '</div>';
    }

    renderLabel(forId, label) {
        return '<label for="' + forId + '">' + label + '</label>';
    }

    renderValidation(validationId) {
        return '<div class="text-danger" id="' + validationId + '"></div>';
    }

    renderSubformDecoration(subform, label, id, name) {
        var html = '';
        html += HtmlUtil.renderTag('fieldset', {'id': id, 'name': name }, false);
        html += '\n';
        html += '<legend>' + label + '</legend>\n';

        html += subform;

        html += '</fieldset>\n';
        return html;
    }

    renderSubformListElement(subformElement, options) {
        var html = '';
        var optionsWithClass = Util.copyProperties({ 'class': 'well'}, options);
        html += HtmlUtil.renderTag('div', optionsWithClass, false);
        html += subformElement;
        html += '</div>\n';
        return html;
    }

    renderSubformTable(tableHeaders, cells, elementOptions) {
        var html = '';
        html += '<table class="table">\n';
        html += this.renderSubformTableHeader(tableHeaders);
        html += this.renderSubformTableBody(cells, elementOptions);
        html += '</table>\n';

        return html;
    }

    private renderSubformTableHeader(tableHeaders) {
        var html = '';
        html += '<tr>';
        tableHeaders.forEach((header) => html += '<th>' + header + '</th>');
        html += '</tr>\n';
        return html;
    }

    private renderSubformTableBody(cells, elementOptions) {
        var html = '';
        for (var i=0; i<cells.length; i++) {
            var row = cells[i];
            html += HtmlUtil.renderTag('tr', elementOptions, false) + '\n';
            for (var j=0; j<row.length; j++) {
                html += '<td>' + row[j] + '</td>\n';
            }
            html += '</tr>\n';
        }
        return html;
    }

    //

    renderHtmlInput(inputType, id, name, value, options) {
        return HtmlUtil.renderTag('input', Util.copyProperties({ 'id': id, 'type': inputType, 'name': name, 'value': value }, options), true);
    }

    renderHtmlSelect(id, name, value, possibleValues, options) {
        var html = '';
        html += HtmlUtil.renderTag('select', Util.copyProperties({ 'id': id, 'name': name }, options), false);
        html += '\n';
        Util.foreach(possibleValues, (i, v) => {
            var selected = '';
            if (v.index === value) {
                selected = ' selected ';
            }

            html += '<option value="' + v.index + '"' + selected + '>';
            html += v.label;
            html += '</option>\n';
        });
        html += '</select>\n';
        return html;
    }

    renderHtmlRadios(id, name, value, possibleValues, options) {
        // the radio buttons need to be grouped inside an element with the form field's id and validation id, so that
        // it could be found e.g. during validation.
        var radioContainerOptions = { 'id' : id, 'supler:validationId' : options['supler:validationId'] };
        var html = HtmlUtil.renderTag('span', radioContainerOptions, false) + '\n';
        Util.foreach(possibleValues, (i, v) => {
            var radioOptions = Util.copyProperties({}, options);

            // for radios we need to remove the form-control default class or they look ugly
            radioOptions.class = radioOptions.class.replace('form-control', '');

            if (v.index === value) {
                radioOptions.checked = 'checked';
            }

            html += '<div class="radio"><label>\n';
            html += this.renderHtmlInput('radio', id + v.index, name, v.index, radioOptions);
            html += v.label;
            html += '</label></div>\n';
        });
        html += '</span>';

        return html;
    }

    //

    defaultFieldOptions() {
        return { 'class': 'form-control' };
    }
}