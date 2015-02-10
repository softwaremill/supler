/**
 * Can validate a single form element using the given validator functions.
 */
class ElementValidator {
  constructor(
    private validatorFns: ValidatorFn[],
    private required: boolean,
    private emptyValue: any) {}

  public validate(element:HTMLElement):string[] {
    var value = Util.getSingleProperty(ReadFormValues.getValueFrom(element));

    // not running validations for optional fields without a value
    if (this.required !== true && FieldUtil.fieldIsEmpty(value, this.emptyValue)) {
      return [];
    }

    var errors = [];

    for (var i = 0; i < this.validatorFns.length; i++) {
      var r = this.validatorFns[i](value);
      if (r) errors.push(r);
    }

    return errors;
  }
}
