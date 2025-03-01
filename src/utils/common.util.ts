export class CommonUtils {
  static isNullish(value: any): boolean {
    return value === null || value === undefined;
  }

  static isNotNullish(value: any): boolean {
    return !this.isNullish(value);
  }
}