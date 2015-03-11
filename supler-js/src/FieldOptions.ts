module Supler {
  export class FieldsOptions {
    private fieldOptions:FieldOptions[] = [];

    private RENDER_HINT_MATCHER_PREFIX = 'render_hint:';

    constructor(options:any) {
      Util.foreach(options || {}, (matcherStr, fieldOpts) => {
        var matcher;
        if (matcherStr.indexOf(this.RENDER_HINT_MATCHER_PREFIX) === 0) {
          matcher = new RenderHintFieldMatcher(matcherStr.substring(this.RENDER_HINT_MATCHER_PREFIX.length));
        } else {
          matcher = new PathFieldMatcher(matcherStr);
        }

        this.fieldOptions.push(new FieldOptions(matcher, fieldOpts));
      })
    }

    forField(fieldData:FieldData):FieldOptions {
      return Util.find(this.fieldOptions, (fo) => {
        return fo.matcher.matches(fieldData.path, fieldData.type, fieldData.getRenderHintName());
      });
    }

    forEach(cb: (fo: FieldOptions) => void) {
      this.fieldOptions.forEach(cb);
    }
  }

  export class FieldOptions {
    renderHint:any;
    renderOptions:any;

    constructor(public matcher:PathFieldMatcher, options:any) {
      if (options.render_hint) {
        // the render hint can be a string, then we wrap it in an object with a 'name' property
        // otherwise we assume it is a correctly defined render hint object
        if (typeof options.render_hint === 'string') {
          this.renderHint = {'name': options.render_hint};
        } else this.renderHint = options.render_hint;
      }

      this.renderOptions = options.render_options;
    }
  }
}
