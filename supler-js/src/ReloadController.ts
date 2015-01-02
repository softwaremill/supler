class ReloadController {
  private refreshCounter: number;
  private actionInProgress: boolean;
  private actionQueue: { (): void }[];

  constructor(private suplerForm:SuplerForm,
    private elementDictionary:ElementDictionary,
    private options:ReloadControllerOptions,
    private elementSearch:ElementSearch,
    private validation:Validation) {

    this.refreshCounter = 0;
    this.actionInProgress = false;
    this.actionQueue = [];
  }

  attachRefreshListeners() {
    this.ifEnabledForEachFormElement(formElement => {
      if (formElement.nodeName != "FIELDSET") {
        formElement.onchange = () => this.refreshListenerFor(formElement)
      }
    });
  }

  attachActionListeners() {
    this.ifEnabledForEachFormElement(formElement => {
      if (formElement.getAttribute(SuplerAttributes.FIELD_TYPE) === FieldTypes.ACTION) {
        formElement.onclick = () => this.actionListenerFor(formElement)
      }
    });
  }

  private refreshListenerFor(formElement: HTMLElement) {
    // if an action is in progress, dropping the refresh-reload
    if (!this.actionInProgress && !this.validation.processClientSingle(formElement.id)) {
      this.refreshCounter += 1;
      var thisRefreshNumber = this.refreshCounter;

      // to apply the results, the then-current refresh counter must match what's captured at the time of starting
      // the request. Otherwise, a new refresh has been already started.
      var applyRefreshResultsCondition= () => {
        return !this.actionInProgress && thisRefreshNumber === this.refreshCounter;
      };

      this.options.reloadFormFunction(
        this.suplerForm.getValue(),
        this.reloadSuccessFn(applyRefreshResultsCondition, () => {}),
        () => {}, // do nothing on error
        false);
    }
  }

  private actionListenerFor(formElement: HTMLElement) {
    if (this.actionInProgress) {
      this.actionQueue.push(() => this.actionListenerFor(formElement));
    } else {
      this.actionInProgress = true;

      if (!this.validation.processClientSingle(formElement.id)) {
        this.options.reloadFormFunction(
          this.suplerForm.getValue(formElement.id),
          this.reloadSuccessFn(() => { return true; }, () => this.actionCompleted()),
          () => this.actionCompleted(),
          true);
      } else {
        this.actionCompleted();
      }
    }
  }

  private actionCompleted() {
    this.actionInProgress = false;

    if (this.actionQueue.length > 0) {
      var nextAction = this.actionQueue.shift();
      nextAction();
    }
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

  private reloadSuccessFn(applyResultsCondition: () => boolean, onComplete: () => void) {
    return (data:any) => {
      if (applyResultsCondition()) {
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

      onComplete();
    }
  }
}

class ReloadControllerOptions {
  reloadFormFunction: (formValue: any, successFn: (data: any) => void, errorFn: () => void, isAction: boolean) => void;
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
