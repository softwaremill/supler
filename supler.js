var FieldTypes = (function () {
    function FieldTypes() {
    }
    FieldTypes.STRING = 'string';
    FieldTypes.INTEGER = 'integer';
    FieldTypes.BOOLEAN = 'boolean';
    FieldTypes.SELECT = 'select';
    FieldTypes.SUBFORM = 'subform';
    FieldTypes.STATIC = 'static';
    FieldTypes.ACTION = 'action';
    return FieldTypes;
})();
var SuplerAttributes = (function () {
    function SuplerAttributes() {
    }
    SuplerAttributes.FIELD_TYPE = 'supler:fieldType';
    SuplerAttributes.MULTIPLE = 'supler:multiple';
    SuplerAttributes.FIELD_NAME = 'supler:fieldName';
    SuplerAttributes.VALIDATION_ID = 'supler:validationId';
    SuplerAttributes.PATH = 'supler:path';
    return SuplerAttributes;
})();
var CreateFormFromJson = (function () {
    function CreateFormFromJson(renderOptionsGetter, i18n, validatorFnFactories) {
        this.renderOptionsGetter = renderOptionsGetter;
        this.i18n = i18n;
        this.validatorFnFactories = validatorFnFactories;
        this.idCounter = 0;
    }
    CreateFormFromJson.prototype.renderForm = function (formJson, formElementDictionary) {
        var _this = this;
        if (formElementDictionary === void 0) { formElementDictionary = new FormElementDictionary(); }
        var fields = formJson.fields;
        var html = '';
        Util.foreach(fields, function (field, fieldJson) {
            var fieldResult = _this.fieldFromJson(field, fieldJson, formElementDictionary, false);
            if (fieldResult) {
                html += fieldResult + '\n';
            }
        });
        return new RenderFormResult(html, formElementDictionary);
    };
    CreateFormFromJson.prototype.fieldFromJson = function (fieldName, fieldJson, formElementDictionary, compact) {
        var id = this.nextId();
        var validationId = this.nextId();
        var fieldData = new FieldData(id, validationId, fieldName, fieldJson, this.labelFor(fieldJson.label));
        var html = this.fieldHtmlFromJson(fieldData, formElementDictionary, compact);
        if (html) {
            formElementDictionary.getElement(id).validator = new ElementValidator(this.fieldValidatorFns(fieldJson));
            return html;
        }
        else {
            return null;
        }
    };
    CreateFormFromJson.prototype.fieldValidatorFns = function (fieldJson) {
        var _this = this;
        var validators = [];
        var typeValidator = this.validatorFnFactories['type_' + fieldJson.type];
        if (typeValidator)
            validators.push(typeValidator.apply(this));
        var validatorsJson = fieldJson.validate;
        if (validatorsJson) {
            Util.foreach(validatorsJson, function (validatorName, validatorJson) {
                if (_this.validatorFnFactories[validatorName]) {
                    validators.push(_this.validatorFnFactories[validatorName](validatorJson, fieldJson));
                }
            });
        }
        return validators;
    };
    CreateFormFromJson.prototype.fieldHtmlFromJson = function (fieldData, formElementDictionary, compact) {
        var renderOptions = this.renderOptionsGetter.forField(fieldData.path, fieldData.type, fieldData.getRenderHintName());
        var fieldOptions = Util.copyProperties({
            'id': fieldData.id,
            'name': fieldData.path,
            'supler:fieldName': fieldData.name,
            'supler:fieldType': fieldData.type,
            'supler:multiple': fieldData.multiple,
            'supler:validationId': fieldData.validationId,
            'supler:path': fieldData.path
        }, renderOptions.additionalFieldOptions());
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
                return this.subformFieldFromJson(renderOptions, fieldData, formElementDictionary);
            case FieldTypes.STATIC:
                return this.staticFieldFromJson(renderOptions, fieldData, compact);
            case FieldTypes.ACTION:
                return this.actionFieldFromJson(renderOptions, fieldData, fieldOptions, formElementDictionary, compact);
            default:
                return null;
        }
    };
    CreateFormFromJson.prototype.stringFieldFromJson = function (renderOptions, fieldData, fieldOptions, compact) {
        if (fieldData.getRenderHintName() === 'password') {
            return renderOptions.renderPasswordField(fieldData, fieldOptions, compact);
        }
        else if (fieldData.getRenderHintName() === 'textarea') {
            var fieldOptionsWithDim = Util.copyProperties({ rows: fieldData.json.render_hint.rows, cols: fieldData.json.render_hint.cols }, fieldOptions);
            return renderOptions.renderTextareaField(fieldData, fieldOptionsWithDim, compact);
        }
        else {
            return renderOptions.renderStringField(fieldData, fieldOptions, compact);
        }
    };
    CreateFormFromJson.prototype.booleanFieldFromJson = function (renderOptions, fieldData, fieldOptions, compact) {
        var possibleSelectValues = [
            new SelectValue(0, this.i18n.label_boolean_false()),
            new SelectValue(1, this.i18n.label_boolean_true())
        ];
        fieldData.value = fieldData.value ? 1 : 0;
        return renderOptions.renderSingleChoiceRadioField(fieldData, possibleSelectValues, this.checkableContainerOptions(fieldData.id, fieldOptions), fieldOptions, compact);
    };
    CreateFormFromJson.prototype.selectFieldFromJson = function (renderOptions, fieldData, fieldOptions, compact) {
        var _this = this;
        var possibleSelectValues = fieldData.json.possible_values.map(function (v) { return new SelectValue(v.index, _this.labelFor(v.label)); });
        var containerOptions = this.checkableContainerOptions(fieldData.id, fieldOptions);
        if (fieldData.multiple) {
            return renderOptions.renderMultiChoiceCheckboxField(fieldData, possibleSelectValues, containerOptions, fieldOptions, compact);
        }
        else {
            var isRequired = fieldData.json.validate && fieldData.json.validate.required;
            var noValueSelected = fieldData.value === fieldData.json.empty_value;
            var isRadio = fieldData.getRenderHintName() === 'radio';
            if (!isRadio && (!isRequired || noValueSelected)) {
                possibleSelectValues = [new SelectValue(-1, "")].concat(possibleSelectValues);
            }
            if (isRadio) {
                return renderOptions.renderSingleChoiceRadioField(fieldData, possibleSelectValues, containerOptions, fieldOptions, compact);
            }
            else {
                return renderOptions.renderSingleChoiceSelectField(fieldData, possibleSelectValues, containerOptions, fieldOptions, compact);
            }
        }
    };
    CreateFormFromJson.prototype.checkableContainerOptions = function (id, elementOptions) {
        return {
            'id': id,
            'supler:validationId': elementOptions[SuplerAttributes.VALIDATION_ID],
            'supler:path': elementOptions[SuplerAttributes.PATH]
        };
    };
    CreateFormFromJson.prototype.subformFieldFromJson = function (renderOptions, fieldData, formElementDictionary) {
        var _this = this;
        var subformHtml = '';
        var options = {
            'supler:fieldType': FieldTypes.SUBFORM,
            'supler:fieldName': fieldData.name,
            'supler:multiple': fieldData.multiple
        };
        var values = fieldData.multiple ? fieldData.value : [fieldData.value];
        if (fieldData.getRenderHintName() === 'list') {
            for (var k in values) {
                var subformResult = this.renderForm(values[k], formElementDictionary);
                subformHtml += renderOptions.renderSubformListElement(subformResult.html, options);
            }
        }
        else {
            var headers = this.getTableHeaderLabels(fieldData.json);
            var cells = [];
            for (var i = 0; i < values.length; i++) {
                var j = 0;
                cells[i] = [];
                var subfieldsJson = values[i].fields;
                Util.foreach(subfieldsJson, function (subfield, subfieldJson) {
                    cells[i][j] = _this.fieldFromJson(subfield, subfieldJson, formElementDictionary, true);
                    j += 1;
                });
            }
            subformHtml += renderOptions.renderSubformTable(headers, cells, options);
        }
        return renderOptions.renderSubformDecoration(subformHtml, fieldData.label, fieldData.id, fieldData.name);
    };
    CreateFormFromJson.prototype.staticFieldFromJson = function (renderOptions, fieldData, compact) {
        var value = this.i18n.fromKeyAndParams(fieldData.value.key, fieldData.value.params);
        if (!value)
            value = '-';
        fieldData.value = value;
        return renderOptions.renderStaticField(fieldData, compact);
    };
    CreateFormFromJson.prototype.actionFieldFromJson = function (renderOptions, fieldData, fieldOptions, formElementDictionary, compact) {
        formElementDictionary.getElement(fieldData.id).validationScope = ValidationScopeParser.fromJson(fieldData.json.validation_scope);
        return renderOptions.renderActionField(fieldData, fieldOptions, compact);
    };
    CreateFormFromJson.prototype.getTableHeaderLabels = function (fieldJson) {
        var _this = this;
        if (fieldJson.value.length > 0) {
            var firstRow = fieldJson.value[0];
            var result = [];
            Util.foreach(firstRow.fields, function (fieldName, fieldValue) {
                if (fieldValue.type === FieldTypes.ACTION)
                    result.push('');
                else
                    result.push(_this.labelFor(fieldValue.label));
            });
            return result;
        }
        else {
            return [];
        }
    };
    CreateFormFromJson.prototype.labelFor = function (rawLabel) {
        return this.i18n.fromKeyAndParams(rawLabel, []);
    };
    CreateFormFromJson.prototype.nextId = function () {
        this.idCounter += 1;
        return 'id' + this.idCounter;
    };
    return CreateFormFromJson;
})();
var RenderFormResult = (function () {
    function RenderFormResult(html, formElementDictionary) {
        this.html = html;
        this.formElementDictionary = formElementDictionary;
    }
    return RenderFormResult;
})();
var ElementSearch = (function () {
    function ElementSearch(container) {
        this.container = container;
        this.idxPattern = /([^\[]+)\[(\d+)\]/;
    }
    ElementSearch.prototype.byPath = function (path) {
        return this.insideByPath(this.container, path.split("."));
    };
    ElementSearch.prototype.insideByPath = function (inside, path) {
        if (path.length === 0)
            return inside;
        var rawPathPart = path.shift();
        var element = this.searchForElement(inside, rawPathPart);
        if (element) {
            return this.insideByPath(element, path);
        }
        else {
            return null;
        }
    };
    ElementSearch.prototype.searchForElement = function (inside, rawPathPart) {
        var pathPartWithIndex = this.extractElementIdx(rawPathPart);
        var pathPart = pathPartWithIndex.pathPart;
        var elementIdx = pathPartWithIndex.elementIdx;
        var elementQueue = [inside];
        while (elementQueue.length > 0) {
            var currentElement = elementQueue.shift();
            if (currentElement.getAttribute(SuplerAttributes.FIELD_NAME) === pathPart) {
                if (elementIdx === 0) {
                    return currentElement;
                }
                else {
                    elementIdx -= 1;
                }
            }
            else {
                var chld = currentElement.children;
                for (var i = 0; i < chld.length; i++) {
                    elementQueue.push(chld[i]);
                }
            }
        }
        return null;
    };
    ElementSearch.prototype.extractElementIdx = function (rawPathPart) {
        var matchResult = this.idxPattern.exec(rawPathPart);
        if (matchResult && matchResult.length >= 3) {
            return { pathPart: matchResult[1], elementIdx: parseInt(matchResult[2]) };
        }
        else {
            return { pathPart: rawPathPart, elementIdx: 0 };
        }
    };
    return ElementSearch;
})();
var FieldData = (function () {
    function FieldData(id, validationId, name, json, label) {
        this.id = id;
        this.validationId = validationId;
        this.name = name;
        this.json = json;
        this.label = label;
        this.value = json.value;
        this.path = json.path;
        this.multiple = json.multiple;
        this.type = json.type;
    }
    FieldData.prototype.getRenderHintName = function () {
        if (this.json.render_hint) {
            return this.json.render_hint.name;
        }
        else {
            return null;
        }
    };
    return FieldData;
})();
var FormElement = (function () {
    function FormElement() {
    }
    return FormElement;
})();
var FormElementDictionary = (function () {
    function FormElementDictionary() {
        this.formElements = [];
    }
    FormElementDictionary.prototype.getElement = function (id) {
        var element = this.formElements[id];
        if (!element) {
            element = new FormElement();
            this.formElements[id] = element;
        }
        return element;
    };
    FormElementDictionary.prototype.foreach = function (fn) {
        Util.foreach(this.formElements, fn);
    };
    return FormElementDictionary;
})();
var HtmlUtil = (function () {
    function HtmlUtil() {
    }
    HtmlUtil.renderTag = function (tagName, tagAttrs, tagBody, escapeTagBody) {
        if (tagBody === void 0) { tagBody = null; }
        if (escapeTagBody === void 0) { escapeTagBody = true; }
        var r = '<' + tagName + ' ';
        r += HtmlUtil.renderAttrs(tagAttrs);
        r += '>';
        if (tagBody) {
            r += escapeTagBody ? HtmlUtil.escapeForAttribute(tagBody, true) : tagBody;
        }
        r += '</' + tagName + '>';
        return r;
    };
    HtmlUtil.renderAttrs = function (tagAttrs) {
        var r = '';
        Util.foreach(tagAttrs, function (tagAttrName, tagAttrValue) {
            if (tagAttrValue || tagAttrValue === 0 || tagAttrValue === '' || tagAttrValue === false) {
                r += tagAttrName + '="' + HtmlUtil.escapeForAttribute(tagAttrValue, false) + '" ';
            }
        });
        return r;
    };
    HtmlUtil.addClass = function (toElement, cls) {
        if (toElement.className.indexOf(cls) === -1) {
            toElement.className = toElement.className + ' ' + cls;
        }
    };
    HtmlUtil.removeClass = function (toElement, cls) {
        toElement.className = toElement.className.replace(cls, '');
    };
    HtmlUtil.escapeForAttribute = function (s, preserveCR) {
        preserveCR = preserveCR ? '&#13;' : '\n';
        return ('' + s).replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r\n/g, preserveCR).replace(/[\r\n]/g, preserveCR);
    };
    HtmlUtil.findElementWithAttr = function (where, attrName) {
        if (where.hasAttribute(attrName))
            return where;
        var len = where.children.length;
        for (var i = 0; i < len; i++) {
            var child = where.children[i];
            if (child.tagName) {
                var childResult = HtmlUtil.findElementWithAttr(child, attrName);
                if (childResult) {
                    return childResult;
                }
            }
        }
        throw 'No element with attribute ' + attrName + ' found!';
    };
    return HtmlUtil;
})();
var I18n = (function () {
    function I18n() {
    }
    I18n.prototype.fromKeyAndParams = function (errorKey, errorParams) {
        var fn = this[errorKey];
        if (fn && typeof (fn) == "function") {
            return fn.apply(this, errorParams);
        }
        else if (fn) {
            return fn;
        }
        else {
            return errorKey;
        }
    };
    I18n.prototype.error_valueRequired = function () {
        return "Value is required";
    };
    I18n.prototype.error_number_ge = function (than) {
        return "Must be greater or equal to " + than;
    };
    I18n.prototype.error_number_gt = function (than) {
        return "Must be greater than " + than;
    };
    I18n.prototype.error_number_le = function (than) {
        return "Must be less or equal to " + than;
    };
    I18n.prototype.error_number_lt = function (than) {
        return "Must be less than " + than;
    };
    I18n.prototype.error_length_tooShort = function (minLength) {
        return "Too short; minimum length: " + minLength;
    };
    I18n.prototype.error_length_tooLong = function (maxLength) {
        return "Too long; maximum length: " + maxLength;
    };
    I18n.prototype.error_type_number = function () {
        return "Must be a number";
    };
    I18n.prototype.label_boolean_true = function () {
        return "Yes";
    };
    I18n.prototype.label_boolean_false = function () {
        return "No";
    };
    return I18n;
})();
var ReadFormValues = (function () {
    function ReadFormValues() {
    }
    ReadFormValues.getValueFrom = function (element, selectedActionId, result) {
        if (selectedActionId === void 0) { selectedActionId = null; }
        if (result === void 0) { result = {}; }
        var fieldType = element.getAttribute(SuplerAttributes.FIELD_TYPE);
        var multiple = element.getAttribute(SuplerAttributes.MULTIPLE) === 'true';
        if (fieldType) {
            var fieldName = element.getAttribute(SuplerAttributes.FIELD_NAME);
            switch (fieldType) {
                case FieldTypes.STRING:
                    ReadFormValues.appendFieldValue(result, fieldName, this.getElementValue(element), multiple);
                    break;
                case FieldTypes.INTEGER:
                    ReadFormValues.appendFieldValue(result, fieldName, this.parseIntOrNull(this.getElementValue(element)), multiple);
                    break;
                case FieldTypes.SELECT:
                    ReadFormValues.appendFieldValue(result, fieldName, this.parseIntOrNull(this.getElementValue(element)), multiple);
                    break;
                case FieldTypes.BOOLEAN:
                    ReadFormValues.appendFieldValue(result, fieldName, this.parseBooleanOrNull(this.getElementValue(element)), multiple);
                    break;
                case FieldTypes.ACTION:
                    if (element.id === selectedActionId) {
                        ReadFormValues.appendFieldValue(result, fieldName, true, false);
                    }
                    break;
                case FieldTypes.SUBFORM:
                    fieldName = element.getAttribute(SuplerAttributes.FIELD_NAME);
                    var subResult = this.getValueFromChildren(element, selectedActionId, {});
                    ReadFormValues.appendFieldValue(result, fieldName, subResult, multiple);
                    break;
            }
        }
        else if (element.children.length > 0) {
            this.getValueFromChildren(element, selectedActionId, result);
        }
        return result;
    };
    ReadFormValues.getValueFromChildren = function (element, selectedActionId, result) {
        var children = element.children;
        for (var i = 0; i < children.length; i++) {
            this.getValueFrom(children[i], selectedActionId, result);
        }
        return result;
    };
    ReadFormValues.getElementValue = function (element) {
        if ((element.type === 'radio' || element.type === 'checkbox') && !element.checked) {
            return null;
        }
        else {
            return element.value;
        }
    };
    ReadFormValues.appendFieldValue = function (result, fieldName, fieldValue, multiple) {
        if (fieldValue !== null) {
            if (result[fieldName] && multiple) {
                result[fieldName].push(fieldValue);
            }
            else {
                if (multiple) {
                    result[fieldName] = [fieldValue];
                }
                else {
                    result[fieldName] = fieldValue;
                }
            }
        }
    };
    ReadFormValues.parseIntOrNull = function (v) {
        var p = parseInt(v);
        if (isNaN(p)) {
            return null;
        }
        else {
            return p;
        }
    };
    ReadFormValues.parseBooleanOrNull = function (v) {
        var p = parseInt(v);
        if (isNaN(p)) {
            return null;
        }
        else {
            return p === 1;
        }
    };
    return ReadFormValues;
})();
var Bootstrap3RenderOptions = (function () {
    function Bootstrap3RenderOptions() {
    }
    Bootstrap3RenderOptions.prototype.renderStringField = function (fieldData, options, compact) {
        return this.renderField(this.renderHtmlInput('text', fieldData.value, options), fieldData, compact);
    };
    Bootstrap3RenderOptions.prototype.renderIntegerField = function (fieldData, options, compact) {
        return this.renderField(this.renderHtmlInput('number', fieldData.value, options), fieldData, compact);
    };
    Bootstrap3RenderOptions.prototype.renderDoubleField = function (fieldData, options, compact) {
        return this.renderField(this.renderHtmlInput('number', fieldData.value, options), fieldData, compact);
    };
    Bootstrap3RenderOptions.prototype.renderPasswordField = function (fieldData, options, compact) {
        return this.renderField(this.renderHtmlInput('password', fieldData.value, options), fieldData, compact);
    };
    Bootstrap3RenderOptions.prototype.renderTextareaField = function (fieldData, options, compact) {
        return this.renderField(this.renderHtmlTextarea(fieldData.value, options), fieldData, compact);
    };
    Bootstrap3RenderOptions.prototype.renderStaticField = function (fieldData, compact) {
        return this.renderField(this.renderStaticText(fieldData.value), fieldData, compact);
    };
    Bootstrap3RenderOptions.prototype.renderStaticText = function (text) {
        return HtmlUtil.renderTag('div', { 'class': 'form-control-static' }, text);
    };
    Bootstrap3RenderOptions.prototype.renderMultiChoiceCheckboxField = function (fieldData, possibleValues, containerOptions, elementOptions, compact) {
        return this.renderField(this.renderHtmlCheckboxes(fieldData.value, possibleValues, containerOptions, elementOptions), fieldData, compact);
    };
    Bootstrap3RenderOptions.prototype.renderMultiChoiceSelectField = function (fieldData, possibleValues, containerOptions, elementOptions, compact) {
        return '';
    };
    Bootstrap3RenderOptions.prototype.renderSingleChoiceRadioField = function (fieldData, possibleValues, containerOptions, elementOptions, compact) {
        return this.renderField(this.renderHtmlRadios(fieldData.value, possibleValues, containerOptions, elementOptions), fieldData, compact);
    };
    Bootstrap3RenderOptions.prototype.renderSingleChoiceSelectField = function (fieldData, possibleValues, containerOptions, elementOptions, compact) {
        return this.renderField(this.renderHtmlSelect(fieldData.value, possibleValues, elementOptions), fieldData, compact);
    };
    Bootstrap3RenderOptions.prototype.renderActionField = function (fieldData, options, compact) {
        var fieldDataNoLabel = Util.copyObject(fieldData);
        fieldDataNoLabel.label = '';
        return this.renderField(this.renderHtmlButton(fieldData.label, options), fieldDataNoLabel, compact);
    };
    Bootstrap3RenderOptions.prototype.renderField = function (input, fieldData, compact) {
        var labelPart;
        if (compact) {
            labelPart = '';
        }
        else {
            labelPart = this.renderLabel(fieldData.id, fieldData.label) + '\n';
        }
        var divBody = labelPart + input + '\n' + this.renderValidation(fieldData.validationId) + '\n';
        return HtmlUtil.renderTag('div', { 'class': 'form-group' }, divBody, false);
    };
    Bootstrap3RenderOptions.prototype.renderLabel = function (forId, label) {
        return HtmlUtil.renderTag('label', { 'for': forId }, label);
    };
    Bootstrap3RenderOptions.prototype.renderValidation = function (validationId) {
        return HtmlUtil.renderTag('div', { 'class': 'text-danger', 'id': validationId });
    };
    Bootstrap3RenderOptions.prototype.renderSubformDecoration = function (subform, label, id, name) {
        var fieldsetBody = '\n';
        fieldsetBody += HtmlUtil.renderTag('legend', {}, label);
        fieldsetBody += subform;
        return HtmlUtil.renderTag('fieldset', { 'id': id }, fieldsetBody, false);
    };
    Bootstrap3RenderOptions.prototype.renderSubformListElement = function (subformElement, options) {
        var optionsWithClass = Util.copyProperties({ 'class': 'well' }, options);
        return HtmlUtil.renderTag('div', optionsWithClass, subformElement, false);
    };
    Bootstrap3RenderOptions.prototype.renderSubformTable = function (tableHeaders, cells, elementOptions) {
        var tableBody = this.renderSubformTableHeader(tableHeaders);
        tableBody += this.renderSubformTableBody(cells, elementOptions);
        return HtmlUtil.renderTag('table', { 'class': 'table' }, tableBody, false);
    };
    Bootstrap3RenderOptions.prototype.renderSubformTableHeader = function (tableHeaders) {
        var trBody = '';
        tableHeaders.forEach(function (header) { return trBody += HtmlUtil.renderTag('th', {}, header); });
        return HtmlUtil.renderTag('tr', {}, trBody, false);
    };
    Bootstrap3RenderOptions.prototype.renderSubformTableBody = function (cells, elementOptions) {
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
    };
    Bootstrap3RenderOptions.prototype.renderHtmlInput = function (inputType, value, options) {
        var inputOptions = Util.copyProperties({ 'type': inputType, 'value': value }, options);
        return HtmlUtil.renderTag('input', inputOptions);
    };
    Bootstrap3RenderOptions.prototype.renderHtmlSelect = function (value, possibleValues, options) {
        var selectBody = '';
        Util.foreach(possibleValues, function (i, v) {
            var optionOptions = { 'value': v.index };
            if (v.index === value) {
                optionOptions['selected'] = 'selected';
            }
            selectBody += HtmlUtil.renderTag('option', optionOptions, v.label);
        });
        var html = HtmlUtil.renderTag('select', options, selectBody, false);
        html += '\n';
        return html;
    };
    Bootstrap3RenderOptions.prototype.renderHtmlRadios = function (value, possibleValues, containerOptions, elementOptions) {
        return this.renderCheckable('radio', possibleValues, containerOptions, elementOptions, function (v) {
            return v.index === value;
        });
    };
    Bootstrap3RenderOptions.prototype.renderHtmlCheckboxes = function (value, possibleValues, containerOptions, elementOptions) {
        return this.renderCheckable('checkbox', possibleValues, containerOptions, elementOptions, function (v) {
            return value.indexOf(v.index) >= 0;
        });
    };
    Bootstrap3RenderOptions.prototype.renderHtmlTextarea = function (value, options) {
        return HtmlUtil.renderTag('textarea', options, value);
    };
    Bootstrap3RenderOptions.prototype.renderHtmlButton = function (label, options) {
        var allOptions = Util.copyProperties({ 'type': 'button' }, options);
        allOptions['class'] = allOptions['class'].replace('form-control', 'btn btn-default');
        return HtmlUtil.renderTag('button', allOptions, label);
    };
    Bootstrap3RenderOptions.prototype.renderCheckable = function (inputType, possibleValues, containerOptions, elementOptions, isChecked) {
        var _this = this;
        var html = '';
        Util.foreach(possibleValues, function (i, v) {
            var checkableOptions = Util.copyProperties({}, elementOptions);
            checkableOptions['class'] = checkableOptions['class'].replace('form-control', '');
            if (isChecked(v)) {
                checkableOptions['checked'] = 'checked';
            }
            checkableOptions['id'] = containerOptions['id'] + '.' + v.index;
            var labelBody = _this.renderHtmlInput(inputType, v.index, checkableOptions);
            labelBody += HtmlUtil.renderTag('span', {}, v.label);
            var divBody = HtmlUtil.renderTag('label', {}, labelBody, false);
            html += HtmlUtil.renderTag('div', { 'class': inputType }, divBody, false);
        });
        return HtmlUtil.renderTag('span', containerOptions, html, false);
    };
    Bootstrap3RenderOptions.prototype.additionalFieldOptions = function () {
        return { 'class': 'form-control' };
    };
    return Bootstrap3RenderOptions;
})();
var SendController = (function () {
    function SendController(suplerForm, formElementDictionary, options, elementSearch, validation) {
        this.suplerForm = suplerForm;
        this.formElementDictionary = formElementDictionary;
        this.options = options;
        this.elementSearch = elementSearch;
        this.validation = validation;
        this.refreshCounter = 0;
        this.actionInProgress = false;
    }
    SendController.prototype.attachRefreshListeners = function () {
        var _this = this;
        this.ifEnabledForEachFormElement(function (htmlFormElement) {
            if (htmlFormElement.nodeName != "FIELDSET") {
                htmlFormElement.onchange = function () { return _this.refreshListenerFor(htmlFormElement); };
            }
        });
    };
    SendController.prototype.attachActionListeners = function () {
        var _this = this;
        this.ifEnabledForEachFormElement(function (htmlFormElement) {
            if (htmlFormElement.getAttribute(SuplerAttributes.FIELD_TYPE) === FieldTypes.ACTION) {
                htmlFormElement.onclick = function () { return _this.actionListenerFor(htmlFormElement); };
            }
        });
    };
    SendController.prototype.refreshListenerFor = function (htmlFormElement) {
        var _this = this;
        if (!this.actionInProgress && !this.validation.processClientSingle(htmlFormElement.id)) {
            this.refreshCounter += 1;
            var thisRefreshNumber = this.refreshCounter;
            var applyRefreshResultsCondition = function () {
                return !_this.actionInProgress && thisRefreshNumber === _this.refreshCounter;
            };
            this.options.sendFormFunction(this.suplerForm.getValue(), this.sendSuccessFn(applyRefreshResultsCondition, function () {
            }), function () {
            }, false, htmlFormElement);
        }
    };
    SendController.prototype.actionListenerFor = function (htmlFormElement) {
        var _this = this;
        if (!this.actionInProgress) {
            this.actionInProgress = true;
            var id = htmlFormElement.id;
            var validationPassed = !this.validation.processClientSingle(id) && !this.validation.processClient(this.formElementDictionary.getElement(id).validationScope);
            if (validationPassed) {
                this.options.sendFormFunction(this.suplerForm.getValue(id), this.sendSuccessFn(function () {
                    return true;
                }, function () { return _this.actionCompleted(); }), function () { return _this.actionCompleted(); }, true, htmlFormElement);
            }
            else {
                this.actionCompleted();
            }
        }
    };
    SendController.prototype.actionCompleted = function () {
        this.actionInProgress = false;
    };
    SendController.prototype.ifEnabledForEachFormElement = function (body) {
        if (this.options.sendEnabled()) {
            this.formElementDictionary.foreach(function (elementId, formElement) {
                var htmlFormElement = document.getElementById(elementId);
                if (htmlFormElement) {
                    body(htmlFormElement);
                }
            });
        }
    };
    SendController.prototype.sendSuccessFn = function (applyResultsCondition, onComplete) {
        var _this = this;
        return function (data) {
            if (applyResultsCondition()) {
                var focusOnPath;
                var activeElement = document.activeElement;
                if (activeElement) {
                    focusOnPath = activeElement.getAttribute(SuplerAttributes.PATH);
                }
                _this.suplerForm.render(data);
                if (focusOnPath) {
                    var focusOnElement = _this.elementSearch.byPath(focusOnPath);
                    if (focusOnElement) {
                        focusOnElement.focus();
                    }
                }
            }
            onComplete();
        };
    };
    return SendController;
})();
var SendControllerOptions = (function () {
    function SendControllerOptions(options) {
        this.sendFormFunction = options.send_form_function;
    }
    SendControllerOptions.prototype.sendEnabled = function () {
        return this.sendFormFunction !== null;
    };
    return SendControllerOptions;
})();
var SuplerForm = (function () {
    function SuplerForm(container, customOptions) {
        this.container = container;
        customOptions = customOptions || {};
        this.i18n = new I18n();
        Util.copyProperties(this.i18n, customOptions.i18n);
        var renderOptions = new Bootstrap3RenderOptions();
        Util.copyProperties(renderOptions, customOptions.render_options);
        this.renderOptionsGetter = new HTMLRenderTemplateParser(this.container).parse(renderOptions);
        this.validatorFnFactories = new DefaultValidatorFnFactories(this.i18n);
        Util.copyProperties(this.validatorFnFactories, customOptions.validators);
        this.validatorRenderOptions = new ValidatorRenderOptions;
        Util.copyProperties(this.validatorRenderOptions, customOptions.validation_render);
        this.sendControllerOptions = new SendControllerOptions(customOptions);
        this.elementSearch = new ElementSearch(container);
        this.afterRenderFn = customOptions.after_render_function || (function () {
        });
        this.customDataHandlerFn = customOptions.custom_data_handler || (function (data) {
        });
    }
    SuplerForm.prototype.render = function (json) {
        if (this.isSuplerForm(json)) {
            var result = new CreateFormFromJson(this.renderOptionsGetter, this.i18n, this.validatorFnFactories).renderForm(json.main_form);
            this.container.innerHTML = result.html;
            this.initializeValidation(result.formElementDictionary, json);
            var sendController = new SendController(this, result.formElementDictionary, this.sendControllerOptions, this.elementSearch, this.validation);
            sendController.attachRefreshListeners();
            sendController.attachActionListeners();
        }
        var customData = this.getCustomData(json);
        if (customData)
            this.customDataHandlerFn(customData);
        this.afterRenderFn();
    };
    SuplerForm.prototype.initializeValidation = function (formElementDictionary, json) {
        var oldValidation = this.validation;
        this.validation = new Validation(this.elementSearch, formElementDictionary, this.validatorRenderOptions, this.i18n);
        this.validation.processServer(json.errors);
        if (oldValidation) {
            this.validation.copyFrom(oldValidation);
        }
    };
    SuplerForm.prototype.getValue = function (selectedActionId) {
        if (selectedActionId === void 0) { selectedActionId = null; }
        return ReadFormValues.getValueFrom(this.container, selectedActionId);
    };
    SuplerForm.prototype.validate = function (validationScope) {
        if (validationScope === void 0) { validationScope = ValidateAll; }
        return this.validation.processClient(validationScope);
    };
    SuplerForm.prototype.getCustomData = function (json) {
        if (this.isSuplerForm(json)) {
            return json.custom_data;
        }
        else {
            return json;
        }
    };
    SuplerForm.prototype.isSuplerForm = function (json) {
        return json.is_supler_form === true;
    };
    return SuplerForm;
})();
var Util = (function () {
    function Util() {
    }
    Util.foreach = function (obj, fn) {
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                fn(k, obj[k]);
            }
        }
    };
    Util.copyProperties = function (to, from) {
        Util.foreach(from, function (k, v) {
            to[k] = v;
        });
        return to;
    };
    Util.getSingleProperty = function (obj) {
        var result = null;
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                if (result != null) {
                    throw "Multiple properties in " + obj + ", while a single property was expected!";
                }
                result = obj[k];
            }
        }
        return result;
    };
    Util.find = function (arr, predicate) {
        for (var i = 0; i < arr.length; i++) {
            if (predicate(arr[i])) {
                return arr[i];
            }
        }
        return null;
    };
    Util.copyObject = function (object) {
        var objectCopy = {};
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                objectCopy[key] = object[key];
            }
        }
        return objectCopy;
    };
    Util.deepEqual = function (x, y) {
        if (x === y)
            return true;
        if (!(x instanceof Object) || !(x instanceof Object))
            return false;
        if (x.constructor !== y.constructor)
            return false;
        for (var p in x) {
            if (!x.hasOwnProperty(p))
                continue;
            if (!y.hasOwnProperty(p))
                return false;
            if (x[p] === y[p])
                continue;
            if (typeof (x[p]) !== 'object')
                return false;
            if (!this.deepEqual(x[p], y[p]))
                return false;
        }
        for (p in y) {
            if (y.hasOwnProperty(p) && !x.hasOwnProperty(p))
                return false;
        }
        return true;
    };
    return Util;
})();
var SelectValue = (function () {
    function SelectValue(index, label) {
        this.index = index;
        this.label = label;
    }
    return SelectValue;
})();
var AllFieldMatcher = (function () {
    function AllFieldMatcher() {
    }
    AllFieldMatcher.prototype.matches = function (path, type, renderHintName) {
        return true;
    };
    return AllFieldMatcher;
})();
var CompositeFieldMatcher = (function () {
    function CompositeFieldMatcher(m1, m2) {
        this.m1 = m1;
        this.m2 = m2;
    }
    CompositeFieldMatcher.prototype.matches = function (path, type, renderHintName) {
        return this.m1.matches(path, type, renderHintName) && this.m2.matches(path, type, renderHintName);
    };
    return CompositeFieldMatcher;
})();
var PathFieldMatcher = (function () {
    function PathFieldMatcher(path) {
        this.path = path;
    }
    PathFieldMatcher.prototype.matches = function (path, type, renderHintName) {
        return this.path === path;
    };
    return PathFieldMatcher;
})();
var TypeFieldMatcher = (function () {
    function TypeFieldMatcher(type) {
        this.type = type;
    }
    TypeFieldMatcher.prototype.matches = function (path, type, renderHintName) {
        return this.type === type;
    };
    return TypeFieldMatcher;
})();
var RenderHintFieldMatcher = (function () {
    function RenderHintFieldMatcher(renderHintName) {
        this.renderHintName = renderHintName;
    }
    RenderHintFieldMatcher.prototype.matches = function (path, type, renderHintName) {
        return this.renderHintName === renderHintName;
    };
    return RenderHintFieldMatcher;
})();
var FieldMatcherParser = (function () {
    function FieldMatcherParser() {
    }
    FieldMatcherParser.parseMatcher = function (element) {
        var current = new AllFieldMatcher();
        if (element.hasAttribute(FieldMatcherParser.FIELD_PATH_MATCHER)) {
            current = new CompositeFieldMatcher(current, new PathFieldMatcher(element.getAttribute(FieldMatcherParser.FIELD_PATH_MATCHER)));
        }
        if (element.hasAttribute(FieldMatcherParser.FIELD_TYPE_MATCHER)) {
            current = new CompositeFieldMatcher(current, new TypeFieldMatcher(element.getAttribute(FieldMatcherParser.FIELD_TYPE_MATCHER)));
        }
        if (element.hasAttribute(FieldMatcherParser.FIELD_RENDERHINT_MATCHER)) {
            current = new CompositeFieldMatcher(current, new RenderHintFieldMatcher(element.getAttribute(FieldMatcherParser.FIELD_RENDERHINT_MATCHER)));
        }
        return current;
    };
    FieldMatcherParser.FIELD_PATH_MATCHER = 'supler:fieldPath';
    FieldMatcherParser.FIELD_TYPE_MATCHER = 'supler:fieldType';
    FieldMatcherParser.FIELD_RENDERHINT_MATCHER = 'supler:fieldRenderHint';
    return FieldMatcherParser;
})();
var HTMLRenderTemplateParser = (function () {
    function HTMLRenderTemplateParser(container) {
        this.container = container;
    }
    HTMLRenderTemplateParser.prototype.parse = function (fallbackRenderOptions) {
        var templates = [];
        for (var i = 0; i < this.container.children.length; i++) {
            var child = this.container.children[i];
            if (child.tagName) {
                var template = this.parseElement(child);
                if (template) {
                    templates.push(template);
                }
            }
        }
        return new RenderOptionsGetter(fallbackRenderOptions, templates);
    };
    HTMLRenderTemplateParser.prototype.parseElement = function (element) {
        var rom = SingleTemplateParser.parseRenderOptionsModifier(element);
        if (rom) {
            return new HTMLRenderTemplate(FieldMatcherParser.parseMatcher(element), rom);
        }
        else
            return null;
    };
    return HTMLRenderTemplateParser;
})();
var HTMLRenderTemplate = (function () {
    function HTMLRenderTemplate(matcher, renderOptionsModifier) {
        this.matcher = matcher;
        this.renderOptionsModifier = renderOptionsModifier;
    }
    return HTMLRenderTemplate;
})();
var RenderOptionsGetter = (function () {
    function RenderOptionsGetter(fallbackRenderOptions, templates) {
        this.fallbackRenderOptions = fallbackRenderOptions;
        this.templates = templates;
    }
    RenderOptionsGetter.prototype.forField = function (path, type, renderHintName) {
        var current = this.fallbackRenderOptions;
        for (var i = 0; i < this.templates.length; i++) {
            var template = this.templates[i];
            if (template.matcher.matches(path, type, renderHintName)) {
                current = template.renderOptionsModifier(current);
            }
        }
        return current;
    };
    return RenderOptionsGetter;
})();
var SingleTemplateParser = (function () {
    function SingleTemplateParser() {
    }
    SingleTemplateParser.parseRenderOptionsModifier = function (element) {
        if (element.hasAttribute(this.FIELD_TEMPLATE)) {
            return this.parseFieldTemplate(element);
        }
        if (element.hasAttribute(this.FIELD_LABEL_TEMPLATE)) {
            return this.parseFieldLabelTemplate(element);
        }
        if (element.hasAttribute(this.FIELD_VALIDATION_TEMPLATE)) {
            return this.parseFieldValidationTemplate(element);
        }
        if (element.hasAttribute(this.FIELD_INPUT_TEMPLATE)) {
            return this.parseFieldInputTemplate(element);
        }
        else
            return null;
    };
    SingleTemplateParser.parseFieldTemplate = function (element) {
        var template = element.innerHTML;
        return this.createModifierWithOverride(function () {
            this.renderField = function (input, fieldData, compact) {
                var renderedLabel = compact ? '' : this.renderLabel(fieldData.id, fieldData.label);
                var renderedValidation = this.renderValidation(fieldData.validationId);
                return template.replace('{{suplerLabel}}', renderedLabel).replace('{{suplerInput}}', input).replace('{{suplerValidation}}', renderedValidation);
            };
        });
    };
    SingleTemplateParser.parseFieldLabelTemplate = function (element) {
        var template = element.innerHTML;
        return this.createModifierWithOverride(function () {
            this.renderLabel = function (forId, label) {
                return template.replace('{{suplerLabelForId}}', forId).replace('{{suplerLabelText}}', label);
            };
        });
    };
    SingleTemplateParser.parseFieldValidationTemplate = function (element) {
        var template = element.innerHTML;
        return this.createModifierWithOverride(function () {
            this.renderValidation = function (validationId) {
                return template.replace('{{suplerValidationId}}', validationId);
            };
        });
    };
    SingleTemplateParser.parseFieldInputTemplate = function (element) {
        var mainTemplate = element.innerHTML;
        var SUPLER_FIELD_INPUT_ATTRS = '{{suplerFieldInputAttrs}}';
        var SUPLER_FIELD_INPUT_VALUE = '{{suplerFieldInputValue}}';
        var SUPLER_FIELD_CONTAINER_ATTRS = '{{suplerFieldInputContainerAttrs}}';
        function adjustAttrsValueMapping(template, attrs, value) {
            var containsValueMapping = template.indexOf(SUPLER_FIELD_INPUT_VALUE) > -1;
            if ((value === null) || containsValueMapping) {
                delete attrs['value'];
            }
            else {
                attrs['value'] = value;
            }
        }
        function renderTemplateForAttrs(template, attrs, value) {
            adjustAttrsValueMapping(template, attrs, value);
            return template.replace(SUPLER_FIELD_INPUT_ATTRS, HtmlUtil.renderAttrs(attrs)).replace(SUPLER_FIELD_INPUT_ATTRS.toLowerCase(), HtmlUtil.renderAttrs(attrs)).replace(SUPLER_FIELD_INPUT_VALUE, value).replace(SUPLER_FIELD_INPUT_VALUE.toLowerCase(), value);
        }
        function renderTemplateWithPossibleValues(possibleValues, containerOptions, elementOptions, isSelected) {
            var singleInput = element.hasAttribute('super:singleInput') && (element.getAttribute('super:singleInput').toLowerCase() === 'true');
            if (singleInput) {
                containerOptions = elementOptions;
            }
            var possibleValueTemplate = HtmlUtil.findElementWithAttr(element, 'supler:possibleValueTemplate').outerHTML;
            var renderedPossibleValues = '';
            Util.foreach(possibleValues, function (i, v) {
                var attrs = Util.copyProperties({}, elementOptions);
                attrs['id'] = elementOptions['id'] + '.' + v.index;
                if (isSelected(v)) {
                    attrs[element.getAttribute('supler:selectedAttrName')] = element.getAttribute('supler:selectedAttrValue');
                }
                renderedPossibleValues += renderTemplateForAttrs(possibleValueTemplate, attrs, v.index).replace('{{suplerFieldInputLabel}}', v.label);
            });
            return mainTemplate.replace(SUPLER_FIELD_CONTAINER_ATTRS, HtmlUtil.renderAttrs(containerOptions)).replace(SUPLER_FIELD_CONTAINER_ATTRS.toLowerCase(), HtmlUtil.renderAttrs(containerOptions)).replace(possibleValueTemplate, renderedPossibleValues);
        }
        return this.createModifierWithOverride(function () {
            this.additionalFieldOptions = function () {
                return {};
            };
            this.renderHtmlInput = function (inputType, value, options) {
                var attrs = Util.copyProperties({ 'type': inputType }, options);
                return renderTemplateForAttrs(mainTemplate, attrs, value);
            };
            this.renderHtmlTextarea = function (value, options) {
                return renderTemplateForAttrs(mainTemplate, options, value);
            };
            this.renderHtmlButton = function (label, options) {
                return renderTemplateForAttrs(mainTemplate, options, null);
            };
            this.renderHtmlSelect = function (value, possibleValues, containerOptions, elementOptions) {
                return renderTemplateWithPossibleValues(possibleValues, containerOptions, elementOptions, function (v) {
                    return v.index === value;
                });
            };
            this.renderHtmlRadios = function (value, possibleValues, containerOptions, elementOptions) {
                return renderTemplateWithPossibleValues(possibleValues, containerOptions, elementOptions, function (v) {
                    return v.index === value;
                });
            };
            this.renderHtmlCheckboxes = function (value, possibleValues, containerOptions, elementOptions) {
                return renderTemplateWithPossibleValues(possibleValues, containerOptions, elementOptions, function (v) {
                    return value.indexOf(v.index) >= 0;
                });
            };
        });
    };
    SingleTemplateParser.createModifierWithOverride = function (Override) {
        return function (renderOptions) {
            Override.prototype = renderOptions;
            return (new Override());
        };
    };
    SingleTemplateParser.FIELD_TEMPLATE = 'supler:fieldTemplate';
    SingleTemplateParser.FIELD_LABEL_TEMPLATE = 'supler:fieldLabelTemplate';
    SingleTemplateParser.FIELD_VALIDATION_TEMPLATE = 'supler:fieldValidationTemplate';
    SingleTemplateParser.FIELD_INPUT_TEMPLATE = 'supler:fieldInputTemplate';
    return SingleTemplateParser;
})();
var ElementValidator = (function () {
    function ElementValidator(validatorFns) {
        this.validatorFns = validatorFns;
    }
    ElementValidator.prototype.validate = function (element) {
        var value = Util.getSingleProperty(ReadFormValues.getValueFrom(element));
        var errors = [];
        for (var i = 0; i < this.validatorFns.length; i++) {
            var r = this.validatorFns[i](value);
            if (r)
                errors.push(r);
        }
        return errors;
    };
    return ElementValidator;
})();
var Validation = (function () {
    function Validation(elementSearch, formElementDictionary, validatorRenderOptions, i18n) {
        this.elementSearch = elementSearch;
        this.formElementDictionary = formElementDictionary;
        this.validatorRenderOptions = validatorRenderOptions;
        this.i18n = i18n;
        this.addedValidations = {};
    }
    Validation.prototype.processServer = function (validationJson) {
        this.removeAllValidationErrors();
        if (validationJson) {
            for (var i = 0; i < validationJson.length; i++) {
                var validationErrorJson = validationJson[i];
                var fieldPath = validationErrorJson.field_path;
                var formElement = this.elementSearch.byPath(fieldPath);
                var validationElement = this.lookupValidationElement(formElement);
                this.appendValidation(this.i18n.fromKeyAndParams(validationErrorJson.error_key, validationErrorJson.error_params), validationElement, formElement);
            }
        }
        return validationJson && validationJson.length > 0;
    };
    Validation.prototype.processClient = function (validationScope) {
        var _this = this;
        this.removeAllValidationErrors();
        var hasErrors = false;
        this.formElementDictionary.foreach(function (elementId, formElement) {
            var htmlFormElement = document.getElementById(elementId);
            if (htmlFormElement && validationScope.shouldValidate(htmlFormElement.getAttribute(SuplerAttributes.PATH))) {
                hasErrors = _this.doProcessClientSingle(htmlFormElement, formElement.validator) || hasErrors;
            }
        });
        return hasErrors;
    };
    Validation.prototype.processClientSingle = function (elementId) {
        this.removeSingleValidationErrors(elementId);
        var validator = this.formElementDictionary.getElement(elementId).validator;
        var htmlFormElement = document.getElementById(elementId);
        if (htmlFormElement && validator)
            return this.doProcessClientSingle(htmlFormElement, validator);
        else
            return false;
    };
    Validation.prototype.doProcessClientSingle = function (htmlFormElement, validator) {
        var hasErrors = false;
        var validationElement = this.lookupValidationElement(htmlFormElement);
        var errors = validator.validate(htmlFormElement);
        for (var i = 0; i < errors.length; i++) {
            this.appendValidation(errors[i], validationElement, htmlFormElement);
            hasErrors = true;
        }
        return hasErrors;
    };
    Validation.prototype.lookupValidationElement = function (formElement) {
        var validationId = formElement.getAttribute(SuplerAttributes.VALIDATION_ID);
        return document.getElementById(validationId);
    };
    Validation.prototype.removeAllValidationErrors = function () {
        Util.foreach(this.addedValidations, function (elementId, addedValidation) {
            addedValidation.remove();
        });
        this.addedValidations = {};
    };
    Validation.prototype.removeSingleValidationErrors = function (elementId) {
        var addedValidation = this.addedValidations[elementId];
        if (addedValidation) {
            addedValidation.remove();
            delete this.addedValidations[elementId];
        }
    };
    Validation.prototype.appendValidation = function (text, validationElement, formElement) {
        if (!this.addedValidations.hasOwnProperty(formElement.id)) {
            this.addedValidations[formElement.id] = new AddedValidation(this.validatorRenderOptions, formElement, validationElement);
        }
        var addedValidation = this.addedValidations[formElement.id];
        if (addedValidation.addText(text)) {
            this.validatorRenderOptions.appendValidation(text, validationElement, formElement);
        }
    };
    Validation.prototype.copyFrom = function (other) {
        var _this = this;
        Util.foreach(other.addedValidations, function (otherElementId, otherAddedValidation) {
            var newFormElement = _this.elementSearch.byPath(otherAddedValidation.formElementPath());
            if (newFormElement) {
                if (Util.deepEqual(otherAddedValidation.invalidValue, ReadFormValues.getValueFrom(newFormElement))) {
                    var newValidationElement = _this.lookupValidationElement(newFormElement);
                    otherAddedValidation.texts.forEach(function (text) {
                        _this.appendValidation(text, newValidationElement, newFormElement);
                    });
                }
            }
        });
    };
    return Validation;
})();
var AddedValidation = (function () {
    function AddedValidation(validatorRenderOptions, formElement, validationElement) {
        this.validatorRenderOptions = validatorRenderOptions;
        this.formElement = formElement;
        this.validationElement = validationElement;
        this.texts = [];
        this.invalidValue = ReadFormValues.getValueFrom(formElement);
    }
    AddedValidation.prototype.addText = function (text) {
        if (this.texts.indexOf(text) === -1) {
            this.texts.push(text);
            return true;
        }
        else {
            return false;
        }
    };
    AddedValidation.prototype.formElementPath = function () {
        return this.formElement.getAttribute(SuplerAttributes.PATH);
    };
    AddedValidation.prototype.remove = function () {
        this.validatorRenderOptions.removeValidation(this.validationElement, this.formElement);
    };
    return AddedValidation;
})();
var _ValidateAll = (function () {
    function _ValidateAll() {
    }
    _ValidateAll.prototype.shouldValidate = function (path) {
        return true;
    };
    return _ValidateAll;
})();
var ValidateAll = new _ValidateAll();
var _ValidateNone = (function () {
    function _ValidateNone() {
    }
    _ValidateNone.prototype.shouldValidate = function (path) {
        return false;
    };
    return _ValidateNone;
})();
var ValidateNone = new _ValidateNone();
var ValidateInPath = (function () {
    function ValidateInPath(rootPath) {
        this.rootPath = rootPath;
    }
    ValidateInPath.prototype.shouldValidate = function (path) {
        return path && ((path === this.rootPath) || (path.indexOf(this.rootPath + '.') === 0) || (path.indexOf(this.rootPath + '[') === 0));
    };
    return ValidateInPath;
})();
var ValidationScopeParser = (function () {
    function ValidationScopeParser() {
    }
    ValidationScopeParser.fromJson = function (json) {
        switch (json.name) {
            case 'none':
                return ValidateNone;
            case 'all':
                return ValidateAll;
            case 'path':
                return new ValidateInPath(json.path);
            default:
                return ValidateNone;
        }
    };
    return ValidationScopeParser;
})();
var DefaultValidatorFnFactories = (function () {
    function DefaultValidatorFnFactories(i18n) {
        this.i18n = i18n;
    }
    DefaultValidatorFnFactories.prototype.required = function (json, fieldJson) {
        var _this = this;
        return function (fieldValue) {
            if (json === true && (fieldValue === null || fieldValue.length == 0 || fieldValue === fieldJson.empty_value)) {
                return _this.i18n.error_valueRequired();
            }
            else
                return null;
        };
    };
    DefaultValidatorFnFactories.prototype.ge = function (json) {
        var _this = this;
        return function (fieldValue) {
            if (parseInt(fieldValue) >= json)
                return null;
            else
                return _this.i18n.error_number_ge(json);
        };
    };
    DefaultValidatorFnFactories.prototype.gt = function (json) {
        var _this = this;
        return function (fieldValue) {
            if (parseInt(fieldValue) > json)
                return null;
            else
                return _this.i18n.error_number_gt(json);
        };
    };
    DefaultValidatorFnFactories.prototype.le = function (json) {
        var _this = this;
        return function (fieldValue) {
            if (parseInt(fieldValue) <= json)
                return null;
            else
                return _this.i18n.error_number_le(json);
        };
    };
    DefaultValidatorFnFactories.prototype.lt = function (json) {
        var _this = this;
        return function (fieldValue) {
            if (parseInt(fieldValue) < json)
                return null;
            else
                return _this.i18n.error_number_lt(json);
        };
    };
    DefaultValidatorFnFactories.prototype.type_integer = function () {
        var _this = this;
        return function (fieldValue) {
            if (parseInt(fieldValue) === fieldValue)
                return null;
            else
                return _this.i18n.error_type_number();
        };
    };
    return DefaultValidatorFnFactories;
})();
var ValidatorRenderOptions = (function () {
    function ValidatorRenderOptions() {
    }
    ValidatorRenderOptions.prototype.appendValidation = function (text, validationElement, formElement) {
        var current = validationElement.innerHTML;
        if (current && current.length > 0) {
            validationElement.innerHTML = current + '; ' + text;
        }
        else {
            validationElement.innerHTML = text;
        }
        HtmlUtil.addClass(formElement.parentElement, 'has-error');
    };
    ValidatorRenderOptions.prototype.removeValidation = function (validationElement, formElement) {
        validationElement.innerHTML = '';
        HtmlUtil.removeClass(formElement.parentElement, 'has-error');
    };
    return ValidatorRenderOptions;
})();
//# sourceMappingURL=supler.js.map