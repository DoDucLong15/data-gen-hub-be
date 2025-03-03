export class CommonUtils {
  static isNullish(value: any): boolean {
    return value === null || value === undefined;
  }

  static isNotNullish(value: any): boolean {
    return !this.isNullish(value);
  }

  static formatString(template: string, ...values: string[]): string {
    return template.replace(/{(\d+)}/g, (match, index) => {
      return values[index] !== undefined ? values[index] : match;
    });
  }
}
