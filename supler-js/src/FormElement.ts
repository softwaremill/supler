class FormElement {
  validator: ElementValidator;
  validationScope: ValidationScope;

  constructor() {}
}

class FormElementDictionary {
  private formElements: FormElement[] = [];

  getElement(id: string): FormElement {
    var element = this.formElements[id];
    if (!element) {
      element = new FormElement();
      this.formElements[id] = element;
    }

    return element;
  }

  foreach(fn: (id: string, formElement: FormElement) => void) {
    Util.foreach(this.formElements, fn);
  }
}
