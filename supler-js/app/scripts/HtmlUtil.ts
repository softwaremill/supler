class HtmlUtil {
    static renderTag(tagName, tagAttrs, tagBody = null, escapeTagBody = true) {
        var r = '<' + tagName + ' ';
        Util.foreach(tagAttrs, (tagAttrName, tagAttrValue) => {
            if (tagAttrValue || tagAttrValue === 0 || tagAttrValue === '' || tagAttrValue === false) {
                r += tagAttrName + '="' + HtmlUtil.escapeForAttribute(tagAttrValue, false) + '" ';
            }
        });

        r += '>';

        if (tagBody) {
            r += escapeTagBody ? HtmlUtil.escapeForAttribute(tagBody, true) : tagBody;
        }

        r += '</' + tagName + '>';

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

    // from http://stackoverflow.com/a/9756789/362531
    static escapeForAttribute(s, preserveCR) {
        preserveCR = preserveCR ? '&#13;' : '\n';
        return ('' + s) /* Forces the conversion to string. */
            .replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
            .replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            /*
             You may add other replacements here for HTML only
             (but it's not necessary).
             Or for XML, only if the named entities are defined in its DTD.
             */
            .replace(/\r\n/g, preserveCR) /* Must be before the next replacement. */
            .replace(/[\r\n]/g, preserveCR);
    }
}
