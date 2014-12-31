class FieldData {
  constructor(
    public id: string,
    public validationId: string,
    public name: string,
    public json: any,
    public label: string) {

    this.value = json.value;
    this.path = json.path;
    this.multiple = json.multiple;
    this.type = json.type;
  }

  public value: any;
  public path: string;
  public multiple: boolean;
  public type: string;

  getRenderHintName(): string {
    if (this.json.render_hint) {
      return this.json.render_hint.name;
    } else {
      return null;
    }
  }
}
