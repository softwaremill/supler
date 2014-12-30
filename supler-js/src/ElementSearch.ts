class ElementSearch {
  constructor(private container:HTMLElement) {
  }

  byPath(path:string):HTMLElement {
    return this.insideByPath(this.container, path.split("."));
  }

  private insideByPath(inside:HTMLElement, path:string[]):HTMLElement {
    if (path.length === 0) return inside;

    var rawPathPart = path.shift();
    var element = this.searchForElement(inside, rawPathPart);
    if (element) {
      return this.insideByPath(element, path);
    } else {
      return null;
    }
  }

  private searchForElement(inside:HTMLElement, rawPathPart:string):HTMLElement {
    var pathPartWithIndex = this.extractElementIdx(rawPathPart);
    var pathPart = pathPartWithIndex.pathPart;
    var elementIdx = pathPartWithIndex.elementIdx;

    // looking layer by layer through the tree rooted at "inside"
    var elementQueue = [inside];

    while (elementQueue.length > 0) {
      var currentElement = elementQueue.shift();
      if (currentElement.getAttribute(SuplerAttributes.FIELD_NAME) === pathPart) {
        if (elementIdx === 0) {
          return currentElement;
        } else {
          elementIdx -= 1;
        }
      } else {
        var chld = currentElement.children;
        for (var i = 0; i < chld.length; i++) {
          elementQueue.push(<HTMLElement>chld[i]);
        }
      }
    }

    return null;
  }

  private idxPattern = /([^\[]+)\[(\d+)\]/;

  private extractElementIdx(rawPathPart:string) {
    var matchResult = this.idxPattern.exec(rawPathPart);
    if (matchResult && matchResult.length >= 3) {
      return {pathPart: matchResult[1], elementIdx: parseInt(matchResult[2])};
    } else {
      return {pathPart: rawPathPart, elementIdx: 0};
    }
  }
}
