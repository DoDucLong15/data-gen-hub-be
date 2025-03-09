export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OmitFields<T, K extends keyof T> = Omit<T, K>;
