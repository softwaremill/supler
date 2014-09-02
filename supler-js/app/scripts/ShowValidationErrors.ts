class ShowValidationErrors {
    constructor(private container: HTMLElement) {}

    show(validationJson: any) {
        for (var i=0; i<validationJson.length; i++) {
            var validationError = validationJson[i];
            var fieldPath = <string>validationError.field_path;
            var fieldElement = this.searchForElementByPath(this.container, fieldPath.split("."));
            console.log(fieldPath, " -> ", fieldElement);
        }
    }

    private searchForElementByPath(inside: HTMLElement, path: string[]): HTMLElement {
        if (path.length === 0) return inside;

        var rawPathPart = path.shift();
        var element = this.searchForElement(inside, rawPathPart);
        if (element) {
            return this.searchForElementByPath(element, path);
        } else {
            return null;
        }
    }

    private searchForElement(inside: HTMLElement, rawPathPart: string): HTMLElement {
        var tuple = this.extractElementIdx(rawPathPart);
        var pathPart = tuple.pathPart;
        var elementIdx = tuple.elementIdx;

        // looking layer by layer through the tree rooted at "inside"
        var elementQueue = [ inside ];

        while (elementQueue.length > 0) {
            var currentElement = elementQueue.shift();
            if (currentElement.getAttribute("supler:fieldName") === pathPart) {
                if (elementIdx === 0) {
                    return currentElement;
                } else {
                    elementIdx -= 1;
                }
            } else {
                var chld = currentElement.children;
                for (var i=0; i<chld.length; i++) {
                    elementQueue.push(<HTMLElement>chld[i]);
                }
            }
        }

        return null;
    }

    private idxPattern = /([^\[]+)\[(\d+)\]/;

    private extractElementIdx(rawPathPart: string) {
        var matchResult = this.idxPattern.exec(rawPathPart);
        if (matchResult && matchResult.length >= 3) {
            return { pathPart: matchResult[1], elementIdx: parseInt(matchResult[2]) };
        } else {
            return { pathPart: rawPathPart, elementIdx: 0 };
        }
    }
}