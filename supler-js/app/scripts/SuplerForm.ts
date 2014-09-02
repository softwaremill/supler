class SuplerForm {
    private options: RenderOptions;
    private validationErrors: ShowValidationErrors;

    constructor(private container: HTMLElement, customOptions: any) {
        this.options = new DefaultRenderOptions();
        Util.copyProperties(this.options, customOptions);

        this.validationErrors = new ShowValidationErrors(this.container);
    }

    create(formJson) {
        this.container.innerHTML = new CreateFormFromJson(this.options).formFromJson(formJson);
    }

    getValue() {
        return new ReadFormValues().getValueFrom(this.container);
    }

    /**
     * @returns True if there were validation errors.
     */
    showValidationErrors(validationJson): boolean {
        return this.validationErrors.show(validationJson);
    }
}

