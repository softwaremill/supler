class RefreshController {
    constructor(private suplerForm: SuplerForm,
                private elementDictionary: ElementDictionary,
                private options: RefreshControllerOptions) {}

    attachRefreshListeners() {
        Util.foreach(this.elementDictionary, (elementId: string, validator: ElementValidator) => {
            var formElement = document.getElementById(elementId);
            if (formElement && formElement.nodeName != "FIELDSET") {
                formElement.onchange = () => {
                    this.options.refreshFormFunction(this.suplerForm.getValue(),
                        (data: any) => this.suplerForm.render(data));
                }
            }
        });
    }
}

class RefreshControllerOptions {
    refreshFormFunction: (formJson: any, successFn: (data: any) => void) => void;

    constructor(options: any) {
        this.refreshFormFunction = options.refresh_form_function;
    }
}
