module Supler {
  export class SendController {
    private refreshCounter:number;
    private actionInProgress:boolean;

    constructor(private form:Form,
      private formElementDictionary:FormElementDictionary,
      private options:SendControllerOptions,
      private elementSearch:ElementSearch,
      private validation:Validation) {

      this.refreshCounter = 0;
      this.actionInProgress = false;
    }

    attachRefreshListeners() {
      this.ifEnabledForEachFormElement(htmlFormElement => {
        if (htmlFormElement.nodeName != "FIELDSET") {
          htmlFormElement.onchange = () => this.refreshListenerFor(htmlFormElement)
        }
      });
    }

    attachActionListeners() {
      this.ifEnabledForEachFormElement(htmlFormElement => {
        if (htmlFormElement.getAttribute(SuplerAttributes.FIELD_TYPE) === FieldTypes.ACTION) {
          htmlFormElement.onclick = () => this.actionListenerFor(htmlFormElement)
        }
      });
    }

    private refreshListenerFor(htmlFormElement:HTMLElement) {
      // if an action is in progress, dropping the send
      if (!this.actionInProgress && !this.validation.processClientSingle(htmlFormElement.id)) {
        this.refreshCounter += 1;
        var thisRefreshNumber = this.refreshCounter;

        // to apply the results, the then-current refresh counter must match what's captured at the time of starting
        // the request. Otherwise, a new refresh has been already started.
        var applyRefreshResultsCondition = () => {
          return !this.actionInProgress && thisRefreshNumber === this.refreshCounter;
        };

        this.options.sendFormFunction(
          this.form.getValue(),
          this.sendSuccessFn(applyRefreshResultsCondition, () => {
          }),
          () => {
          }, // do nothing on error
          false,
          htmlFormElement);
      }
    }

    private actionListenerFor(htmlFormElement:HTMLElement) {
      // allowing at most one action at a time.
      if (!this.actionInProgress) {
        this.actionInProgress = true;

        var id = htmlFormElement.id;

        var validationPassed = !this.validation.processClientSingle(id) && !this.validation.processClient(this.formElementDictionary.getElement(id).validationScope);

        if (validationPassed) {
          this.options.sendFormFunction(
            this.form.getValue(id),
            this.sendSuccessFn(() => {
              return true;
            }, () => this.actionCompleted()),
            () => this.actionCompleted(),
            true,
            htmlFormElement);
        } else {
          this.actionCompleted();
        }
      }
    }

    private actionCompleted() {
      this.actionInProgress = false;
    }

    private ifEnabledForEachFormElement(body:(htmlFormElement:HTMLElement) => void) {
      if (this.options.sendEnabled()) {
        this.formElementDictionary.foreach((elementId:string, formElement:FormElement) => {
          var htmlFormElement = document.getElementById(elementId);
          if (htmlFormElement) {
            body(htmlFormElement);
          }
        });
      }
    }

    private sendSuccessFn(applyResultsCondition:() => boolean, onComplete:() => void) {
      return (data:any) => {
        if (applyResultsCondition()) {
          var focusOnPath:string;
          var activeElement = document.activeElement;
          if (activeElement) {
            focusOnPath = activeElement.getAttribute(SuplerAttributes.PATH);
          }

          this.form.render(data);

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

  export class SendControllerOptions {
    sendFormFunction:(formValue:any, renderResponseFn:(data:any) => void, sendErrorFn:() => void,
      isAction:boolean, triggeringElement:HTMLElement) => void;

    constructor(options:any) {
      this.sendFormFunction = options.send_form_function;
    }

    sendEnabled():boolean {
      return this.sendFormFunction !== null && typeof this.sendFormFunction !== 'undefined';
    }
  }
}
