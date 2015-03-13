module Supler {
  export interface RenderOptionsModifier {
    (renderOptions:RenderOptions): RenderOptions
  }

  export class CreateRenderOptionsModifier {
    /**
     * Creates a function to create a `RenderOptions` instance using the methods defined in the `override`
     * object, falling back to the given `RenderOptions`.
     */
    static withOverride(override):RenderOptionsModifier {
      var Override = function() {
        Util.copyProperties(this, override);
      };

      return (renderOptions:RenderOptions) => {
        Override.prototype = renderOptions;
        return <RenderOptions>(new Override());
      }
    }
  }

  export class RenderModifierWithMatcher {
    constructor(public matcher:FieldMatcher, public renderOptionsModifier:RenderOptionsModifier) {
    }
  }
}
