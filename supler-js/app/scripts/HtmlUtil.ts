class HtmlUtil {
    static renderTag(tagName, tagAttrs, voidTag) {
        var r = "<" + tagName + " ";
        for (var tagAttrName in tagAttrs) {
            if (tagAttrs.hasOwnProperty(tagAttrName) && tagAttrs[tagAttrName]) {
                r += tagAttrName + '="' + tagAttrs[tagAttrName] + '" ';
            }
        }

        if (voidTag) {
            r += "/>";
        } else {
            r += ">";
        }

        return r;
    }

    static addClass(toElement: HTMLElement, cls: string) {
        if (toElement.className.indexOf(cls) === -1) {
            toElement.className = toElement.className + ' ' + cls;
        }
    }
}