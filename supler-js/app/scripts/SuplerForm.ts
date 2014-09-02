class SuplerForm {
    private renderOptions: RenderOptions;
    private validatorFnFactories: any;
    private validationErrors: ShowValidationErrors;

    constructor(private container: HTMLElement, customOptions: any) {
        this.renderOptions = new DefaultRenderOptions();
        Util.copyProperties(this.renderOptions, customOptions);

        this.validatorFnFactories = new DefaultValidatorFnFactories;
        Util.copyProperties(this.validatorFnFactories, customOptions);

        this.validationErrors = new ShowValidationErrors(this.container);
    }

    create(formJson) {
        var result = new CreateFormFromJson(this.renderOptions, this.validatorFnFactories).formFromJson(formJson);
        this.container.innerHTML = result.html;
        console.log(result.validatorDictionary);
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

