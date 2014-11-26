class Validation {
    private removeValidationErrorsFns: { (): void } [] = [];

    constructor(private container: HTMLElement,
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
                var formElement = this.searchForElementByPath(this.container, fieldPath.split("."));
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

    private searchForElementByPath(inside: HTMLElement, path: string[]): HTMLElement {
        if (path.length === 0) return inside;

        var rawPathPart = path.shift();
        var element = this.searchForElement(inside, rawPathPart);
        if (element) {
            return this.searchForElementByPath(element, path);
        } else {
            return null;
        }
    }

    private searchForElement(inside: HTMLElement, rawPathPart: string): HTMLElement {
        var pathPartWithIndex = this.extractElementIdx(rawPathPart);
        var pathPart = pathPartWithIndex.pathPart;
        var elementIdx = pathPartWithIndex.elementIdx;

        // looking layer by layer through the tree rooted at "inside"
        var elementQueue = [ inside ];

        while (elementQueue.length > 0) {
            var currentElement = elementQueue.shift();
            if (currentElement.getAttribute(SuplerAttributes.FIELD_NAME) === pathPart) {
                if (elementIdx === 0) {
                    return currentElement;
                } else {
                    elementIdx -= 1;
                }
            } else {
                var chld = currentElement.children;
                for (var i=0; i<chld.length; i++) {
                    elementQueue.push(<HTMLElement>chld[i]);
                }
            }
        }

        return null;
    }

    private idxPattern = /([^\[]+)\[(\d+)\]/;

    private extractElementIdx(rawPathPart: string) {
        var matchResult = this.idxPattern.exec(rawPathPart);
        if (matchResult && matchResult.length >= 3) {
            return { pathPart: matchResult[1], elementIdx: parseInt(matchResult[2]) };
        } else {
            return { pathPart: rawPathPart, elementIdx: 0 };
        }
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
