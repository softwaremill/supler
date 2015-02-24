interface FieldMatcher {
  matches(path:string, type:string, renderHintName:string): boolean
}

class AllFieldMatcher implements FieldMatcher {
  matches(path:string, type:string, renderHintName:string):boolean {
    return true;
  }
}

class CompositeFieldMatcher implements FieldMatcher {
  constructor(private m1:FieldMatcher, private m2:FieldMatcher) {
  }

  matches(path:string, type:string, renderHintName:string):boolean {
    return this.m1.matches(path, type, renderHintName) && this.m2.matches(path, type, renderHintName);
  }
}

class PathFieldMatcher implements FieldMatcher {
  private pathMatcher:RegExp;

  constructor(path:string) {
    var parts = path.split('[]');
    if (parts.length === 1) {
      this.pathMatcher = new RegExp(Util.escapeRegExp(path));
    } else {
      this.pathMatcher = new RegExp(parts.join('\\[\\d*\\]'));
    }
  }

  matches(path:string, type:string, renderHintName:string):boolean {
    return this.pathMatcher.test(path);
  }
}

class TypeFieldMatcher implements FieldMatcher {
  constructor(private type:string) {
  }

  matches(path:string, type:string, renderHintName:string):boolean {
    return this.type === type;
  }
}

class RenderHintFieldMatcher implements FieldMatcher {
  constructor(private renderHintName:string) {
  }

  matches(path:string, type:string, renderHintName:string):boolean {
    return this.renderHintName === renderHintName;
  }
}

class FieldMatcherParser {
  private static FIELD_PATH_MATCHER = 'supler:fieldPath';
  private static FIELD_TYPE_MATCHER = 'supler:fieldType';
  private static FIELD_RENDERHINT_MATCHER = 'supler:fieldRenderHint';

  /**
   * Extracts a field matcher which will determine if a template is applicable for a particular field.
   */
  static parseMatcher(element:HTMLElement):FieldMatcher {
    var current = new AllFieldMatcher();
    if (element.hasAttribute(FieldMatcherParser.FIELD_PATH_MATCHER)) {
      current = new CompositeFieldMatcher(current,
        new PathFieldMatcher(element.getAttribute(FieldMatcherParser.FIELD_PATH_MATCHER)))
    }
    if (element.hasAttribute(FieldMatcherParser.FIELD_TYPE_MATCHER)) {
      current = new CompositeFieldMatcher(current,
        new TypeFieldMatcher(element.getAttribute(FieldMatcherParser.FIELD_TYPE_MATCHER)))
    }
    if (element.hasAttribute(FieldMatcherParser.FIELD_RENDERHINT_MATCHER)) {
      current = new CompositeFieldMatcher(current,
        new RenderHintFieldMatcher(element.getAttribute(FieldMatcherParser.FIELD_RENDERHINT_MATCHER)))
    }
    return current;
  }
}
