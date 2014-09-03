class HtmlUtil {
    static renderTag(tagName, tagAttrs, voidTag) {
        var r = "<" + tagName + " ";
        Util.foreach(tagAttrs, (tagAttrName, tagAttrValue) => {
            if (tagAttrValue || tagAttrValue === 0 || tagAttrValue === "" || tagAttrValue === false) {
                r += tagAttrName + '="' + tagAttrValue + '" ';
            }
        });

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

    static removeClass(toElement: HTMLElement, cls: string) {
        toElement.className = toElement.className.replace(cls, '');
    }
}