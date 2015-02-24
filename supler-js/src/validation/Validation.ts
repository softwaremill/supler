module Supler {
  export class Validation {
    private addedValidations:AddedValidationsDictionary = {};

    constructor(private elementSearch:ElementSearch,
      private formElementDictionary:FormElementDictionary,
      private validatorRenderOptions:ValidatorRenderOptions,
      private i18n:I18n) {
    }

    /**
     * @returns True if there were validation errors.
     */
    processServer(validationJson:any):boolean {
      this.removeAllValidationErrors();

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
    processClient(validationScope:ValidationScope):boolean {
      this.removeAllValidationErrors();

      var hasErrors = false;

      this.formElementDictionary.foreach((elementId:string, formElement:FormElement) => {
        var htmlFormElement = document.getElementById(elementId);
        if (htmlFormElement && validationScope.shouldValidate(htmlFormElement.getAttribute(SuplerAttributes.PATH))) {
          hasErrors = this.doProcessClientSingle(htmlFormElement, formElement.validator) || hasErrors;
        }
      });

      return hasErrors;
    }

    /**
     * @returns True if there were validation errors.
     */
    processClientSingle(elementId:string):boolean {
      this.removeSingleValidationErrors(elementId);

      var validator = this.formElementDictionary.getElement(elementId).validator;
      var htmlFormElement = document.getElementById(elementId);
      if (htmlFormElement && validator) return this.doProcessClientSingle(htmlFormElement, validator); else return false;
    }

    private doProcessClientSingle(htmlFormElement:HTMLElement, validator:ElementValidator):boolean {
      var hasErrors = false;
      var validationElement = this.lookupValidationElement(htmlFormElement);

      var errors = validator.validate(htmlFormElement);

      for (var i = 0; i < errors.length; i++) {
        this.appendValidation(errors[i], validationElement, htmlFormElement);
        hasErrors = true;
      }

      return hasErrors;
    }

    private lookupValidationElement(formElement:HTMLElement) {
      var validationId = formElement.getAttribute(SuplerAttributes.VALIDATION_ID);
      return document.getElementById(validationId);
    }

    private removeAllValidationErrors() {
      Util.foreach(this.addedValidations, (elementId:string, addedValidation:AddedValidation) => {
        addedValidation.remove();
      });

      this.addedValidations = {};
    }

    private removeSingleValidationErrors(elementId:string) {
      var addedValidation = this.addedValidations[elementId];
      if (addedValidation) {
        addedValidation.remove();
        delete this.addedValidations[elementId];
      }
    }

    private appendValidation(text:string, validationElement:HTMLElement, formElement:HTMLElement) {
      if (!this.addedValidations.hasOwnProperty(formElement.id)) {
        this.addedValidations[formElement.id] =
          new AddedValidation(this.validatorRenderOptions, formElement, validationElement);
      }

      var addedValidation = this.addedValidations[formElement.id];

      if (addedValidation.addText(text)) {
        this.validatorRenderOptions.appendValidation(text, validationElement, formElement)
      }
    }

    copyFrom(other:Validation) {
      Util.foreach(other.addedValidations, (otherElementId:string, otherAddedValidation:AddedValidation) => {
        // checking if the form element with the same path as the one with existing validation exists and
        // has the same value.
        var newFormElement = this.elementSearch.byPath(otherAddedValidation.formElementPath());
        if (newFormElement) {
          if (Util.deepEqual(otherAddedValidation.invalidValue, ReadFormValues.getValueFrom(newFormElement))) {
            var newValidationElement = this.lookupValidationElement(newFormElement);

            otherAddedValidation.texts.forEach((text:string) => {
              this.appendValidation(text, newValidationElement, newFormElement)
            });
          }
        }
      });
    }
  }

  interface AddedValidationsDictionary {
    [ elementId: string ]: AddedValidation
  }

  class AddedValidation {
    invalidValue:any;
    texts:string[] = [];

    constructor(private validatorRenderOptions:ValidatorRenderOptions,
      private formElement:HTMLElement,
      private validationElement:HTMLElement) {

      this.invalidValue = ReadFormValues.getValueFrom(formElement);
    }

    addText(text:string):boolean {
      if (this.texts.indexOf(text) === -1) {
        this.texts.push(text);
        return true;
      } else {
        return false;
      }
    }

    formElementPath():string {
      return this.formElement.getAttribute(SuplerAttributes.PATH);
    }

    remove() {
      this.validatorRenderOptions.removeValidation(this.validationElement, this.formElement)
    }
  }
}
