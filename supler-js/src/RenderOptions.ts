interface RenderAnyValueField {
  (fieldData: FieldData, options: any, compact: boolean): string
}

interface RenderPossibleValuesField {
  (fieldData: FieldData, possibleValues: SelectValue[], containerOptions: any, elementOptions: any, compact: boolean): string
}

interface RenderOptions {
  // main field rendering entry points
  // basic types
  renderStringField: RenderAnyValueField
  renderIntegerField: RenderAnyValueField
  renderFloatField: RenderAnyValueField
  renderPasswordField: RenderAnyValueField
  renderHiddenField: RenderAnyValueField
  renderTextareaField: RenderAnyValueField
  renderMultiChoiceCheckboxField: RenderPossibleValuesField
  renderMultiChoiceSelectField: RenderPossibleValuesField
  renderSingleChoiceRadioField: RenderPossibleValuesField
  renderSingleChoiceSelectField: RenderPossibleValuesField
  renderActionField: (fieldData: FieldData, options:any, compact:boolean) => string

  // templates
  // [label] [input] [validation]
  renderField: (input: string, fieldData: FieldData, compact: boolean) => string
  renderLabel: (forId: string, label :string) => string
  renderValidation: (validationId: string) => string

  renderStaticField: (label:string, id:string, validationId:string, value:any, compact:boolean) => string
  renderStaticText: (text:string) => string

  renderSubformDecoration: (subform:string, label:string, id:string, name:string) => string
  renderSubformListElement: (subformElement:string, options:any) => string;
  renderSubformTable: (tableHeaders:string[], cells:string[][], elementOptions:any) => string;

  // html form elements
  renderHtmlInput: (inputType: string, value: any, options: any) => string
  renderHtmlSelect: (value: number, possibleValues: SelectValue[], options: any) => string
  renderHtmlRadios: (value: any, possibleValues: SelectValue[], containerOptions: any, elementOptions: any) => string
  renderHtmlCheckboxes: (value: any, possibleValues: SelectValue[], containerOptions: any, elementOptions: any) => string
  renderHtmlTextarea: (value: string, options:any) => string
  renderHtmlButton: (label: string, options:any) => string

  // misc
  additionalFieldOptions: () => any
}

class Bootstrap3RenderOptions implements RenderOptions {
  constructor() {
  }

  renderStringField(fieldData, options, compact) {
    return this.renderField(this.renderHtmlInput('text', fieldData.value, options), fieldData, compact);
  }

  renderIntegerField(fieldData, options, compact) {
    return this.renderField(this.renderHtmlInput('number', fieldData.value, options), fieldData, compact);
  }

  renderFloatField(fieldData, options, compact) {
    return this.renderField(this.renderHtmlInput('number', fieldData.value, options), fieldData, compact);
  }

  renderPasswordField(fieldData, options, compact) {
    return this.renderField(this.renderHtmlInput('password', fieldData.value, options), fieldData, compact);
  }

  renderHiddenField(fieldData, options, compact) {
    return this.renderHiddenFormGroup(this.renderHtmlInput('hidden', fieldData.value, options));
  }

  renderTextareaField(fieldData, options, compact) {
    return this.renderField(this.renderHtmlTextarea(fieldData.value, options), fieldData, compact);
  }

  renderStaticField(fieldData, compact) {
    return this.renderField(this.renderStaticText(fieldData.value), fieldData, compact);
  }

  renderStaticText(text) {
    return HtmlUtil.renderTag('div', {'class': 'form-control-static'}, text);
  }

  renderMultiChoiceCheckboxField(fieldData, possibleValues, containerOptions, elementOptions, compact) {
    return this.renderField(this.renderHtmlCheckboxes(fieldData.value, possibleValues, containerOptions, elementOptions), fieldData, compact);
  }

  renderMultiChoiceSelectField(fieldData, possibleValues, containerOptions, elementOptions, compact) {
    return '';
  }

  renderSingleChoiceRadioField(fieldData, possibleValues, containerOptions, elementOptions, compact) {
    return this.renderField(this.renderHtmlRadios(fieldData.value, possibleValues, containerOptions, elementOptions), fieldData, compact);
  }

  renderSingleChoiceSelectField(fieldData, possibleValues, containerOptions, elementOptions, compact) {
    return this.renderField(this.renderHtmlSelect(fieldData.value, possibleValues, elementOptions), fieldData, compact);
  }

  renderActionField(fieldData, options, compact) {
    var fieldDataNoLabel = Util.copyObject(fieldData);
    fieldDataNoLabel.label = '';
    return this.renderField(this.renderHtmlButton(fieldData.label, options), fieldDataNoLabel, compact);
  }

  //

