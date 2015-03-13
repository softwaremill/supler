module Supler {

  export class FieldPrefixer {
    private static SEPARATOR = "-";

    constructor(private prefixStr:string) {
    }

    prefix(fieldId:string):string {
      return this.prefixStr + FieldPrefixer.SEPARATOR + fieldId;
    }
  }

  export class EmptyPrefixer extends FieldPrefixer {
    constructor() {super("")}

    prefix(fieldId:string):string {
      return fieldId
    }
  }

}
