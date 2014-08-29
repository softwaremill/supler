class SuplerForm {
    private options: RenderOptions;

    constructor(private container: HTMLDivElement, customOptions: any) {
        this.options = new DefaultRenderOptions();
        Util.copyProperties(this.options, customOptions);
    }

    render(formJson) {
        this.container.innerHTML = new RenderFormFromJson(this.options).formFromJson(formJson);
    }

    getValue() {
        return new ReadFormValues().getValueFrom(this.container);
    }
}

