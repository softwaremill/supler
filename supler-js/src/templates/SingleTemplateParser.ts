class SingleTemplateParser {
    private static FIELD_TEMPLATE = 'supler:fieldTemplate';
    private static FIELD_LABEL_TEMPLATE = 'supler:fieldLabelTemplate';
    private static FIELD_VALIDATION_TEMPLATE = 'supler:fieldValidationTemplate';
    private static FIELD_INPUT_TEMPLATE = 'supler:fieldInputTemplate';

    /**
     * Extracts a template-specific function to modify some parts of the render options basing on the
     * content of the template.
     */
    static parseRenderOptionsModifier(element: HTMLElement): RenderOptionsModifier {
        if (element.hasAttribute(this.FIELD_TEMPLATE)) {
            return this.parseFieldTemplate(element);
        } if (element.hasAttribute(this.FIELD_LABEL_TEMPLATE)) {
            return this.parseFieldLabelTemplate(element);
        } if (element.hasAttribute(this.FIELD_VALIDATION_TEMPLATE)) {
            return this.parseFieldValidationTemplate(element);
        } if (element.hasAttribute(this.FIELD_INPUT_TEMPLATE)) {
            return this.parseFieldInputTemplate(element);
        } else return null;
    }

    private static parseFieldTemplate(element: HTMLElement): RenderOptionsModifier {
        var template = element.innerHTML;
        return this.createModifierWithOverride(function() {
            this.renderField = function(input: string, label: string, id: string, validationId: string, compact: boolean) {
                var renderedLabel = compact ? '' : this.renderLabel(id, label);
                var renderedValidation = this.renderValidation(validationId);

                return template
                    .replace('{{suplerLabel}}', renderedLabel)
                    .replace('{{suplerInput}}', input)
                    .replace('{{suplerValidation}}', renderedValidation);
            };
        })
    }

    private static parseFieldLabelTemplate(element: HTMLElement): RenderOptionsModifier {
        var template = element.innerHTML;
        return this.createModifierWithOverride(function() {
            this.renderLabel = function(forId: string, label: string) {
                return template
                    .replace('{{suplerLabelForId}}', forId)
                    .replace('{{suplerLabelText}}', label);
            };
        })
    }

    private static parseFieldValidationTemplate(element: HTMLElement): RenderOptionsModifier {
        var template = element.innerHTML;
        return this.createModifierWithOverride(function() {
            this.renderValidation = function(validationId: string) {
                return template.replace('{{suplerValidationId}}', validationId);
            };
        })
    }

    private static parseFieldInputTemplate(element: HTMLElement): RenderOptionsModifier {
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
            // when getting the inner html the attribute names are lower-cased. Not sure if it's like that in all
            // browsers, though.
            return template
                .replace(SUPLER_FIELD_INPUT_ATTRS, HtmlUtil.renderAttrs(attrs))
                .replace(SUPLER_FIELD_INPUT_ATTRS.toLowerCase(), HtmlUtil.renderAttrs(attrs))
                .replace(SUPLER_FIELD_INPUT_VALUE, value)
                .replace(SUPLER_FIELD_INPUT_VALUE.toLowerCase(), value);
        }

        function renderTemplateWithPossibleValues(id, name, possibleValues, options, isSelected: (SelectValue) => boolean) {
            var singleInput = element.hasAttribute('super:singleInput') &&
                (element.getAttribute('super:singleInput').toLowerCase() === 'true');

            var containerAttrs = Util.copyProperties({ 'id': id, 'name': name }, options);
            var possibleValueAttrs = singleInput ? {} : Util.copyProperties({ 'name': name }, options);

            var possibleValueTemplate = HtmlUtil.findElementWithAttr(element, 'supler:possibleValueTemplate').outerHTML;
            var renderedPossibleValues = '';
            Util.foreach(possibleValues, (i, v) => {
                var attrs = possibleValueAttrs;
                if (isSelected(v)) {
                    attrs = {};
                    Util.copyProperties(attrs, possibleValueAttrs);
                    attrs[element.getAttribute('supler:selectedAttrName')] = element.getAttribute('supler:selectedAttrValue');
                }

                renderedPossibleValues +=
                    renderTemplateForAttrs(possibleValueTemplate, attrs, v.index)
                        .replace('{{suplerFieldInputLabel}}', v.label);
            });

            return mainTemplate
                .replace(SUPLER_FIELD_CONTAINER_ATTRS, HtmlUtil.renderAttrs(containerAttrs))
                .replace(SUPLER_FIELD_CONTAINER_ATTRS.toLowerCase(), HtmlUtil.renderAttrs(containerAttrs))
                .replace(possibleValueTemplate, renderedPossibleValues);
        }

        return this.createModifierWithOverride(function() {
            this.defaultFieldOptions = function() { return { }; };

            // no possible values
            this.renderHtmlInput = function(inputType: string, id: string, name: string, value: any, options: any): string {
                var attrs = this.defaultHtmlInputOptions(inputType, id, name, value, options);
                return renderTemplateForAttrs(mainTemplate, attrs, value);
            };

            this.renderHtmlTextarea = function(id: string, name: string, value: any, options: any): string {
                var attrs = this.defaultHtmlTextareaOptions(id, name, options);
                return renderTemplateForAttrs(mainTemplate, attrs, value);
            };

            // possible values
            this.renderHtmlSelect = function(id: string, name: string, value: string, possibleValues: SelectValue[], options: any): string {
                return renderTemplateWithPossibleValues(id, name, possibleValues, options, (v) => { return v.index === value; });
            };

            this.renderHtmlRadios = function(id: string, name: string, value: number, possibleValues: SelectValue[], options: any): string {
                return renderTemplateWithPossibleValues(id, name, possibleValues, options, (v) => { return v.index === value; });
            };

            this.renderHtmlCheckboxes = function(id: string, name: string, values: number[], possibleValues: SelectValue[], options: any): string {
                return renderTemplateWithPossibleValues(id, name, possibleValues, options, (v) => { return values.indexOf(v.index) >= 0; });
            };
        })
    }

    /**
     * Creates a function to create a `RenderOptions` instance using the methods defined in the `Override`
     * class, falling back to the given `RenderOptions`.
     */
    private static createModifierWithOverride(Override): RenderOptionsModifier {
        return (renderOptions: RenderOptions) => {
            Override.prototype = renderOptions;
            return <RenderOptions>(new Override());
        }
    }
}

interface RenderOptionsModifier {
    (renderOptions: RenderOptions): RenderOptions
}
