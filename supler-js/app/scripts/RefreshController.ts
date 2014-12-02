class RefreshController {
    constructor(private suplerForm: SuplerForm,
                private elementDictionary: ElementDictionary,
                private options: RefreshControllerOptions,
                private elementSearch: ElementSearch,
                private validation: Validation) {}

    attachRefreshListeners() {
        if (this.options.refreshEnabled()) {
            Util.foreach(this.elementDictionary, (elementId:string, validator:ElementValidator) => {
                var formElement = document.getElementById(elementId);
                if (formElement && formElement.nodeName != "FIELDSET") {
                    formElement.onchange = () => {
                        if (!this.validation.processClientSingle(elementId)) {
                            this.options.refreshFormFunction(
                                this.suplerForm.getValue(),
                                this.refreshSuccessFn());
                        }
                    }
                }
            });
        }
    }

    private refreshSuccessFn() { return (data: any) => {
        var focusOnPath: string;
        var activeElement = document.activeElement;
        if (activeElement) {
            focusOnPath = activeElement.getAttribute(SuplerAttributes.PATH);
        }

        this.suplerForm.render(data);

        if (focusOnPath) {
            var focusOnElement = this.elementSearch.byPath(focusOnPath);
            if (focusOnElement) {
                focusOnElement.focus()
            }
        }
    } }
}

class RefreshControllerOptions {
    refreshFormFunction: (formJson: any, successFn: (data: any) => void) => void;
    afterRenderFunction: () => void;

    constructor(options: any) {
        this.refreshFormFunction = options.refresh_form_function;

        this.afterRenderFunction = options.after_render_function;
        if (!this.afterRenderFunction) {
            this.afterRenderFunction = () => {};
        }
    }

    refreshEnabled(): boolean { return this.refreshFormFunction !== null; }
}
