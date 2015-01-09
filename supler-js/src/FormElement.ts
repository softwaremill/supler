class FormElement {
  validator: ElementValidator;
  // validation scope is currently only used by actions
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
