class SuplerForm {
    private renderOptions: RenderOptions;
    private validatorFnFactories: any;
    private validation: Validation;
    private validatorRenderOptions: ValidatorRenderOptions;

    constructor(private container: HTMLElement, customOptions: any) {
        this.renderOptions = new DefaultRenderOptions();
        Util.copyProperties(this.renderOptions, customOptions);

        this.validatorFnFactories = new DefaultValidatorFnFactories;
        Util.copyProperties(this.validatorFnFactories, customOptions);

        this.validatorRenderOptions = new ValidatorRenderOptions;
        Util.copyProperties(this.validatorRenderOptions, customOptions);
    }

    render(formJson) {
        var result = new CreateFormFromJson(this.renderOptions, this.validatorFnFactories).renderForm(formJson);
        this.container.innerHTML = result.html;
        this.validation = new Validation(this.container, result.validatorDictionary,
            this.validatorRenderOptions);
    }

    getValue() {
        return ReadFormValues.getValueFrom(this.container);
    }

    /**
     * @returns True if there were validation errors.
     */
    processServerFormErrors(validationJson): boolean {
        return this.validation.processServer(validationJson);
    }

    /**
     * @returns True if there were validation errors.
     */
    validate(): boolean {
        return this.validation.processClient();
    }
}