  renderField(input, fieldData, compact) {
    var labelPart;
    if (compact) {
      labelPart = '';
    } else {
      labelPart = this.renderLabel(fieldData.id, fieldData.label) + '\n';
    }

    var divBody = labelPart +
      input +
      '\n' +
      this.renderValidation(fieldData.validationId) +
      '\n';

    return HtmlUtil.renderTag('div', {'class': 'form-group'}, divBody, false);
  }

  renderHiddenFormGroup(input) {
    return HtmlUtil.renderTag('span', {'class': 'hidden-form-group', 'style': 'visibility: hidden; display: none'}, input, false);
  }

  renderLabel(forId, label) {
    return HtmlUtil.renderTag('label', {'for': forId}, label);
  }

  renderValidation(validationId) {
    return HtmlUtil.renderTag('div', {'class': 'text-danger', 'id': validationId});
  }

  renderSubformDecoration(subform, label, id, name) {
    var fieldsetBody = '\n';
    fieldsetBody += HtmlUtil.renderTag('legend', {}, label);
    fieldsetBody += subform;

    return HtmlUtil.renderTag('fieldset', { 'id': id }, fieldsetBody, false);
  }

  renderSubformListElement(subformElement, options) {
    var optionsWithClass = Util.copyProperties({'class': 'well'}, options);
    return HtmlUtil.renderTag('div', optionsWithClass, subformElement, false);
  }

  renderSubformTable(tableHeaders, cells, elementOptions) {
    var tableBody = this.renderSubformTableHeader(tableHeaders);
    tableBody += this.renderSubformTableBody(cells, elementOptions);

    return HtmlUtil.renderTag('table', {'class': 'table'}, tableBody, false);
  }

  private renderSubformTableHeader(tableHeaders) {
    var trBody = '';
    tableHeaders.forEach((header) => trBody += HtmlUtil.renderTag('th', {}, header));

    return HtmlUtil.renderTag('tr', {}, trBody, false);
  }

  private renderSubformTableBody(cells, elementOptions) {
    var html = '';
    for (var i = 0; i < cells.length; i++) {
      var row = cells[i];

      var trBody = '';
      for (var j = 0; j < row.length; j++) {
        trBody += HtmlUtil.renderTag('td', {}, row[j], false);
      }

      html += HtmlUtil.renderTag('tr', elementOptions, trBody, false) + '\n';
    }
    return html;
  }

  //

  renderHtmlInput(inputType, value, options) {
    var inputOptions = Util.copyProperties({'type': inputType, 'value': value}, options);
    return HtmlUtil.renderTag('input', inputOptions);
  }

  renderHtmlSelect(value, possibleValues, options) {
    var selectBody = '';
    Util.foreach(possibleValues, (i, v) => {
      var optionOptions = {'value': v.id};
      if (v.id === value) {
        optionOptions['selected'] = 'selected';
      }

      selectBody += HtmlUtil.renderTag('option', optionOptions, v.label);
    });

    var html = HtmlUtil.renderTag('select', options, selectBody, false);
    html += '\n';
    return html;
  }

  renderHtmlRadios(value, possibleValues, containerOptions, elementOptions) {
    return this.renderCheckable('radio', possibleValues, containerOptions, elementOptions,
      (v) => {
        return v.id === value;
      });
  }

  renderHtmlCheckboxes(value, possibleValues, containerOptions, elementOptions) {
    return this.renderCheckable('checkbox', possibleValues, containerOptions, elementOptions,
      (v) => {
        return value.indexOf(v.id) >= 0;
      });
  }

  renderHtmlTextarea(value, options) {
    return HtmlUtil.renderTag('textarea', options, value);
  }

  renderHtmlButton(label, options) {
    var allOptions = Util.copyProperties({'type': 'button'}, options);
    allOptions['class'] = allOptions['class'].replace('form-control', 'btn btn-default');
    return HtmlUtil.renderTag('button', allOptions, label);
  }

  private renderCheckable(inputType: string, possibleValues: SelectValue[],
    containerOptions: any, elementOptions: any, isChecked: (SelectValue) => boolean) {

    var html = '';
    Util.foreach(possibleValues, (i, v) => {
      var checkableOptions = Util.copyProperties({}, elementOptions);

      // for checkables we need to remove the form-control default class or they look ugly
      checkableOptions['class'] = checkableOptions['class'].replace('form-control', '');

      if (isChecked(v)) {
        checkableOptions['checked'] = 'checked';
      }

      checkableOptions['id'] = containerOptions['id'] + '.' + v.id;
      var labelBody = this.renderHtmlInput(inputType, v.id, checkableOptions);
      labelBody += HtmlUtil.renderTag('span', {}, v.label);

      var divBody = HtmlUtil.renderTag('label', {}, labelBody, false);
      html += HtmlUtil.renderTag('div', {'class': inputType}, divBody, false);
    });

    return HtmlUtil.renderTag('span', containerOptions, html, false);
  }

  //

  additionalFieldOptions() {
    return {'class': 'form-control'};
  }
}
