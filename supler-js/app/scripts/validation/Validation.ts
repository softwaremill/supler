class Validation {
    private removeValidationErrorsFns: { (): void } [] = [];

    constructor(private elementSearch: ElementSearch,
                private elementDictionary: ElementDictionary,
                private validatorRenderOptions: ValidatorRenderOptions,
                private i18n: I18n) {}

    /**
     * @returns True if there were validation errors.
     */
    processServer(validationJson: any): boolean {
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
    processClient(): boolean {
        this.removeValidationErrors();

        var hasErrors = false;

        Util.foreach(this.elementDictionary, (elementId: string, validator: ElementValidator) => {
            var formElement = document.getElementById(elementId);
            if (formElement) {
                var validationElement = this.lookupValidationElement(formElement);

                var errors = validator.validate(formElement);

                for (var i = 0; i < errors.length; i++) {
                    this.appendValidation(errors[i], validationElement, formElement);
                    hasErrors = true;
                }
            }
        });

        return hasErrors;
    }

    private lookupValidationElement(formElement: HTMLElement) {
        var validationId = formElement.getAttribute("supler:validationId");
        return document.getElementById(validationId);
    }

    private removeValidationErrors() {
        for (var i=0; i<this.removeValidationErrorsFns.length; i++) {
            this.removeValidationErrorsFns[i]();
        }

        this.removeValidationErrorsFns = [];
    }

    private appendValidation(text: string, validationElement: HTMLElement, formElement: HTMLElement) {
        this.validatorRenderOptions.appendValidation(text, validationElement, formElement);

        this.removeValidationErrorsFns.push(() => {
            this.validatorRenderOptions.removeValidation(validationElement, formElement);
        });
    }
}
