class I18n {
  fromKeyAndParams(errorKey:string, errorParams:string[]) {
    var fn = this[errorKey];
    if (fn && typeof(fn) == "function") {
      return fn.apply(this, errorParams);
    } else if (fn) {
      return fn;
    } else {
      return errorKey;
    }
  }

  error_valueRequired() {
    return "Value is required";
  }

  error_number_ge(than) {
    return "Must be greater or equal to " + than;
  }

  error_number_gt(than) {
    return "Must be greater than " + than;
  }

  error_number_le(than) {
    return "Must be less or equal to " + than;
  }

  error_number_lt(than) {
    return "Must be less than " + than;
  }

  error_length_tooShort(minLength) {
    return "Too short; minimum length: " + minLength;
  }

  error_length_tooLong(maxLength) {
    return "Too long; maximum length: " + maxLength;
  }

  error_type_number() {
    return "Must be a number";
  }

  label_boolean_true() {
    return "Yes";
  }

  label_boolean_false() {
    return "No";
  }
}
