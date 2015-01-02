class Validation {
  private removeValidationFnDictionary:RemoveValidationFnDictionary = {};

  constructor(private elementSearch:ElementSearch,
    private elementDictionary:ElementDictionary,
    private validatorRenderOptions:ValidatorRenderOptions,
    private i18n:I18n) {
  }

  /**
   * @returns True if there were validation errors.
   */
  processServer(validationJson:any):boolean {
    this.removeValidationErrors();

    if (validationJson) {
      for (var i = 0; i < validationJson.length; i++) {
        var validationErrorJson = validationJson[i];
        var fieldPath = <string>validationErrorJson.field_path;
        var formElement = this.elementSearch.byPath(fieldPath);
        var validationElement = this.lookupValidationElement(formElement);

        this.appendValidation(
          this.i18n.fromKeyAndParams(validationErrorJson.error_key, validationErrorJson.error_params),
          validationElement, formElement);
      }
    }

    return validationJson && validationJson.length > 0;
  }

  /**
   * @returns True if there were validation errors.
   */
  processClient():boolean {
    this.removeValidationErrors();

    var hasErrors = false;

    Util.foreach(this.elementDictionary, (elementId:string, validator:ElementValidator) => {
      hasErrors = this.doProcessClientSingle(elementId, validator) || hasErrors;
    });

    return hasErrors;
  }

  /**
   * @returns True if there were validation errors.
   */
  processClientSingle(elementId:string):boolean {
    var removeFn = this.removeValidationFnDictionary[elementId];
    if (removeFn) removeFn();

    var validator = this.elementDictionary[elementId];
    if (validator) return this.doProcessClientSingle(elementId, validator); else return false;
  }

  private doProcessClientSingle(elementId:string, validator:ElementValidator):boolean {
    var formElement = document.getElementById(elementId);
    var hasErrors = false;
    if (formElement) {
      var validationElement = this.lookupValidationElement(formElement);

      var errors = validator.validate(formElement);

      for (var i = 0; i < errors.length; i++) {
        this.appendValidation(errors[i], validationElement, formElement);
        hasErrors = true;
      }
    }

    return hasErrors;
  }

  private lookupValidationElement(formElement:HTMLElement) {
    var validationId = formElement.getAttribute("supler:validationId");
    return document.getElementById(validationId);
  }

  private removeValidationErrors() {
    Util.foreach(this.removeValidationFnDictionary, (elementId:string, removeFn:() => void) => {
      removeFn();
    });

    this.removeValidationFnDictionary = {};
  }

  private appendValidation(text:string, validationElement:HTMLElement, formElement:HTMLElement) {
    this.validatorRenderOptions.appendValidation(text, validationElement, formElement);

    this.removeValidationFnDictionary[formElement.id] = () => {
      this.validatorRenderOptions.removeValidation(validationElement, formElement);
    };
  }
}

interface RemoveValidationFnDictionary {
  [ elementId: string ]: () => void
}
