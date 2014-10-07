class Util {
    static foreach(obj: any, fn: (k: any, v: any) => void) {
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                fn(k, obj[k])
            }
        }
    }

    static copyProperties(to, from) {
        Util.foreach(from, (k, v) => {
            to[k] = v;
        });

        return to;
    }

    static getSingleProperty(obj) {
        var result = null;
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                if (result != null) {
                    throw "Multiple properties in " + obj + ", while a single property was expected!"
                }
                result = obj[k];
            }
        }

        return result;
    }
}

class SelectValue {
    constructor(public index: number, public label: string) {}
}
