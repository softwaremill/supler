module Supler {
  export class Validation {
    private addedValidations:AddedValidations = new AddedValidations();

    constructor(private elementSearch:ElementSearch,
      private formElementDictionary:FormElementDictionary,
      private validatorRenderOptions:ValidatorRenderOptions,
      private i18n:I18n,
      private readFormValues:ReadFormValues) {
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

      var errors = validator.validate(this.readFormValues, htmlFormElement);

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
      Util.foreach(this.addedValidations.byId, (elementId:string, addedValidation:AddedValidation) => {
        addedValidation.remove();
      });

      this.addedValidations = new AddedValidations();
    }

    private removeSingleValidationErrors(elementId:string) {
      var addedValidation = this.addedValidations.byId[elementId];
      if (addedValidation) {
        addedValidation.remove();
        delete this.addedValidations.byId[elementId];
        delete this.addedValidations.byPath[addedValidation.formElementPath()];
      }
    }

    private appendValidation(text:string, validationElement:HTMLElement, formElement:HTMLElement) {
      var addedValidation;

      if (!this.addedValidations.byId.hasOwnProperty(formElement.id)) {
        addedValidation = new AddedValidation(this.validatorRenderOptions, this.readFormValues, formElement, validationElement);
        this.addedValidations.byId[formElement.id] = addedValidation;
        this.addedValidations.byPath[addedValidation.formElementPath()] = addedValidation;
      } else {
        addedValidation = this.addedValidations.byId[formElement.id];
      }

      if (addedValidation.addText(text)) {
        this.validatorRenderOptions.appendValidation(text, validationElement, formElement)
      }
    }

    reprocessClientFrom(other:Validation) {
      Util.foreach(other.addedValidations.byPath, (path:string, otherAddedValidation:AddedValidation) => {
        // Only copying if that path is not already validated
        if (!this.addedValidations.byPath.hasOwnProperty(path)) {
          // Checking if the form element still has the same value
          var newFormElement = this.elementSearch.byPath(path);
          if (newFormElement) {
            if (Util.deepEqual(otherAddedValidation.invalidValue, this.readFormValues.getValueFrom(newFormElement))) {
              // Re-running the client-side validation
              this.processClientSingle(newFormElement.id);
            }
          }
        }
      });
    }
  }

  interface AddedValidationsDictionary {
    [ key: string ]: AddedValidation
  }

  class AddedValidations {
    byId:AddedValidationsDictionary = {};
    byPath:AddedValidationsDictionary = {};
  }

  class AddedValidation {
    invalidValue:any;
    texts:string[] = [];

    constructor(private validatorRenderOptions:ValidatorRenderOptions,
      private readFormValues:ReadFormValues,
      private formElement:HTMLElement,
      private validationElement:HTMLElement) {

      this.invalidValue = this.readFormValues.getValueFrom(formElement);
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
