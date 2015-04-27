module Supler {
  export class FieldData {
    constructor(public id:string,
      public validationId:string,
      public json:any,
      public label:string,
      public fieldsPerRow: number,
      private renderHintOverride:any = null) {

      this.name = json.name;
      this.value = json.value;
      this.path = json.path;
      this.multiple = json.multiple;
      this.type = json.type;
      this.enabled = json.enabled;
      this.validate = json.validate || {};
      this.description = json.description;
      this.evaluated = json.evaluated;
      this.modal = json.modal;
    }

    public name:string;
    public value:any;
    public path:string;
    public multiple:boolean;
    public type:string;
    public enabled:boolean;
    public validate:any;
    public description:string;
    public evaluated: boolean;
    public modal: boolean;

    getRenderHint():any {
      if (this.renderHintOverride) {
        return this.renderHintOverride;
      } else {
        return this.json.render_hint;
      }
    }

    getRenderHintName():string {
      if (this.renderHintOverride) {
        return this.renderHintOverride.name;
      } else if (this.json.render_hint) {
        return this.json.render_hint.name;
      } else {
        return null;
      }
    }

    withRenderHintOverride(renderHintOverride:any):FieldData {
      return new FieldData(this.id, this.validationId, this.json, this.label, this.fieldsPerRow, renderHintOverride);
    }
  }
}
