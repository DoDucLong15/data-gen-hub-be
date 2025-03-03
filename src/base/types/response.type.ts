export type BaseResponse<T = any> = {
  status: 'success' | 'failure' | 'error';
  data?: T;
  message?: string;
};
