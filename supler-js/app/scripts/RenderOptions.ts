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
    renderPasswordField: RenderAnyValueField
    renderTextareaField: RenderAnyValueField
    renderMultiChoiceCheckboxField: RenderPossibleValuesField
    renderMultiChoiceSelectField: RenderPossibleValuesField
    renderSingleChoiceRadioField: RenderPossibleValuesField
    renderSingleChoiceSelectField: RenderPossibleValuesField

    // templates
    // [label] [input] [validation]
    renderField: (input: string, label: string, id: string, validationId: string, compact: boolean) => string
    renderLabel: (forId: string, label: string) => string
    renderValidation: (validationId: string) => string

    renderStaticField: (label: string, id: string, validationId: string, value: any, compact: boolean) => string
    renderStaticText: (text: string) => string

    renderSubformDecoration: (subform: string, label: string, id: string, name: string) => string
    renderSubformListElement: (subformElement: string, options: any) => string;
    renderSubformTable: (tableHeaders: string[], cells: string[][], elementOptions: any) => string;

    // html form elements
    renderHtmlInput: (inputType: string, id: string, name: string, value: any, options: any) => string
    renderHtmlSelect: (id: string, name: string, value: string, possibleValues: SelectValue[], options: any) => string
    renderHtmlRadios: (id: string, name: string, value: number, possibleValues: SelectValue[], options: any) => string
    renderHtmlCheckboxes: (id: string, name: string, values: number[], possibleValues: SelectValue[], options: any) => string
    renderHtmlTextarea: (id: string, name: string, value: any, options: any) => string

    // misc
    defaultFieldOptions: () => any
}

class DefaultRenderOptions implements RenderOptions {
    constructor() {
    }

    renderStringField(label, id, validationId, name, value, options, compact) {
        return this.renderField(this.renderHtmlInput('text', id, name, value, options), label, id, validationId, compact);
    }

    renderIntegerField(label, id, validationId, name, value, options, compact) {
        return this.renderField(this.renderHtmlInput('number', id, name, value, options), label, id, validationId, compact);
    }

    renderDoubleField(label, id, validationId, name, value, options, compact) {
        return this.renderField(this.renderHtmlInput('number', id, name, value, options), label, id, validationId, compact);
    }

    // text field render hints
    renderPasswordField(label, id, validationId, name, value, options, compact) {
        return this.renderField(this.renderHtmlInput('password', id, name, value, options), label, id, validationId, compact);
    }

    renderTextareaField(label, id, validationId, name, value, options, compact) {
        return this.renderField(this.renderHtmlTextarea(id, name, value, options), label, id, validationId, compact);
    }

    renderStaticField(label, id, validationId, value, compact) {
        return this.renderField(this.renderStaticText(value), label, id, validationId, compact);
    }

    renderStaticText(text) {
        return HtmlUtil.renderTag('div', { 'class': 'form-control-static' }, text);
    }

    renderMultiChoiceCheckboxField(label, id, validationId, name, values, possibleValues, options, compact) {
        return this.renderField(this.renderHtmlCheckboxes(id, name, values, possibleValues, options), label, id, validationId, compact);
    }

    renderMultiChoiceSelectField(label, id, validationId, name, values, possibleValues, options, compact) {
        return '';
    }

    renderSingleChoiceRadioField(label, id, validationId, name, value, possibleValues, options, compact) {
        return this.renderField(this.renderHtmlRadios(id, name, value, possibleValues, options), label, id, validationId, compact);
    }

    renderSingleChoiceSelectField(label, id, validationId, name, value, possibleValues, options, compact) {
        return this.renderField(this.renderHtmlSelect(id, name, value, possibleValues, options), label, id, validationId, compact);
    }

    //

    renderField(input, label, id, validationId, compact) {
        var labelPart;
        if (compact) {
            labelPart = '';
        } else {
            labelPart = this.renderLabel(id, label) + '\n';
        }

        var divBody = labelPart +
            input +
            '\n' +
            this.renderValidation(validationId) +
            '\n';

        return HtmlUtil.renderTag('div', { 'class': 'form-group' }, divBody, false);
    }

    renderLabel(forId, label) {
        return HtmlUtil.renderTag('label', { 'for': forId }, label);
    }

    renderValidation(validationId) {
        return HtmlUtil.renderTag('div', { 'class': 'text-danger', 'id': validationId });
    }

