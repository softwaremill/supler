class RefreshController {
    constructor(private suplerForm: SuplerForm,
                private elementDictionary: ElementDictionary,
                private options: RefreshControllerOptions,
                private elementSearch: ElementSearch) {}

    attachRefreshListeners() {
        Util.foreach(this.elementDictionary, (elementId: string, validator: ElementValidator) => {
            var formElement = document.getElementById(elementId);
            if (formElement && formElement.nodeName != "FIELDSET") {
                formElement.onchange = () => {

                    this.options.refreshFormFunction(
                        this.suplerForm.getValue(),
                        this.refreshSuccessFn());
                }
            }
        });
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

    constructor(options: any) {
        this.refreshFormFunction = options.refresh_form_function;
    }
}
