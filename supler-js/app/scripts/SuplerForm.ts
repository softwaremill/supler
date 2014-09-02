class SuplerForm {
    private renderOptions: RenderOptions;
    private validatorFnFactories: any;
    private validationErrors: ValidationErrors;

    constructor(private container: HTMLElement, customOptions: any) {
        this.renderOptions = new DefaultRenderOptions();
        Util.copyProperties(this.renderOptions, customOptions);

        this.validatorFnFactories = new DefaultValidatorFnFactories;
        Util.copyProperties(this.validatorFnFactories, customOptions);
    }

    create(formJson) {
        var result = new CreateFormFromJson(this.renderOptions, this.validatorFnFactories).formFromJson(formJson);
        this.container.innerHTML = result.html;
        this.validationErrors = new ValidationErrors(this.container, result.validatorDictionary);
    }

    getValue() {
        return new ReadFormValues().getValueFrom(this.container);
    }

    /**
     * @returns True if there were validation errors.
     */
    processServerValidationErrors(validationJson): boolean {
        return this.validationErrors.processServer(validationJson);
    }
}

