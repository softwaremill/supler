module Supler {
  export class RenderOptionsGetter {
    constructor(private fallbackRenderOptions:RenderOptions, private templates:HTMLRenderTemplate[]) {
    }

    /**
     * Applies all matching render templates for the given field to the default render options.
     * Hence if a template is defined later, it has priority.
     */
    forField(path:string, type:string, renderHintName:string):RenderOptions {
      var current = this.fallbackRenderOptions;
      for (var i = 0; i < this.templates.length; i++) {
        var template = this.templates[i];
        if (template.matcher.matches(path, type, renderHintName)) {
          current = template.renderOptionsModifier(current);
        }
      }

      return current;
    }

    defaultRenderOptions(): RenderOptions {
      return this.fallbackRenderOptions;
    }
  }
}
