class SuplerForm {
    options:any = {};
    idCounter:number = 0;

    constructor(public container:HTMLDivElement, customOptions:any) {
        this.options = new DefaultRenderOptions();
        Util.copyProperties(this.options, customOptions);
    }

    render(formJson) {
        this.container.innerHTML = this.formFromJson(formJson);
    }

    formFromJson(formJson) {
        var fields = formJson.fields;
        var html = "";
        Util.foreach(fields, (field, fieldJson) => {
            html += this.fieldFromJson(field, fieldJson) + "\n";
        });

        return html;
    }

    fieldFromJson(fieldName, fieldJson) {
        var fieldOptions = { "class": "form-control", "supler:fieldType": fieldJson.type, "supler:multiple": fieldJson.multiple };
        var id = this.nextId();

        switch(fieldJson.type) {
            case "string":
                return this.stringFieldFromJson(id, fieldName, fieldJson, fieldOptions);

            case "integer":
                return this.options.renderIntegerField(fieldJson.label, id, fieldName, fieldJson.value, fieldOptions);

            case "subform":
                return this.subformFieldFromJson(id, fieldName, fieldJson);

            default:
                return "";
        }
    }

    stringFieldFromJson(id, fieldName, fieldJson, fieldOptions) {
        if (fieldJson.possible_values) {
            if (fieldJson.multiple) {
                return "";
            } else {
                return this.options.renderSingleChoiceSelectField(fieldJson.label, id, fieldName, fieldJson.value,
                    fieldJson.possible_values, fieldOptions);
            }
        } else {
            return this.options.renderStringField(fieldJson.label, id, fieldName, fieldJson.value, fieldOptions);
        }
    }

    subformFieldFromJson(id, fieldName, fieldJson) {
        var html = "";
        html += HtmlUtil.renderTag("fieldset", {"id": id, "name": fieldName }, false);
        html += "\n";
        html += "<legend>" + fieldJson.label + "</legend>\n";

        if (fieldJson.multiple) {
            for (var i in fieldJson.value) {
                html += HtmlUtil.renderTag("div", {
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
    }

    getValue() {
        return this.getValueFrom(this.container);
    }

    getValueFrom(element) {
        var children = element.childNodes;
        var result = {};

        function appendFieldValue(fieldName, fieldValue, multiple) {
            if (result[fieldName] && multiple) {
                result[fieldName].push(fieldValue);
            } else {
                if (multiple) {
                    result[fieldName] = [ fieldValue ];
                } else {
                    result[fieldName] = fieldValue;
                }
            }
        }

        // http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
        function isElement(o){
            return (
                    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
                o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
                );
        }

        for (var i=0; i<children.length; i++) {
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
                            // the name is on the fieldset, which is the parent, not on the per-form container.
                            fieldName = children[i].getAttribute("supler:fieldName");
                            var subResult = this.getValueFrom(children[i]);
                            appendFieldValue(fieldName, subResult, multiple);
                            break;
                    }
                } else if (children[i].childNodes.length > 0) {
                    // flattening
                    var childResult = this.getValueFrom(children[i]);
                    Util.foreach(childResult, (field, v) => {
                        appendFieldValue(field, v, multiple);
                    });
                }
            }
        }

        return result;
    }

    nextId() {
        this.idCounter += 1;
        return "id" + this.idCounter;
    }
}

