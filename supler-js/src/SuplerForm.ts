class SuplerForm {
  private i18n:I18n;
  private validatorFnFactories:any;
  private validation:Validation;
  private validatorRenderOptions:ValidatorRenderOptions;
  private sendControllerOptions:SendControllerOptions;
  private elementSearch:ElementSearch;
  private renderOptionsGetter:RenderOptionsGetter;

  constructor(private container: HTMLElement, customOptions: any) {
    customOptions = customOptions || {};

    this.i18n = new I18n();
    Util.copyProperties(this.i18n, customOptions.i18n);

    var renderOptions = new Bootstrap3RenderOptions();
    Util.copyProperties(renderOptions, customOptions.render_options);
    this.renderOptionsGetter = new HTMLRenderTemplateParser(this.container).parse(renderOptions);

    this.validatorFnFactories = new DefaultValidatorFnFactories(this.i18n);
    Util.copyProperties(this.validatorFnFactories, customOptions.validators);

    this.validatorRenderOptions = new ValidatorRenderOptions;
    Util.copyProperties(this.validatorRenderOptions, customOptions.validation_render);

    this.sendControllerOptions = new SendControllerOptions(customOptions);

    this.elementSearch = new ElementSearch(container);
  }

  render(json) {
    var result = new CreateFormFromJson(this.renderOptionsGetter, this.i18n, this.validatorFnFactories).renderForm(json.main_form);
    this.container.innerHTML = result.html;

    this.initializeValidation(result.elementDictionary, json);

    var sendController = new SendController(this, result.elementDictionary, this.sendControllerOptions, this.elementSearch,
      this.validation);
    sendController.attachRefreshListeners();
    sendController.attachActionListeners();

    this.sendControllerOptions.afterRenderFunction()
  }

  private initializeValidation(elementDictionary: ElementDictionary, json) {
    var oldValidation = this.validation;
    this.validation = new Validation(this.elementSearch, elementDictionary,
      this.validatorRenderOptions, this.i18n);

    this.validation.processServer(json.errors);
    if (oldValidation) {
      this.validation.copyFrom(oldValidation);
    }
  }

  getValue(selectedActionId:string = null) {
    return ReadFormValues.getValueFrom(this.container, selectedActionId);
  }

  /**
   * @returns True if there were validation errors.
   */
  validate():boolean {
    return this.validation.processClient();
  }
}
