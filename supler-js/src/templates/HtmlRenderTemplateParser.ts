module Supler {
  export class HTMLRenderTemplateParser {
    constructor(private container:HTMLElement) {
    }

    /**
     * Looks for HTML templates inside the container and returns an object allowing to get render options
     * for a particular field.
     */
    parse(fallbackRenderOptions:RenderOptions):RenderOptionsGetter {
      var templates = [];
      for (var i = 0; i < this.container.children.length; i++) {
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

    private parseElement(element:HTMLElement):HTMLRenderTemplate {
      var rom = SingleTemplateParser.parseRenderOptionsModifier(element);
      if (rom) {
        return new HTMLRenderTemplate(FieldMatcherParser.parseMatcher(element), rom);
      } else return null;
    }
  }

  export class HTMLRenderTemplate {
    constructor(public matcher:FieldMatcher, public renderOptionsModifier:RenderOptionsModifier) {
    }
  }
}

