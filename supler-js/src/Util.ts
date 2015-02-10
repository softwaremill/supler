class Util {
  static foreach(obj:any, fn:(k:any, v:any) => void) {
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

  static find<T>(arr:T[], predicate:(el:T) => boolean) {
    for (var i = 0; i < arr.length; i++) {
      if (predicate(arr[i])) {
        return arr[i];
      }
    }
    return null;
  }

  // http://stackoverflow.com/questions/22247799/can-you-write-a-generic-copy-object-function-in-typescript
  static copyObject(object: {}) {
    var objectCopy = <any>{};

    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        objectCopy[key] = (<any>object)[key];
      }
    }

    return objectCopy;
  }

  static deepEqual(x: any, y: any): boolean {
    if (x === y) return true;
    if (!(x instanceof Object) || !(x instanceof Object)) return false;
    if (x.constructor !== y.constructor) return false;
    for (var p in x) {
      if (!x.hasOwnProperty(p)) continue;
      if (!y.hasOwnProperty(p)) return false;
      if (x[p] === y[p]) continue;
      if (typeof(x[p]) !== 'object') return false;
      if (!this.deepEqual(x[p], y[p])) return false;
    }
    for (p in y) {
      if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false;
    }
    return true;
  }
}

class SelectValue {
  constructor(public index:number, public label:string) {
  }
}

class FieldUtil {
  static fieldIsEmpty(fieldValue: any, emptyValue: any): boolean {
    return fieldValue === null || fieldValue.length == 0 || fieldValue === emptyValue;
  }
}
