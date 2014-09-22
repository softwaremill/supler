/**
 * Can validate a single form element using the given validator functions.
 */
class ElementValidator {
    constructor(private validatorFns: ValidatorFn[]) {}

    public validate(element: HTMLElement): ValidationError[] {
        var value = Util.getSingleProperty(ReadFormValues.getValueFrom(element));
        var errors = [];
        for (var i=0; i<this.validatorFns.length; i++) {
            var r = this.validatorFns[i](value);
            if (r) errors.push(r);
        }

        return errors;
    }
}

interface ElementValidatorDictionary {
    [ elementId: string ]: ElementValidator
}

class ValidationError {
    constructor(public errorKey: string, public errorParams: string[] = []) {}

    static fromJson(validationErrorJson: any) {
        return new ValidationError(validationErrorJson.error_key, validationErrorJson.error_params);
    }
}