class ValidatorRenderOptions {
  appendValidation(text:string, validationElement:HTMLElement, formElement:HTMLElement) {
    var current = validationElement.innerHTML;

    if (current.indexOf(text) === -1) {
      if (current && current.length > 0) {
        validationElement.innerHTML = current + '; ' + text;
      } else {
        validationElement.innerHTML = text;
      }

      HtmlUtil.addClass(formElement.parentElement, 'has-error');
    }
  }

  removeValidation(validationElement:HTMLElement, formElement:HTMLElement) {
    validationElement.innerHTML = '';
    HtmlUtil.removeClass(formElement.parentElement, 'has-error');
  }
}
