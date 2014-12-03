class HTMLRenderTemplateParser {
    constructor(private container: HTMLElement) {}

    /**
     * Looks for HTML templates inside the container and returns an object allowing to get render options
     * for a particular field.
     */
    parse(fallbackRenderOptions: RenderOptions): RenderOptionsGetter {
        var templates = [ ];
        for (var i=0; i<this.container.children.length; i++) {
            var child = this.container.children[i];
            if (child.tagName) {
                var template = this.parseElement(<HTMLElement>child);
                if (template) {
                    templates.push(template);
                }
            }
        }

        return new RenderOptionsGetter(fallbackRenderOptions, templates);
    }

    private parseElement(element: HTMLElement): HTMLRenderTemplate {
        var rom = this.extractRenderOptionsModifier(element);
        if (rom) {
            return new HTMLRenderTemplate(this.extractMatcher(element), rom);
        } else return null;
    }

    private static FIELD_TEMPLATE = 'supler:fieldTemplate';
    private static FIELD_LABEL_TEMPLATE = 'supler:fieldLabelTemplate';
    private static FIELD_VALIDATION_TEMPLATE = 'supler:fieldValidationTemplate';
    private static FIELD_INPUT_TEMPLATE = 'supler:fieldInputTemplate';

    /**
     * Extracts a template-specific function to modify some parts of the render options basing on the
     * content of the template.
     */
    private extractRenderOptionsModifier(element: HTMLElement): RenderOptionsModifier {
        if (element.hasAttribute(HTMLRenderTemplateParser.FIELD_TEMPLATE)) {
            return this.extractFieldTemplate(element);
        } if (element.hasAttribute(HTMLRenderTemplateParser.FIELD_LABEL_TEMPLATE)) {
            return this.extractFieldLabelTemplate(element);
        } if (element.hasAttribute(HTMLRenderTemplateParser.FIELD_VALIDATION_TEMPLATE)) {
            return this.extractFieldValidationTemplate(element);
        } if (element.hasAttribute(HTMLRenderTemplateParser.FIELD_INPUT_TEMPLATE)) {
            return this.extractFieldInputTemplate(element);
        } else return null;
    }

    private extractFieldTemplate(element: HTMLElement): RenderOptionsModifier {
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

    private extractFieldLabelTemplate(element: HTMLElement): RenderOptionsModifier {
        var template = element.innerHTML;
        return this.createModifierWithOverride(function() {
            this.renderLabel = function(forId: string, label: string) {
                return template
                    .replace('{{suplerLabelForId}}', forId)
                    .replace('{{suplerLabelText}}', label);
            };
        })
    }

    private extractFieldValidationTemplate(element: HTMLElement): RenderOptionsModifier {
        var template = element.innerHTML;
        return this.createModifierWithOverride(function() {
            this.renderValidation = function(validationId: string) {
                return template.replace('{{suplerValidationId}}', validationId);
            };
        })
    }

    private extractFieldInputTemplate(element: HTMLElement): RenderOptionsModifier {
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
    private createModifierWithOverride(Override): RenderOptionsModifier {
        return (renderOptions: RenderOptions) => {
            Override.prototype = renderOptions;
            return <RenderOptions>(new Override());
        }
    }

    private static FIELD_PATH_MATCHER = 'supler:fieldPath';
    private static FIELD_TYPE_MATCHER = 'supler:fieldType';
    private static FIELD_RENDERHINT_MATCHER = 'supler:fieldRenderHint';

    /**
     * Extracts a field matcher which will determine if a template is applicable for a particular field.
     */
    private extractMatcher(element: HTMLElement): FieldMatcher {
        var current = new AllFieldMatcher();
        if (element.hasAttribute(HTMLRenderTemplateParser.FIELD_PATH_MATCHER)) {
            current = new CompositeFieldMatcher(current,
                new PathFieldMatcher(element.getAttribute(HTMLRenderTemplateParser.FIELD_PATH_MATCHER)))
        }
        if (element.hasAttribute(HTMLRenderTemplateParser.FIELD_TYPE_MATCHER)) {
            current = new CompositeFieldMatcher(current,
                new TypeFieldMatcher(element.getAttribute(HTMLRenderTemplateParser.FIELD_TYPE_MATCHER)))
        }
        if (element.hasAttribute(HTMLRenderTemplateParser.FIELD_RENDERHINT_MATCHER)) {
            current = new CompositeFieldMatcher(current,
                new RenderHintFieldMatcher(element.getAttribute(HTMLRenderTemplateParser.FIELD_RENDERHINT_MATCHER)))
        }
        return current;
    }
}

class HTMLRenderTemplate {
    constructor(public matcher: FieldMatcher, public renderOptionsModifier: RenderOptionsModifier) {}
}

interface RenderOptionsModifier {
    (renderOptions: RenderOptions): RenderOptions
}

class RenderOptionsGetter {
    constructor(private fallbackRenderOptions: RenderOptions, private templates: HTMLRenderTemplate[]) {}

    /**
     * Applies all matching render templates for the given field to the default render options.
     * Hence if a template is defined later, it has priority.
     */
    forField(path: string, type: string, renderHintName: string): RenderOptions {
        var current = this.fallbackRenderOptions;
        for (var i=0; i<this.templates.length; i++) {
            var template = this.templates[i];
            if (template.matcher.matches(path, type, renderHintName)) {
                current = template.renderOptionsModifier(current);
            }
        }

        return current;
    }
}

interface FieldMatcher {
    matches(path: string, type: string, renderHintName: string): boolean
}

class AllFieldMatcher implements FieldMatcher {
    matches(path: string, type: string, renderHintName: string): boolean { return true; }
}

class CompositeFieldMatcher implements FieldMatcher {
    constructor(private m1: FieldMatcher, private m2: FieldMatcher) {}
    matches(path: string, type: string, renderHintName: string): boolean {
        return this.m1.matches(path, type, renderHintName) && this.m2.matches(path, type, renderHintName);
    }
}

class PathFieldMatcher implements FieldMatcher {
    constructor(private path: string) {}
    matches(path: string, type: string, renderHintName: string): boolean { return this.path === path; }
}

class TypeFieldMatcher implements FieldMatcher {
    constructor(private type: string) {}
    matches(path: string, type: string, renderHintName: string): boolean { return this.type === type; }
}

class RenderHintFieldMatcher implements FieldMatcher {
    constructor(private renderHintName: string) {}
    matches(path: string, type: string, renderHintName: string): boolean { return this.renderHintName === renderHintName; }
}

