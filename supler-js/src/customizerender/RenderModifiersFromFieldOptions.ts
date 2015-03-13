module Supler {
  export class RenderModifiersFromFieldOptions {
    constructor(private fieldsOptions:FieldsOptions) {
    }

    parse():RenderModifierWithMatcher[] {
      var modifiers = [];
      this.fieldsOptions.forEach((fo: FieldOptions) => {
        if (fo.renderOptions) {
          modifiers.push(new RenderModifierWithMatcher(
            fo.matcher,
            CreateRenderOptionsModifier.withOverride(fo.renderOptions)));
        }
      });

      return modifiers;
    }
  }
}