    renderSubformDecoration(subform, label, id, name) {
        var fieldsetBody = '\n';
        fieldsetBody += HtmlUtil.renderTag('legend', {}, label);
        fieldsetBody += subform;

        return HtmlUtil.renderTag('fieldset', {'id': id, 'name': name }, fieldsetBody, false);
    }

    renderSubformListElement(subformElement, options) {
        var optionsWithClass = Util.copyProperties({ 'class': 'well'}, options);
        return HtmlUtil.renderTag('div', optionsWithClass, subformElement, false);
    }

    renderSubformTable(tableHeaders, cells, elementOptions) {
        var tableBody = this.renderSubformTableHeader(tableHeaders);
        tableBody += this.renderSubformTableBody(cells, elementOptions);

        return HtmlUtil.renderTag('table', { 'class': 'table' }, tableBody, false);
    }

    private renderSubformTableHeader(tableHeaders) {
        var trBody = '';
        tableHeaders.forEach((header) => trBody += HtmlUtil.renderTag('th', {}, header));

        return HtmlUtil.renderTag('tr', {}, trBody, false);
    }

    private renderSubformTableBody(cells, elementOptions) {
        var html = '';
        for (var i=0; i<cells.length; i++) {
            var row = cells[i];

            var trBody = '';
            for (var j=0; j<row.length; j++) {
                trBody += HtmlUtil.renderTag('td', {}, row[j], false);
            }

            html += HtmlUtil.renderTag('tr', elementOptions, trBody, false) + '\n';
        }
        return html;
    }

    //

    renderHtmlInput(inputType, id, name, value, options) {
        return HtmlUtil.renderTag('input', Util.copyProperties({ 'id': id, 'type': inputType, 'name': name, 'value': value }, options));
    }

    renderHtmlSelect(id, name, value, possibleValues, options) {
        var selectBody = '';
        Util.foreach(possibleValues, (i, v) => {
            var optionOptions = { 'value': v.index };
            if (v.index === value) {
                optionOptions['selected'] = 'selected';
            }

            selectBody += HtmlUtil.renderTag('option', optionOptions, v.label);
        });

        var html = HtmlUtil.renderTag('select', Util.copyProperties({ 'id': id, 'name': name }, options), selectBody, false);
        html += '\n';
        return html;
    }

    renderHtmlRadios(id, name, value, possibleValues, options) {
        return this.renderCheckable('radio', id, name, possibleValues, options,
            (v) => { return v.index === value; });
    }

    renderHtmlCheckboxes(id, name, values, possibleValues, options) {
        return this.renderCheckable('checkbox', id, name, possibleValues, options,
            (v) => { return values.indexOf(v.index) >= 0; });
    }

    renderHtmlTextarea(id, name, value, options) {
        return HtmlUtil.renderTag('textarea', Util.copyProperties({ 'id': id, 'name': name }, options), value);
    }

    private renderCheckable(inputType: string, id: string, name: string, possibleValues: SelectValue[], options: any,
        isChecked: (SelectValue) => boolean) {

        var html = '';
        Util.foreach(possibleValues, (i, v) => {
            var checkableOptions = Util.copyProperties({}, options);

            // for checkables we need to remove the form-control default class or they look ugly
            checkableOptions['class'] = checkableOptions['class'].replace('form-control', '');

            if (isChecked(v)) {
                checkableOptions['checked'] = 'checked';
            }

            var labelBody = this.renderHtmlInput(inputType, id + '.' + v.index, name, v.index, checkableOptions);
            labelBody += HtmlUtil.renderTag('span', {}, v.label);

            var divBody = HtmlUtil.renderTag('label', {}, labelBody, false);
            html += HtmlUtil.renderTag('div', { 'class': inputType }, divBody, false);
        });

        return this.renderWithContainingElement(html, id, options);
    }

    private renderWithContainingElement(body: string, id: string, options: any): string {
        // radio buttons and checkboxes need to be grouped inside an element with the form field's id and validation
        // id, so that it could be found e.g. during validation.
        var containerOptions = { 'id' : id, 'supler:validationId' : options[ SuplerAttributes.VALIDATION_ID ] };
        return HtmlUtil.renderTag('span', containerOptions, body, false);
    }

    //

    defaultFieldOptions() {
        return { 'class': 'form-control' };
    }
}
