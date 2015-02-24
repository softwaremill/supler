class FieldsOptions {
  private fieldOptions:FieldOptions[] = [];

  constructor(options:any) {
    Util.foreach(options || {}, (path, fieldOpts) => {
      this.fieldOptions.push(new FieldOptions(new PathFieldMatcher(path), fieldOpts));
    })
  }

  forField(fieldData:FieldData):FieldOptions {
    return Util.find(this.fieldOptions, (fo) => {
      return fo.matcher.matches(fieldData.path, fieldData.type, fieldData.getRenderHintName());
    });
  }
}

class FieldOptions {
  renderHint:any;

  constructor(public matcher:PathFieldMatcher, options:any) {
    if (options.render_hint) {
      // the render hint can be a string, then we wrap it in an object with a 'name' property
      // otherwise we assume it is a correctly defined render hint object
      if (typeof options.render_hint === 'string') {
        this.renderHint = { 'name': options.render_hint };
      } else this.renderHint = options.render_hint;
    }
  }
}
