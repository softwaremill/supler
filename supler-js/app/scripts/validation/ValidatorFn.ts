/**
 * Perform validation basing on the the value of the field. The type of the value depends on the field type,
 * and is equal to what will be sent to the server.
 *
 * Should return null if validation succeeds.
 */
interface ValidatorFn {
    (fieldValue: any): ValidationError
}

/**
 * Contains functions (factories) which create validator functions based on validator-specific configuration jsons.
 *
 * Type-specific validation functions don't accept configuration as they have special handling and don't need
 * configuration.
 */
class DefaultValidatorFnFactories {
    required(json): ValidatorFn { return (fieldValue: any) => {
        if (json === true && (fieldValue === null || fieldValue.length == 0)) return new ValidationError("Value is required"); else return null;
    }}

    ge(json): ValidatorFn { return (fieldValue: any) => {
        if (parseInt(fieldValue) >= json) return null; else return new ValidationError("Must be greater or equal to " + json);
    }}

    gt(json): ValidatorFn { return (fieldValue: any) => {
        if (parseInt(fieldValue) > json) return null; else return new ValidationError("Must be greater than " + json);
    }}

    le(json): ValidatorFn { return (fieldValue: any) => {
        if (parseInt(fieldValue) <= json) return null; else return new ValidationError("Must be less or equal to " + json);
    }}

    lt(json): ValidatorFn { return (fieldValue: any) => {
        if (parseInt(fieldValue) < json) return null; else return new ValidationError("Must be less than " + json);
    }}

    type_integer(): ValidatorFn { return (fieldValue: any) => {
        if (parseInt(fieldValue) === fieldValue) return null; else return new ValidationError("Must be a number");
    }}
}