module Supler {
  export class FieldTypes {
    static STRING = 'string';
    static INTEGER = 'integer';
    static FLOAT = 'float';
    static BOOLEAN = 'boolean';
    static SELECT = 'select';
    static SUBFORM = 'subform';
    static STATIC = 'static';
    static ACTION = 'action';
    static META = 'meta';
    static MODAL = 'modal';
  }

  export class SuplerAttributes {
    static FIELD_TYPE = 'supler:fieldType';
    static MULTIPLE = 'supler:multiple';
    static FIELD_NAME = 'supler:fieldName';
    static VALIDATION_ID = 'supler:validationId';
    static PATH = 'supler:path';
  }

  export class FormSections {
    static META = 'supler_meta';
  }
}
