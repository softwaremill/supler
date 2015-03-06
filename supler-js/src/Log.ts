module Supler {
  export class Log {
    static warn(message: string) {
      if (console) {
        if (console.warn) {
          console.warn(message);
        }
        else {
          console.log("[WARN]"+message);
        }
      }
    }

    static info(message: string) {
      if (console) {
        console.log(message);
      }
    }
  }
}
