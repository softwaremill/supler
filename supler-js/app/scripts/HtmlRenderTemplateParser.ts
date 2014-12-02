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

    /**
     * Extracts a template-specific function to modify some parts of the render options basing on the
     * content of the template.
     */
    private extractRenderOptionsModifier(element: HTMLElement): RenderOptionsModifier {
        if (element.hasAttribute(HTMLRenderTemplateParser.FIELD_TEMPLATE)) {
            return this.extractFieldTemplate(element);
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
                    .replace('{{suplerValidation}}', renderedValidation)
            }
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

