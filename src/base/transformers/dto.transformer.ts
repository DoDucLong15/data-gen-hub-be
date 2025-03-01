export function transformToArray(queryParams: any): any[] {
  const { value } = queryParams;

  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}
export function transformToNumber({ value }: { value: string }) {
  if (typeof value === 'string') {
    return Number(value);
  }
  return value;
}
export function transformBooleanValue({ value }: { value: string }): boolean | string {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return value;
}

// New
export function transformToBoolean({ value }: { value: any }): boolean {
  return value === 'true' || value === true;
}