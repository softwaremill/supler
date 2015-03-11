module Supler {
  export interface RenderOptionsModifier {
    (renderOptions:RenderOptions): RenderOptions
  }

  export class RenderModifierWithMatcher {
    constructor(public matcher:FieldMatcher, public renderOptionsModifier:RenderOptionsModifier) {
    }
  }
}
