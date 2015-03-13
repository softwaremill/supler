module Supler {
  export class HTMLRenderTemplateParser {
    constructor(private container:HTMLElement) {
    }

    /**
     * Looks for HTML templates inside the container and returns an object allowing to get render options
     * for a particular field.
     */
    parse():RenderModifierWithMatcher[] {
      var modifiers = [];
      for (var i = 0; i < this.container.children.length; i++) {
        var child = this.container.children[i];
        if (child.tagName) {
          var modifier = this.parseElement(<HTMLElement>child);
          if (modifier) {
            modifiers.push(modifier);
          }
        }
      }

      return modifiers;
    }

    private parseElement(element:HTMLElement):RenderModifierWithMatcher {
      var rom = SingleTemplateParser.parseRenderOptionsModifier(element);
      if (rom) {
        return new RenderModifierWithMatcher(FieldMatcherHtmlParser.parseMatcher(element), rom);
      } else return null;
    }
  }
}

