export class AsyncUtils {
  static async delay(time: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  static async performJob<T>(func: () => Promise<T>, retries: number = 0, delay: number = 1000) {
    return new Promise<T>(async (resolve, reject) => {
      let numRetries = retries;
      do {
        try {
          const result = await func();
          resolve(result);
          return;
        } catch (error) {
          --numRetries;
          if (numRetries < 0) {
            reject('performJob error by reach limit retry');
            return;
          }
        }
      } while (true);
    });
  }
}
