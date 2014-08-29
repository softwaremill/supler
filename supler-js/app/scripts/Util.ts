class Util {
    static foreach(obj: any, fn: (k: any, v: any) => void) {
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                fn(k, obj[k])
            }
        }
    }
}