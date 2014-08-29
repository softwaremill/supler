class ReadFormValues {
    getValueFrom(element) {
        var children = element.childNodes;
        var result = {};

        for (var i=0; i<children.length; i++) {
            if (this.isElement(children[i])) {
                var fieldType = children[i].getAttribute("supler:fieldType");
                var multiple = children[i].getAttribute("supler:multiple") === "true";
                if (fieldType) {
                    var fieldName = children[i].getAttribute("name");
                    switch (fieldType) {
                        case "string":
                            this.appendFieldValue(result, fieldName, children[i].value, multiple);
                            break;

                        case "integer":
                            this.appendFieldValue(result, fieldName, parseInt(children[i].value), multiple);
                            break;

                        case "subform":
                            // the name is on the fieldset, which is the parent, not on the per-form container.
                            fieldName = children[i].getAttribute("supler:fieldName");
                            var subResult = this.getValueFrom(children[i]);
                            this.appendFieldValue(result, fieldName, subResult, multiple);
                            break;
                    }
                } else if (children[i].childNodes.length > 0) {
                    // flattening
                    var childResult = this.getValueFrom(children[i]);
                    Util.foreach(childResult, (field, v) => {
                        this.appendFieldValue(result, field, v, multiple);
                    });
                }
            }
        }

        return result;
    }

    // http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
    private isElement(o) {
        return (typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string");
    }

    private appendFieldValue(result, fieldName, fieldValue, multiple) {
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
}