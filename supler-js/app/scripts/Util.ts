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
}

class SelectValue {
    constructor(public index: number, public label: string) {}
}