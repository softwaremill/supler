class ReloadController {
  constructor(private suplerForm:SuplerForm,
    private elementDictionary:ElementDictionary,
    private options:ReloadControllerOptions,
    private elementSearch:ElementSearch,
    private validation:Validation) {
  }

  attachRefreshListeners() {
    this.ifEnabledForEachFormElement(formElement => {
      if (formElement.nodeName != "FIELDSET") {
        formElement.onchange = () => {
          if (!this.validation.processClientSingle(formElement.id)) {
            this.options.reloadFormFunction(
              this.suplerForm.getValue(),
              this.reloadSuccessFn());
          }
        }
      }
    });
  }

  attachActionListeners() {
    this.ifEnabledForEachFormElement(formElement => {
      if (formElement.getAttribute(SuplerAttributes.FIELD_TYPE) === FieldTypes.ACTION) {
        formElement.onclick = () => {
          if (!this.validation.processClientSingle(formElement.id)) {
            this.options.reloadFormFunction(
              this.suplerForm.getValue(formElement.id),
              this.reloadSuccessFn());
          }
        }
      }
    });
  }

  private ifEnabledForEachFormElement(body:(formElement:HTMLElement) => void) {
    if (this.options.reloadEnabled()) {
      Util.foreach(this.elementDictionary, (elementId:string, validator:ElementValidator) => {
        var formElement = document.getElementById(elementId);
        if (formElement) {
          body(formElement);
        }
      });
    }
  }

  private reloadSuccessFn() {
    return (data:any) => {
      var focusOnPath:string;
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
    }
  }
}

class ReloadControllerOptions {
  reloadFormFunction:(formJson:any, successFn:(data:any) => void) => void;
  afterRenderFunction:() => void;

  constructor(options:any) {
    this.reloadFormFunction = options.reload_form_function;

    this.afterRenderFunction = options.after_render_function;
    if (!this.afterRenderFunction) {
      this.afterRenderFunction = () => {
      };
    }
  }

  reloadEnabled():boolean {
    return this.reloadFormFunction !== null;
  }
}
