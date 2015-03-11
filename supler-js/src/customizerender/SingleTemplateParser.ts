module Supler {
  export class SingleTemplateParser {
    private static FIELD_TEMPLATE = 'supler:fieldTemplate';
    private static FIELD_LABEL_TEMPLATE = 'supler:fieldLabelTemplate';
    private static FIELD_VALIDATION_TEMPLATE = 'supler:fieldValidationTemplate';
    private static FIELD_INPUT_TEMPLATE = 'supler:fieldInputTemplate';

    /**
     * Extracts a template-specific function to modify some parts of the render options basing on the
     * content of the template.
     */
    static parseRenderOptionsModifier(element:HTMLElement):RenderOptionsModifier {
      if (element.hasAttribute(this.FIELD_TEMPLATE)) {
        return this.parseFieldTemplate(element);
      }
      if (element.hasAttribute(this.FIELD_LABEL_TEMPLATE)) {
        return this.parseFieldLabelTemplate(element);
      }
      if (element.hasAttribute(this.FIELD_VALIDATION_TEMPLATE)) {
        return this.parseFieldValidationTemplate(element);
      }
      if (element.hasAttribute(this.FIELD_INPUT_TEMPLATE)) {
        return this.parseFieldInputTemplate(element);
      } else return null;
    }

    private static parseFieldTemplate(element:HTMLElement):RenderOptionsModifier {
      var template = element.innerHTML;
      return this.createModifierWithOverride(function () {
        this.renderField = function (input:string, fieldData:FieldData, compact:boolean) {
          var renderedLabel = compact ? '' : this.renderLabel(fieldData.id, fieldData.label);
          var renderedValidation = this.renderValidation(fieldData.validationId);

          return template
            .replace('{{suplerLabel}}', renderedLabel)
            .replace('{{suplerInput}}', input)
            .replace('{{suplerValidation}}', renderedValidation);
        };
      })
    }

    private static parseFieldLabelTemplate(element:HTMLElement):RenderOptionsModifier {
      var template = element.innerHTML;
      return this.createModifierWithOverride(function () {
        this.renderLabel = function (forId:string, label:string) {
          return template
            .replace('{{suplerLabelForId}}', forId)
            .replace('{{suplerLabelText}}', label);
        };
      })
    }

    private static parseFieldValidationTemplate(element:HTMLElement):RenderOptionsModifier {
      var template = element.innerHTML;
      return this.createModifierWithOverride(function () {
        this.renderValidation = function (validationId:string) {
          return template.replace('{{suplerValidationId}}', validationId);
        };
      })
    }

    private static parseFieldInputTemplate(element:HTMLElement):RenderOptionsModifier {
      var mainTemplate = element.innerHTML;

      var SUPLER_FIELD_INPUT_ATTRS = '{{suplerFieldInputAttrs}}';
      var SUPLER_FIELD_INPUT_VALUE = '{{suplerFieldInputValue}}';
      var SUPLER_FIELD_CONTAINER_ATTRS = '{{suplerFieldInputContainerAttrs}}';

      function adjustAttrsValueMapping(template, attrs, value) {
        var containsValueMapping = template.indexOf(SUPLER_FIELD_INPUT_VALUE) > -1;
        if ((value === null) || containsValueMapping) {
          delete attrs['value'];
        } else {
          attrs['value'] = value;
        }
      }

      function renderTemplateForAttrs(template, attrs, value) {
        adjustAttrsValueMapping(template, attrs, value);
        // when getting the inner html the attribute names are lower-cased. Not sure if it's like that in all
        // browsers, though.
        return template
          .replace(SUPLER_FIELD_INPUT_ATTRS, HtmlUtil.renderAttrs(attrs))
          .replace(SUPLER_FIELD_INPUT_ATTRS.toLowerCase(), HtmlUtil.renderAttrs(attrs))
          .replace(SUPLER_FIELD_INPUT_VALUE, value)
          .replace(SUPLER_FIELD_INPUT_VALUE.toLowerCase(), value);
      }

      function renderTemplateWithPossibleValues(possibleValues,
        containerOptions,
        elementOptions,
        isSelected:(SelectValue) => boolean) {
        var singleInput = element.hasAttribute('super:singleInput') &&
          (element.getAttribute('super:singleInput').toLowerCase() === 'true');

        if (singleInput) {
          containerOptions = elementOptions;
        }

        var possibleValueTemplate = HtmlUtil.findElementWithAttr(element, 'supler:possibleValueTemplate').outerHTML;
        var renderedPossibleValues = '';
        Util.foreach(possibleValues, (i, v) => {
          var attrs = Util.copyProperties({}, elementOptions);
          attrs['id'] = elementOptions['id'] + '.' + v.id;
          if (isSelected(v)) {
            attrs[element.getAttribute('supler:selectedAttrName')] = element.getAttribute('supler:selectedAttrValue');
          }

          renderedPossibleValues +=
            renderTemplateForAttrs(possibleValueTemplate, attrs, v.id)
              .replace('{{suplerFieldInputLabel}}', v.label);
        });

        return mainTemplate
          .replace(SUPLER_FIELD_CONTAINER_ATTRS, HtmlUtil.renderAttrs(containerOptions))
          .replace(SUPLER_FIELD_CONTAINER_ATTRS.toLowerCase(), HtmlUtil.renderAttrs(containerOptions))
          .replace(possibleValueTemplate, renderedPossibleValues);
      }

      return this.createModifierWithOverride(function () {
        this.additionalFieldOptions = function () {
          return {};
        };

        // no possible values
        this.renderHtmlInput = function (inputType:string, value:any, options:any):string {
          var attrs = Util.copyProperties({'type': inputType}, options);
          return renderTemplateForAttrs(mainTemplate, attrs, value);
        };

        this.renderHtmlTextarea = function (value:string, options:any):string {
          return renderTemplateForAttrs(mainTemplate, options, value);
        };

        this.renderHtmlButton = function (label:string, options:any):string {
          return renderTemplateForAttrs(mainTemplate, options, null);
        };

        // possible values
        this.renderHtmlSelect = function (value:number,
          possibleValues:SelectValue[],
          containerOptions:any,
          elementOptions:any):string {
          return renderTemplateWithPossibleValues(possibleValues, containerOptions, elementOptions, (v) => {
            return v.id === value;
          });
        };

        this.renderHtmlRadios = function (value:any,
          possibleValues:SelectValue[],
          containerOptions:any,
          elementOptions:any):string {
          return renderTemplateWithPossibleValues(possibleValues, containerOptions, elementOptions, (v) => {
            return v.id === value;
          });
        };

        this.renderHtmlCheckboxes = function (value:any,
          possibleValues:SelectValue[],
          containerOptions:any,
          elementOptions:any):string {
          return renderTemplateWithPossibleValues(possibleValues, containerOptions, elementOptions, (v) => {
            return value.indexOf(v.id) >= 0;
          });
        };
      })
    }

    /**
     * Creates a function to create a `RenderOptions` instance using the methods defined in the `Override`
     * class, falling back to the given `RenderOptions`.
     */
    private static createModifierWithOverride(Override):RenderOptionsModifier {
      return (renderOptions:RenderOptions) => {
        Override.prototype = renderOptions;
        return <RenderOptions>(new Override());
      }
    }
  }
}
