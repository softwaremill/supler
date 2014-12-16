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
    CreateFormFromJson.prototype.renderForm = function (formJson) {
        var _this = this;
        var fields = formJson.fields;
        var html = '';
        var elementDictionary = {};
        Util.foreach(fields, function (field, fieldJson) {
            var fieldResult = _this.fieldFromJson(field, fieldJson, elementDictionary, false);
            if (fieldResult) {
                html += fieldResult + '\n';
            }
        });

        return new RenderFormResult(html, elementDictionary);
    };

    CreateFormFromJson.prototype.fieldFromJson = function (fieldName, fieldJson, elementDictionary, compact) {
        var id = this.nextId();
        var validationId = this.nextId();

        var html = this.fieldHtmlFromJson(id, validationId, fieldName, fieldJson, elementDictionary, compact);

        if (html) {
            elementDictionary[id] = new ElementValidator(this.fieldValidatorFns(fieldJson));
            return html;
        } else {
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
                    validators.push(_this.validatorFnFactories[validatorName](validatorJson));
                }
            });
        }

        return validators;
    };

    CreateFormFromJson.prototype.fieldHtmlFromJson = function (id, validationId, fieldName, fieldJson, elementDictionary, compact) {
        var renderOptions = this.renderOptionsGetter.forField(fieldJson.path, fieldJson.type, this.getRenderHintName(fieldJson));

        var fieldOptions = Util.copyProperties({
            'supler:fieldName': fieldName,
            'supler:fieldType': fieldJson.type,
            'supler:multiple': fieldJson.multiple,
            'supler:validationId': validationId,
            'supler:path': fieldJson.path
        }, renderOptions.defaultFieldOptions());

        var label = this.labelFor(fieldJson.label);

        switch (fieldJson.type) {
            case FieldTypes.STRING:
                return this.stringFieldFromJson(renderOptions, label, id, fieldName, fieldJson, validationId, fieldOptions, compact);

            case FieldTypes.INTEGER:
                return renderOptions.renderIntegerField(label, id, validationId, fieldName, fieldJson.value, fieldOptions, compact);

            case FieldTypes.BOOLEAN:
                return this.booleanFieldFromJson(renderOptions, label, id, validationId, fieldName, fieldJson, fieldOptions, compact);

            case FieldTypes.SELECT:
                return this.selectFieldFromJson(renderOptions, label, id, validationId, fieldName, fieldJson, fieldOptions, compact);

            case FieldTypes.SUBFORM:
                return this.subformFieldFromJson(renderOptions, label, id, fieldName, fieldJson, elementDictionary);

            case FieldTypes.STATIC:
                return this.staticFieldFromJson(renderOptions, label, id, validationId, fieldJson, compact);

            case FieldTypes.ACTION:
                return this.actionFieldFromJson(renderOptions, label, id, fieldName, validationId, fieldOptions, compact);

            default:
                return null;
        }
    };

    CreateFormFromJson.prototype.stringFieldFromJson = function (renderOptions, label, id, fieldName, fieldJson, validationId, fieldOptions, compact) {
        var renderHintName = this.getRenderHintName(fieldJson);
        if (renderHintName === 'password') {
            return renderOptions.renderPasswordField(label, id, validationId, fieldName, fieldJson.value, fieldOptions, compact);
        } else if (renderHintName === 'textarea') {
            var fieldOptionsWithDim = Util.copyProperties({ rows: fieldJson.render_hint.rows, cols: fieldJson.render_hint.cols }, fieldOptions);
            return renderOptions.renderTextareaField(label, id, validationId, fieldName, fieldJson.value, fieldOptionsWithDim, compact);
        } else {
            return renderOptions.renderStringField(label, id, validationId, fieldName, fieldJson.value, fieldOptions, compact);
        }
    };

    CreateFormFromJson.prototype.booleanFieldFromJson = function (renderOptions, label, id, validationId, fieldName, fieldJson, fieldOptions, compact) {
        var possibleSelectValues = [
            new SelectValue(0, this.i18n.label_boolean_false()),
            new SelectValue(1, this.i18n.label_boolean_true())
        ];

        return renderOptions.renderSingleChoiceRadioField(label, id, validationId, fieldName, fieldJson.value ? 1 : 0, possibleSelectValues, fieldOptions, compact);
    };

    CreateFormFromJson.prototype.selectFieldFromJson = function (renderOptions, label, id, validationId, fieldName, fieldJson, fieldOptions, compact) {
        var _this = this;
        var renderHintName = this.getRenderHintName(fieldJson);

        var possibleSelectValues = fieldJson.possible_values.map(function (v) {
            return new SelectValue(v.index, _this.labelFor(v.label));
        });

        if (fieldJson.multiple) {
            return renderOptions.renderMultiChoiceCheckboxField(label, id, validationId, fieldName, fieldJson.value, possibleSelectValues, fieldOptions, compact);
        } else {
            if (!fieldJson.validate || !fieldJson.validate.required) {
                possibleSelectValues = [new SelectValue(null, "")].concat(possibleSelectValues);
            }

            if (renderHintName == 'radio') {
                return renderOptions.renderSingleChoiceRadioField(label, id, validationId, fieldName, fieldJson.value, possibleSelectValues, fieldOptions, compact);
            } else {
                return renderOptions.renderSingleChoiceSelectField(label, id, validationId, fieldName, fieldJson.value, possibleSelectValues, fieldOptions, compact);
            }
        }
    };

    CreateFormFromJson.prototype.subformFieldFromJson = function (renderOptions, label, id, fieldName, fieldJson, elementDictionary) {
        var _this = this;
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

                subformHtml += renderOptions.renderSubformListElement(subformResult.html, options);
            }
        } else {
            var headers = this.getTableHeaderLabels(fieldJson);
            var cells = [];

            for (var i = 0; i < fieldJson.value.length; i++) {
                var j = 0;
                cells[i] = [];

                var subfieldsJson = fieldJson.value[i].fields;
                Util.foreach(subfieldsJson, function (subfield, subfieldJson) {
                    cells[i][j] = _this.fieldFromJson(subfield, subfieldJson, elementDictionary, true);
                    j += 1;
                });
            }

            subformHtml += renderOptions.renderSubformTable(headers, cells, options);
        }

        return renderOptions.renderSubformDecoration(subformHtml, label, id, name);
    };

    CreateFormFromJson.prototype.staticFieldFromJson = function (renderOptions, label, id, validationId, fieldJson, compact) {
        var value = this.i18n.fromKeyAndParams(fieldJson.value.key, fieldJson.value.params);
        if (!value)
            value = '-';
        return renderOptions.renderStaticField(label, id, validationId, value, compact);
    };

    CreateFormFromJson.prototype.actionFieldFromJson = function (renderOptions, label, id, fieldName, validationId, fieldOptions, compact) {
        return renderOptions.renderActionField(label, id, validationId, fieldName, fieldOptions, compact);
    };

    CreateFormFromJson.prototype.getRenderHintName = function (fieldJson) {
        if (fieldJson.render_hint) {
            return fieldJson.render_hint.name;
        } else {
            return null;
        }
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
        } else {
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
    function RenderFormResult(html, elementDictionary) {
        this.html = html;
        this.elementDictionary = elementDictionary;
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
        } else {
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
                } else {
                    elementIdx -= 1;
                }
            } else {
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
        } else {
            return { pathPart: rawPathPart, elementIdx: 0 };
        }
    };
    return ElementSearch;
})();
var HtmlUtil = (function () {
    function HtmlUtil() {
    }
    HtmlUtil.renderTag = function (tagName, tagAttrs, tagBody, escapeTagBody) {
        if (typeof tagBody === "undefined") { tagBody = null; }
        if (typeof escapeTagBody === "undefined") { escapeTagBody = true; }
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
        } else if (fn) {
            return fn;
        } else {
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
        if (typeof selectedActionId === "undefined") { selectedActionId = null; }
        if (typeof result === "undefined") { result = {}; }
        var fieldType = element.getAttribute(SuplerAttributes.FIELD_TYPE);
        var multiple = element.getAttribute(SuplerAttributes.MULTIPLE) === "true";
        if (fieldType) {
            var fieldName = element.getAttribute("name");
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
        } else if (element.children.length > 0) {
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
        } else {
            return element.value;
        }
    };

    ReadFormValues.appendFieldValue = function (result, fieldName, fieldValue, multiple) {
        if (fieldValue !== null) {
            if (result[fieldName] && multiple) {
                result[fieldName].push(fieldValue);
            } else {
                if (multiple) {
                    result[fieldName] = [fieldValue];
                } else {
                    result[fieldName] = fieldValue;
                }
            }
        }
    };

    ReadFormValues.parseIntOrNull = function (v) {
        var p = parseInt(v);
        if (isNaN(p)) {
            return null;
        } else {
            return p;
        }
    };

    ReadFormValues.parseBooleanOrNull = function (v) {
        var p = parseInt(v);
        if (isNaN(p)) {
            return null;
        } else {
            return p === 1;
        }
    };
    return ReadFormValues;
})();
var ReloadController = (function () {
    function ReloadController(suplerForm, elementDictionary, options, elementSearch, validation) {
        this.suplerForm = suplerForm;
        this.elementDictionary = elementDictionary;
        this.options = options;
        this.elementSearch = elementSearch;
        this.validation = validation;
    }
    ReloadController.prototype.attachRefreshListeners = function () {
        var _this = this;
        this.ifEnabledForEachFormElement(function (formElement) {
            if (formElement.nodeName != "FIELDSET") {
                formElement.onchange = function () {
                    if (!_this.validation.processClientSingle(formElement.id)) {
                        _this.options.reloadFormFunction(_this.suplerForm.getValue(), _this.reloadSuccessFn());
                    }
                };
            }
        });
    };

    ReloadController.prototype.attachActionListeners = function () {
        var _this = this;
        this.ifEnabledForEachFormElement(function (formElement) {
            if (formElement.getAttribute(SuplerAttributes.FIELD_TYPE) === FieldTypes.ACTION) {
                formElement.onclick = function () {
                    if (!_this.validation.processClientSingle(formElement.id)) {
                        _this.options.reloadFormFunction(_this.suplerForm.getValue(formElement.id), _this.reloadSuccessFn());
                    }
                };
            }
        });
    };

    ReloadController.prototype.ifEnabledForEachFormElement = function (body) {
        if (this.options.reloadEnabled()) {
            Util.foreach(this.elementDictionary, function (elementId, validator) {
                var formElement = document.getElementById(elementId);
                if (formElement) {
                    body(formElement);
                }
            });
        }
    };

    ReloadController.prototype.reloadSuccessFn = function () {
        var _this = this;
        return function (data) {
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
        };
    };
    return ReloadController;
})();

