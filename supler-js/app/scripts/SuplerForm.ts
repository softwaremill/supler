class SuplerForm {
    private options: RenderOptions;

    constructor(private container: HTMLElement, customOptions: any) {
        this.options = new DefaultRenderOptions();
        Util.copyProperties(this.options, customOptions);
    }

    render(formJson) {
        this.container.innerHTML = new RenderFormFromJson(this.options).formFromJson(formJson);
    }

    getValue() {
        return new ReadFormValues().getValueFrom(this.container);
    }

    showValidationErrors(validationJson) {
        new ShowValidationErrors(this.container).show(validationJson);
    }
}

