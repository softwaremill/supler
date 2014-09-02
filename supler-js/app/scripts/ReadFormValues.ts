class ReadFormValues {
    getValueFrom(element) {
        var children = element.children;
        var result = {};

        for (var i=0; i<children.length; i++) {
            var fieldType = children[i].getAttribute("supler:fieldType");
            var multiple = children[i].getAttribute("supler:multiple") === "true";
            if (fieldType) {
                var fieldName = children[i].getAttribute("name");
                switch (fieldType) {
                    case FieldTypes.STRING:
                        this.appendFieldValue(result, fieldName, children[i].value, multiple);
                        break;

                    case FieldTypes.INTEGER:
                        this.appendFieldValue(result, fieldName, parseInt(children[i].value), multiple);
                        break;

                    case FieldTypes.SUBFORM:
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

        return result;
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