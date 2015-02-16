/**
 * Perform validation basing on the the value of the field. The type of the value depends on the field type,
 * and is equal to what will be sent to the server.
 *
 * Should return null if validation succeeds.
 */
interface ValidatorFn {
  (fieldValue:any): string
}

/**
 * Contains functions (factories) which create validator functions based on validator-specific configuration jsons.
 *
 * Type-specific validation functions don't accept configuration as they have special handling and don't need
 * configuration.
 */
class ValidatorFnFactories {
  constructor(private i18n:I18n) {
  }

  required(json, fieldJson):ValidatorFn {
    return (fieldValue:any) => {
      if (json === true && FieldUtil.fieldIsEmpty(fieldValue, fieldJson.empty_value)) {
        return this.i18n.error_valueRequired();
      } else return null;
    }
  }

  ge(json):ValidatorFn {
    return (fieldValue:any) => {
      if (parseFloat(fieldValue) >= json) return null; else return this.i18n.error_number_ge(json);
    }
  }

  gt(json):ValidatorFn {
    return (fieldValue:any) => {
      if (parseFloat(fieldValue) > json) return null; else return this.i18n.error_number_gt(json);
    }
  }

  le(json):ValidatorFn {
    return (fieldValue:any) => {
      if (parseFloat(fieldValue) <= json) return null; else return this.i18n.error_number_le(json);
    }
  }

  lt(json):ValidatorFn {
    return (fieldValue:any) => {
      if (parseFloat(fieldValue) < json) return null; else return this.i18n.error_number_lt(json);
    }
  }

  min_length(json):ValidatorFn {
    return (fieldValue:any) => {
      if (fieldValue.length >= json) return null; else return this.i18n.error_length_tooShort(json);
    }
  }

  max_length(json):ValidatorFn {
    return (fieldValue:any) => {
      if (fieldValue.length <= json) return null; else return this.i18n.error_length_tooLong(json);
    }
  }

  type_integer():ValidatorFn {
    return (fieldValue:any) => {
      if (parseInt(fieldValue) === fieldValue) return null; else return this.i18n.error_type_number();
    }
  }

  type_float():ValidatorFn {
    return (fieldValue:any) => {
      if (parseFloat(fieldValue) === fieldValue) return null; else return this.i18n.error_type_number();
    }
  }
}
