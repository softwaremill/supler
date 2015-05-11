module Supler {
  export class ModalController {
    private modalPaths:collections.Stack<string>;
    private modalCurrentlyShown:boolean;
    private modalContext:collections.Dictionary<string, any>;

    constructor() {
      this.modalPaths = new collections.Stack<string>();
      this.modalCurrentlyShown = false;
      this.modalContext = new collections.Dictionary<string, any>();
    }

    public isModalShown():boolean {
      return this.modalCurrentlyShown;
    }

    public openNewModal(modalPath:string):void {
      this.modalPaths.push(modalPath);
    }

    public currentModal():string {
      return this.modalPaths.peek();
    }

    public closeModal():string {
      this.modalCurrentlyShown = false;
      return this.modalPaths.pop();
    }

    public isEmpty():boolean {
      return this.modalPaths.isEmpty();
    }

    public modalShown(modalShown:boolean):void {
      this.modalCurrentlyShown = modalShown;
    }

    public getModalContext():collections.Dictionary<string, any> {
      return this.modalContext;
    }

    public addOrAppendToContext(key:string, value:string):void {
      var oldVal = this.modalContext.getValue(key) || '';
      this.modalContext.setValue(key, oldVal + value);
    }

    public visibleModal(fieldPath:String):boolean {
      return this.modalPaths.peek() == fieldPath;
    }

    public moreThenOneModal():boolean {
      return this.modalPaths.size() > 1;
    }
  }
}