var ReloadControllerOptions = (function () {
    function ReloadControllerOptions(options) {
        this.reloadFormFunction = options.reload_form_function;

        this.afterRenderFunction = options.after_render_function;
        if (!this.afterRenderFunction) {
            this.afterRenderFunction = function () {
            };
        }
    }
    ReloadControllerOptions.prototype.reloadEnabled = function () {
        return this.reloadFormFunction !== null;
    };
    return ReloadControllerOptions;
})();
var DefaultRenderOptions = (function () {
    function DefaultRenderOptions() {
    }
    DefaultRenderOptions.prototype.renderStringField = function (label, id, validationId, name, value, options, compact) {
        return this.renderField(this.renderHtmlInput('text', id, name, value, options), label, id, validationId, compact);
    };

    DefaultRenderOptions.prototype.renderIntegerField = function (label, id, validationId, name, value, options, compact) {
        return this.renderField(this.renderHtmlInput('number', id, name, value, options), label, id, validationId, compact);
    };

    DefaultRenderOptions.prototype.renderDoubleField = function (label, id, validationId, name, value, options, compact) {
        return this.renderField(this.renderHtmlInput('number', id, name, value, options), label, id, validationId, compact);
    };

    DefaultRenderOptions.prototype.renderPasswordField = function (label, id, validationId, name, value, options, compact) {
        return this.renderField(this.renderHtmlInput('password', id, name, value, options), label, id, validationId, compact);
    };

    DefaultRenderOptions.prototype.renderTextareaField = function (label, id, validationId, name, value, options, compact) {
        return this.renderField(this.renderHtmlTextarea(id, name, value, options), label, id, validationId, compact);
    };

    DefaultRenderOptions.prototype.renderStaticField = function (label, id, validationId, value, compact) {
        return this.renderField(this.renderStaticText(value), label, id, validationId, compact);
    };

    DefaultRenderOptions.prototype.renderStaticText = function (text) {
        return HtmlUtil.renderTag('div', { 'class': 'form-control-static' }, text);
    };

    DefaultRenderOptions.prototype.renderMultiChoiceCheckboxField = function (label, id, validationId, name, values, possibleValues, options, compact) {
        return this.renderField(this.renderHtmlCheckboxes(id, name, values, possibleValues, options), label, id, validationId, compact);
    };

    DefaultRenderOptions.prototype.renderMultiChoiceSelectField = function (label, id, validationId, name, values, possibleValues, options, compact) {
        return '';
    };

    DefaultRenderOptions.prototype.renderSingleChoiceRadioField = function (label, id, validationId, name, value, possibleValues, options, compact) {
        return this.renderField(this.renderHtmlRadios(id, name, value, possibleValues, options), label, id, validationId, compact);
    };

    DefaultRenderOptions.prototype.renderSingleChoiceSelectField = function (label, id, validationId, name, value, possibleValues, options, compact) {
        return this.renderField(this.renderHtmlSelect(id, name, value, possibleValues, options), label, id, validationId, compact);
    };

    DefaultRenderOptions.prototype.renderActionField = function (label, id, validationId, name, options, compact) {
        return this.renderField(this.renderButton(id, name, label, options), '', id, validationId, compact);
    };

    DefaultRenderOptions.prototype.renderField = function (input, label, id, validationId, compact) {
        var labelPart;
        if (compact) {
            labelPart = '';
        } else {
            labelPart = this.renderLabel(id, label) + '\n';
        }

        var divBody = labelPart + input + '\n' + this.renderValidation(validationId) + '\n';

        return HtmlUtil.renderTag('div', { 'class': 'form-group' }, divBody, false);
    };

    DefaultRenderOptions.prototype.renderLabel = function (forId, label) {
        return HtmlUtil.renderTag('label', { 'for': forId }, label);
    };

    DefaultRenderOptions.prototype.renderValidation = function (validationId) {
        return HtmlUtil.renderTag('div', { 'class': 'text-danger', 'id': validationId });
    };

    DefaultRenderOptions.prototype.renderSubformDecoration = function (subform, label, id, name) {
        var fieldsetBody = '\n';
        fieldsetBody += HtmlUtil.renderTag('legend', {}, label);
        fieldsetBody += subform;

        return HtmlUtil.renderTag('fieldset', { 'id': id, 'name': name }, fieldsetBody, false);
    };

    DefaultRenderOptions.prototype.renderSubformListElement = function (subformElement, options) {
        var optionsWithClass = Util.copyProperties({ 'class': 'well' }, options);
        return HtmlUtil.renderTag('div', optionsWithClass, subformElement, false);
    };

    DefaultRenderOptions.prototype.renderSubformTable = function (tableHeaders, cells, elementOptions) {
        var tableBody = this.renderSubformTableHeader(tableHeaders);
        tableBody += this.renderSubformTableBody(cells, elementOptions);

        return HtmlUtil.renderTag('table', { 'class': 'table' }, tableBody, false);
    };

    DefaultRenderOptions.prototype.renderSubformTableHeader = function (tableHeaders) {
        var trBody = '';
        tableHeaders.forEach(function (header) {
            return trBody += HtmlUtil.renderTag('th', {}, header);
        });

        return HtmlUtil.renderTag('tr', {}, trBody, false);
    };

    DefaultRenderOptions.prototype.renderSubformTableBody = function (cells, elementOptions) {
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

    DefaultRenderOptions.prototype.renderHtmlInput = function (inputType, id, name, value, options) {
        return HtmlUtil.renderTag('input', this.defaultHtmlInputOptions(inputType, id, name, value, options));
    };

    DefaultRenderOptions.prototype.renderHtmlSelect = function (id, name, value, possibleValues, options) {
        var selectBody = '';
        Util.foreach(possibleValues, function (i, v) {
            var optionOptions = { 'value': v.index };
            if (v.index === value) {
                optionOptions['selected'] = 'selected';
            }

            selectBody += HtmlUtil.renderTag('option', optionOptions, v.label);
        });

        var html = HtmlUtil.renderTag('select', Util.copyProperties({ 'id': id, 'name': name }, options), selectBody, false);
        html += '\n';
        return html;
    };

    DefaultRenderOptions.prototype.renderHtmlRadios = function (id, name, value, possibleValues, options) {
        return this.renderCheckable('radio', id, name, possibleValues, options, function (v) {
            return v.index === value;
        });
    };

    DefaultRenderOptions.prototype.renderHtmlCheckboxes = function (id, name, values, possibleValues, options) {
        return this.renderCheckable('checkbox', id, name, possibleValues, options, function (v) {
            return values.indexOf(v.index) >= 0;
        });
    };

    DefaultRenderOptions.prototype.renderHtmlTextarea = function (id, name, value, options) {
        return HtmlUtil.renderTag('textarea', this.defaultHtmlTextareaOptions(id, name, options), value);
    };

    DefaultRenderOptions.prototype.renderButton = function (id, name, label, options) {
        var allOptions = Util.copyProperties({ 'id': id, 'type': 'button', 'name': name }, options);
        allOptions['class'] = allOptions['class'].replace('form-control', 'btn btn-default');
        return HtmlUtil.renderTag('button', allOptions, label);
    };

    DefaultRenderOptions.prototype.renderCheckable = function (inputType, id, name, possibleValues, options, isChecked) {
        var _this = this;
        var html = '';
        Util.foreach(possibleValues, function (i, v) {
            var checkableOptions = Util.copyProperties({}, options);

            checkableOptions['class'] = checkableOptions['class'].replace('form-control', '');

            if (isChecked(v)) {
                checkableOptions['checked'] = 'checked';
            }

            var labelBody = _this.renderHtmlInput(inputType, id + '.' + v.index, name, v.index, checkableOptions);
            labelBody += HtmlUtil.renderTag('span', {}, v.label);

            var divBody = HtmlUtil.renderTag('label', {}, labelBody, false);
            html += HtmlUtil.renderTag('div', { 'class': inputType }, divBody, false);
        });

        return this.renderWithContainingElement(html, id, options);
    };

    DefaultRenderOptions.prototype.renderWithContainingElement = function (body, id, options) {
        var containerOptions = { 'id': id, 'supler:validationId': options[SuplerAttributes.VALIDATION_ID] };
        return HtmlUtil.renderTag('span', containerOptions, body, false);
    };

    DefaultRenderOptions.prototype.defaultFieldOptions = function () {
        return { 'class': 'form-control' };
    };

    DefaultRenderOptions.prototype.defaultHtmlInputOptions = function (inputType, id, name, value, options) {
        return Util.copyProperties({ 'id': id, 'type': inputType, 'name': name, 'value': value }, options);
    };

    DefaultRenderOptions.prototype.defaultHtmlTextareaOptions = function (id, name, options) {
        return Util.copyProperties({ 'id': id, 'name': name }, options);
    };
    return DefaultRenderOptions;
})();
var SuplerForm = (function () {
    function SuplerForm(container, customOptions) {
        this.container = container;
        this.i18n = new I18n();
        Util.copyProperties(this.i18n, customOptions);

        var renderOptions = new DefaultRenderOptions();
        Util.copyProperties(renderOptions, customOptions);
        this.renderOptionsGetter = new HTMLRenderTemplateParser(this.container).parse(renderOptions);

        this.validatorFnFactories = new DefaultValidatorFnFactories(this.i18n);
        Util.copyProperties(this.validatorFnFactories, customOptions);

        this.validatorRenderOptions = new ValidatorRenderOptions;
        Util.copyProperties(this.validatorRenderOptions, customOptions);

        this.reloadControllerOptions = new ReloadControllerOptions(customOptions);

        this.elementSearch = new ElementSearch(container);
    }
    SuplerForm.prototype.render = function (json) {
        var result = new CreateFormFromJson(this.renderOptionsGetter, this.i18n, this.validatorFnFactories).renderForm(json.main_form);
        this.container.innerHTML = result.html;
        this.validation = new Validation(this.elementSearch, result.elementDictionary, this.validatorRenderOptions, this.i18n);

        var reloadController = new ReloadController(this, result.elementDictionary, this.reloadControllerOptions, this.elementSearch, this.validation);
        reloadController.attachRefreshListeners();
        reloadController.attachActionListeners();

        this.validation.processServer(json.errors);

        this.reloadControllerOptions.afterRenderFunction();
    };

    SuplerForm.prototype.getValue = function (selectedActionId) {
        if (typeof selectedActionId === "undefined") { selectedActionId = null; }
        return ReadFormValues.getValueFrom(this.container, selectedActionId);
    };

    SuplerForm.prototype.validate = function () {
        return this.validation.processClient();
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
        } else
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
        } else
            return null;
    };

    SingleTemplateParser.parseFieldTemplate = function (element) {
        var template = element.innerHTML;
        return this.createModifierWithOverride(function () {
            this.renderField = function (input, label, id, validationId, compact) {
                var renderedLabel = compact ? '' : this.renderLabel(id, label);
                var renderedValidation = this.renderValidation(validationId);

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
            if (containsValueMapping) {
                delete attrs['value'];
            } else {
                attrs['value'] = value;
            }
        }

        function renderTemplateForAttrs(template, attrs, value) {
            adjustAttrsValueMapping(template, attrs, value);

            return template.replace(SUPLER_FIELD_INPUT_ATTRS, HtmlUtil.renderAttrs(attrs)).replace(SUPLER_FIELD_INPUT_ATTRS.toLowerCase(), HtmlUtil.renderAttrs(attrs)).replace(SUPLER_FIELD_INPUT_VALUE, value).replace(SUPLER_FIELD_INPUT_VALUE.toLowerCase(), value);
        }

        function renderTemplateWithPossibleValues(id, name, possibleValues, options, isSelected) {
            var singleInput = element.hasAttribute('super:singleInput') && (element.getAttribute('super:singleInput').toLowerCase() === 'true');

            var containerAttrs = Util.copyProperties({ 'id': id, 'name': name }, options);
            var possibleValueAttrs = singleInput ? {} : Util.copyProperties({ 'name': name }, options);

            var possibleValueTemplate = HtmlUtil.findElementWithAttr(element, 'supler:possibleValueTemplate').outerHTML;
            var renderedPossibleValues = '';
            Util.foreach(possibleValues, function (i, v) {
                var attrs = possibleValueAttrs;
                if (isSelected(v)) {
                    attrs = {};
                    Util.copyProperties(attrs, possibleValueAttrs);
                    attrs[element.getAttribute('supler:selectedAttrName')] = element.getAttribute('supler:selectedAttrValue');
                }

                renderedPossibleValues += renderTemplateForAttrs(possibleValueTemplate, attrs, v.index).replace('{{suplerFieldInputLabel}}', v.label);
            });

            return mainTemplate.replace(SUPLER_FIELD_CONTAINER_ATTRS, HtmlUtil.renderAttrs(containerAttrs)).replace(SUPLER_FIELD_CONTAINER_ATTRS.toLowerCase(), HtmlUtil.renderAttrs(containerAttrs)).replace(possibleValueTemplate, renderedPossibleValues);
        }

        return this.createModifierWithOverride(function () {
            this.defaultFieldOptions = function () {
                return {};
            };

            this.renderHtmlInput = function (inputType, id, name, value, options) {
                var attrs = this.defaultHtmlInputOptions(inputType, id, name, value, options);
                return renderTemplateForAttrs(mainTemplate, attrs, value);
            };

            this.renderHtmlTextarea = function (id, name, value, options) {
                var attrs = this.defaultHtmlTextareaOptions(id, name, options);
                return renderTemplateForAttrs(mainTemplate, attrs, value);
            };

            this.renderHtmlSelect = function (id, name, value, possibleValues, options) {
                return renderTemplateWithPossibleValues(id, name, possibleValues, options, function (v) {
                    return v.index === value;
                });
            };

            this.renderHtmlRadios = function (id, name, value, possibleValues, options) {
                return renderTemplateWithPossibleValues(id, name, possibleValues, options, function (v) {
                    return v.index === value;
                });
            };

            this.renderHtmlCheckboxes = function (id, name, values, possibleValues, options) {
                return renderTemplateWithPossibleValues(id, name, possibleValues, options, function (v) {
                    return values.indexOf(v.index) >= 0;
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
    function Validation(elementSearch, elementDictionary, validatorRenderOptions, i18n) {
        this.elementSearch = elementSearch;
        this.elementDictionary = elementDictionary;
        this.validatorRenderOptions = validatorRenderOptions;
        this.i18n = i18n;
        this.removeValidationFnDictionary = {};
    }
    Validation.prototype.processServer = function (validationJson) {
        this.removeValidationErrors();

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

    Validation.prototype.processClient = function () {
        var _this = this;
        this.removeValidationErrors();

        var hasErrors = false;

        Util.foreach(this.elementDictionary, function (elementId, validator) {
            hasErrors = hasErrors || _this.doProcessClientSingle(elementId, validator);
        });

        return hasErrors;
    };

    Validation.prototype.processClientSingle = function (elementId) {
        var removeFn = this.removeValidationFnDictionary[elementId];
        if (removeFn)
            removeFn();

        var validator = this.elementDictionary[elementId];
        if (validator)
            return this.doProcessClientSingle(elementId, validator);
        else
            return false;
    };

    Validation.prototype.doProcessClientSingle = function (elementId, validator) {
        var formElement = document.getElementById(elementId);
        var hasErrors = false;
        if (formElement) {
            var validationElement = this.lookupValidationElement(formElement);

            var errors = validator.validate(formElement);

            for (var i = 0; i < errors.length; i++) {
                this.appendValidation(errors[i], validationElement, formElement);
                hasErrors = true;
            }
        }

        return hasErrors;
    };

    Validation.prototype.lookupValidationElement = function (formElement) {
        var validationId = formElement.getAttribute("supler:validationId");
        return document.getElementById(validationId);
    };

    Validation.prototype.removeValidationErrors = function () {
        Util.foreach(this.removeValidationFnDictionary, function (elementId, removeFn) {
            removeFn();
        });

        this.removeValidationFnDictionary = {};
    };

    Validation.prototype.appendValidation = function (text, validationElement, formElement) {
        var _this = this;
        this.validatorRenderOptions.appendValidation(text, validationElement, formElement);

        this.removeValidationFnDictionary[formElement.id] = function () {
            _this.validatorRenderOptions.removeValidation(validationElement, formElement);
        };
    };
    return Validation;
})();

var DefaultValidatorFnFactories = (function () {
    function DefaultValidatorFnFactories(i18n) {
        this.i18n = i18n;
    }
    DefaultValidatorFnFactories.prototype.required = function (json) {
        var _this = this;
        return function (fieldValue) {
            if (json === true && (fieldValue === null || fieldValue.length == 0))
                return _this.i18n.error_valueRequired();
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
        } else {
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
//# sourceMappingURL=supler.out.js.map
