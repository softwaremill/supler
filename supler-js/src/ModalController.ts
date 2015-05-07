module Supler {
  export class ModalController {
    private modalPaths: collections.Stack<string>;
    private modalCurrentlyShown: boolean;
    private modalPayload: string;

    constructor() {
      this.modalPaths = new collections.Stack<string>();
      this.modalCurrentlyShown = false;
    }

    public isModalShown(): boolean {return this.modalCurrentlyShown;}

    public openNewModal(modalPath: string): void {this.modalPaths.push(modalPath);}

    public currentModal(): string {return this.modalPaths.peek();}

    public closeModal(): string {this.modalCurrentlyShown = false; return this.modalPaths.pop();}

    public isEmpty(): boolean {return this.modalPaths.isEmpty();}

    public modalShown(modalShown: boolean): void {this.modalCurrentlyShown = modalShown;}

    public getModalPayload(): string {return this.modalPayload;}

    public setModalPayload(modalPayload: string): void {this.modalPayload = modalPayload;}
  }
}
