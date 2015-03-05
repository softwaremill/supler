module Supler {
  export class Form {
    private i18n:I18n;
    private validatorFnFactories:any;
    private validation:Validation;
    private validatorRenderOptions:ValidatorRenderOptions;
    private sendControllerOptions:SendControllerOptions;
    private elementSearch:ElementSearch;
    private renderOptionsGetter:RenderOptionsGetter;
    private afterRenderFn:() => void;
    private customDataHandlerFn:(any) => void;
    private fieldsOptions:FieldsOptions;
    private customOrder:string[][];

    constructor(private container:HTMLElement, customOptions:any) {
      customOptions = customOptions || {};

      this.i18n = new I18n();
      Util.copyProperties(this.i18n, customOptions.i18n);

      var renderOptions = new Bootstrap3RenderOptions();
      Util.copyProperties(renderOptions, customOptions.render_options);
      this.renderOptionsGetter = new HTMLRenderTemplateParser(this.container).parse(renderOptions);

      this.validatorFnFactories = new ValidatorFnFactories(this.i18n);
      Util.copyProperties(this.validatorFnFactories, customOptions.validators);

      this.validatorRenderOptions = new ValidatorRenderOptions;
      Util.copyProperties(this.validatorRenderOptions, customOptions.validation_render);

      this.sendControllerOptions = new SendControllerOptions(customOptions);

      this.elementSearch = new ElementSearch(container);

      this.afterRenderFn = customOptions.after_render_function || (() => {
      });
      this.customDataHandlerFn = customOptions.custom_data_handler || ((data:any) => {
      });

      this.fieldsOptions = new FieldsOptions(customOptions.field_options);

      this.customOrder = customOptions.order || null;
    }

    render(json) {
      if (this.isSuplerForm(json)) { // might be custom-data-only result
        var result = new CreateFormFromJson(this.renderOptionsGetter, this.i18n, this.validatorFnFactories,
          this.fieldsOptions, this.customOrder).renderForm(json[FormSections.META], json.main_form);
        this.container.innerHTML = result.html;

        this.initializeValidation(result.formElementDictionary, json);

        var sendController = new SendController(this, result.formElementDictionary, this.sendControllerOptions, this.elementSearch,
          this.validation);
        sendController.attachRefreshListeners();
        sendController.attachActionListeners();
      }

      var customData = this.getCustomData(json);
      if (customData) this.customDataHandlerFn(customData);

      this.afterRenderFn();
    }

    private initializeValidation(formElementDictionary:FormElementDictionary, json) {
      var oldValidation = this.validation;
      this.validation = new Validation(this.elementSearch, formElementDictionary,
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
    validate(validationScope:ValidationScope = ValidateAll):boolean {
      return this.validation.processClient(validationScope);
    }

    /**
     * @param json The json received from the server
     * @returns Custom data, if the json contained it, or `null`, if the form does not contain custom data
     */
    getCustomData(json):any {
      if (this.isSuplerForm(json)) {
        return json.custom_data;
      } else {
        return json
      }
    }

    private isSuplerForm(json):boolean {
      return json.is_supler_form === true;
    }
  }
}
