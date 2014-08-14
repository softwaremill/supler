$(document).ready(function () {
    $.get('/rest/form1.json', function (data) {
        showForm(data);
    });
});

var formContainer = document.getElementById("form-container");
var form = null;

function showForm(formJson) {
    form = new SuplerForm(formContainer, {});
    form.render(formJson);
}

var feedback = $("#feedback");
feedback.hide();

$("#submit").click(function () {
    $.ajax({
        url: "/rest/form1.json",
        type: "POST",
        data: JSON.stringify(form.getValue()),
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function (data) {
            feedback.html(data);
            feedback.show();
        }
    });

    return false;
});
var Greeter = (function () {
    function Greeter(greeting) {
        this.greeting = greeting;
    }
    Greeter.prototype.greet = function () {
        return "<h1>" + this.greeting + "</h1>";
    };
    return Greeter;
})();
;
var greeter = new Greeter("Siema bitches!");
console.log(greeter.greet());
var SuplerForm = (function () {
    function SuplerForm(container, customOptions) {
        this.container = container;
        this.options = {};
        this.idCounter = 0;
        this.options = new DefaultOptions(this);
        copyProperties(this.options, customOptions);
    }
    SuplerForm.prototype.render = function (formJson) {
        this.container.innerHTML = this.formFromJson(formJson);
    };

    SuplerForm.prototype.formFromJson = function (formJson) {
        var fields = formJson.fields;
        var html = "";
        for (var field in fields) {
            if (fields.hasOwnProperty(field)) {
                var fieldJson = fields[field];
                html += this.fieldFromJson(field, fieldJson) + "\n";
            }
        }

        return html;
    };

    SuplerForm.prototype.fieldFromJson = function (fieldName, fieldJson) {
        var fieldOptions = { "class": "form-control", "supler:fieldType": fieldJson.type, "supler:multiple": fieldJson.multiple };
        var id = this.nextId();

        switch (fieldJson.type) {
            case "string":
                return this.stringFieldFromJson(id, fieldName, fieldJson, fieldOptions);

            case "integer":
                return this.options.renderIntegerField(fieldJson.label, id, fieldName, fieldJson.value, fieldOptions);

            case "subform":
                return this.subformFieldFromJson(id, fieldName, fieldJson);

            default:
                return "";
        }
    };

    SuplerForm.prototype.stringFieldFromJson = function (id, fieldName, fieldJson, fieldOptions) {
        if (fieldJson.possible_values) {
            if (fieldJson.multiple) {
                return "";
            } else {
                return this.options.renderSingleChoiceSelectField(fieldJson.label, id, fieldName, fieldJson.value, fieldJson.possible_values, fieldOptions);
            }
        } else {
            return this.options.renderStringField(fieldJson.label, id, fieldName, fieldJson.value, fieldOptions);
        }
    };

    SuplerForm.prototype.subformFieldFromJson = function (id, fieldName, fieldJson) {
        var html = "";
        html += this.renderTag("fieldset", { "id": id, "name": fieldName }, false);
        html += "\n";
        html += "<legend>" + fieldJson.label + "</legend>\n";

        if (fieldJson.multiple) {
            for (var i in fieldJson.value) {
                html += this.renderTag("div", {
                    "class": "well",
                    "supler:fieldType": "subform",
                    "supler:fieldName": fieldName,
                    "supler:multiple": fieldJson.multiple }, false);
                html += this.formFromJson(fieldJson.value[i]);
                html += "</div>\n";
            }
        } else {
        }

        html += "</fieldset>\n";
        return html;
    };

    SuplerForm.prototype.getValue = function () {
        return this.getValueFrom(this.container);
    };

    SuplerForm.prototype.getValueFrom = function (element) {
        var children = element.childNodes;
        var result = {};

        function appendFieldValue(fieldName, fieldValue, multiple) {
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

        function isElement(o) {
            return (typeof HTMLElement === "object" ? o instanceof HTMLElement : o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string");
        }

        for (var i = 0; i < children.length; i++) {
            if (isElement(children[i])) {
                var fieldType = children[i].getAttribute("supler:fieldType");
                var multiple = children[i].getAttribute("supler:multiple") === "true";
                if (fieldType) {
                    var fieldName = children[i].getAttribute("name");
                    switch (fieldType) {
                        case "string":
                            appendFieldValue(fieldName, children[i].value, multiple);
                            break;

                        case "integer":
                            appendFieldValue(fieldName, parseInt(children[i].value), multiple);
                            break;

                        case "subform":
                            fieldName = children[i].getAttribute("supler:fieldName");
                            var subResult = this.getValueFrom(children[i]);
                            appendFieldValue(fieldName, subResult, multiple);
                            break;
                    }
                } else if (children[i].childNodes.length > 0) {
                    var childResult = this.getValueFrom(children[i]);
                    for (var field in childResult) {
                        if (childResult.hasOwnProperty(field)) {
                            appendFieldValue(field, childResult[field], multiple);
                        }
                    }
                }
            }
        }

        return result;
    };

    SuplerForm.prototype.renderTag = function (tagName, tagAttrs, voidTag) {
        var r = "<" + tagName + " ";
        for (var tagAttrName in tagAttrs) {
            if (tagAttrs.hasOwnProperty(tagAttrName) && tagAttrs[tagAttrName]) {
                r += tagAttrName + '="' + tagAttrs[tagAttrName] + '" ';
            }
        }

        if (voidTag) {
            r += "/>";
        } else {
            r += ">";
        }

        return r;
    };

    SuplerForm.prototype.nextId = function () {
        this.idCounter += 1;
        return "id" + this.idCounter;
    };
    return SuplerForm;
})();
;

var DefaultOptions = (function () {
    function DefaultOptions(form) {
        this.form = form;
    }
    DefaultOptions.prototype.renderStringField = function (label, id, name, value, options) {
        var self = this;
        return this.renderRhsField(function () {
            return self.renderHtmlInput("text", id, name, value, options);
        }, label, id);
    };

    DefaultOptions.prototype.renderIntegerField = function (label, id, name, value, options) {
        var self = this;
        return this.renderRhsField(function () {
            return self.renderHtmlInput("number", id, name, value, options);
        }, label, id);
    };

    DefaultOptions.prototype.renderDoubleField = function (label, id, name, value, options) {
        var self = this;
        return this.renderRhsField(function () {
            return self.renderHtmlInput("number", id, name, value, options);
        }, label, id);
    };

    DefaultOptions.prototype.renderBooleanField = function (label, id, name, value, options) {
        return "";
    };

    DefaultOptions.prototype.renderPasswordField = function (label, id, name, value, options) {
        var self = this;
        return this.renderRhsField(function () {
            return self.renderHtmlInput("password", id, name, value, options);
        }, label, id);
    };

    DefaultOptions.prototype.renderTextareaField = function (label, id, name, value, options) {
        return "";
    };

    DefaultOptions.prototype.renderMultiChoiceCheckboxField = function (label, id, name, values, possibleValues, options) {
        return "";
    };

    DefaultOptions.prototype.renderMultiChoiceSelectField = function (label, id, name, values, possibleValues, options) {
        return "";
    };

    DefaultOptions.prototype.renderSingleChoiceRadioField = function (label, id, name, value, possibleValues, options) {
        return "";
    };

    DefaultOptions.prototype.renderSingleChoiceSelectField = function (label, id, name, value, possibleValues, options) {
        var self = this;
        return this.renderRhsField(function () {
            return self.renderHtmlSelect(id, name, value, possibleValues, options);
        }, label, id);
    };

    DefaultOptions.prototype.renderRhsField = function (renderInput, label, id) {
        return '<div class="form-group">' + this.renderLabel(id, label) + "\n" + renderInput() + "\n" + this.renderValidation() + "\n" + '</div>';
    };

    DefaultOptions.prototype.renderLabel = function (forId, label) {
        return '<label for="' + forId + '">' + label + '</label>';
    };

    DefaultOptions.prototype.renderValidation = function () {
        return "";
    };

    DefaultOptions.prototype.renderHtmlInput = function (inputType, id, name, value, options) {
        return this.form.renderTag("input", copyProperties({ "id": id, "type": inputType, "name": name, "value": value }, options), true);
    };

    DefaultOptions.prototype.renderHtmlSelect = function (id, name, value, possibleValues, options) {
        var html = "";
        html += this.form.renderTag("select", copyProperties({ "id": id, "name": name }, options), false);
        html += "\n";
        for (var i in possibleValues) {
            var selected = "";
            if (possibleValues[i] === value) {
                selected = " selected ";
            }

            html += '<option value="' + possibleValues[i] + '"' + selected + '>';
            html += possibleValues[i];
            html += '</option>\n';
        }
        html += "</select>\n";
        return html;
    };
    return DefaultOptions;
})();

function copyProperties(to, from) {
    for (var k in from) {
        if (from.hasOwnProperty(k)) {
            to[k] = from[k];
        }
    }

    return to;
}
//# sourceMappingURL=supler.out.js.map
