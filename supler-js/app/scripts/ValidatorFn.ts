/**
 * Perform validation basing on the string representation of the value of the field.
 * Should return null if validation succeeds.
 */
interface ValidatorFn {
    (fieldValue: string): ValidationError
}

/**
 * Contains functions (factories) which create validator functions based on validator-specific configuration jsons.
 *
 * Type-specific validation functions don't accept configuration as they have special handling and don't need
 * configuration.
 */
class DefaultValidatorFnFactories {
    required(json): ValidatorFn { return (fieldValue: string) => {
        if (json === true && !fieldValue || fieldValue.length == 0) return new ValidationError("Value is required"); else return null;
    }}

    ge(json): ValidatorFn { return (fieldValue: string) => {
        if (parseInt(fieldValue) >= json) return null; else return new ValidationError("Must be greater or equal to " + json);
    }}

    gt(json): ValidatorFn { return (fieldValue: string) => {
        if (parseInt(fieldValue) > json) return null; else return new ValidationError("Must be greater than " + json);
    }}

    le(json): ValidatorFn { return (fieldValue: string) => {
        if (parseInt(fieldValue) <= json) return null; else return new ValidationError("Must be less or equal to " + json);
    }}

    lt(json): ValidatorFn { return (fieldValue: string) => {
        if (parseInt(fieldValue) < json) return null; else return new ValidationError("Must be less than " + json);
    }}

    type_integer(): ValidatorFn { return (fieldValue: string) => {
        if (fieldValue && fieldValue.match(/^\d+$/)) return null; else return new ValidationError("Must be a number");
    }}
}