export type BaseResponse<T = any> = {
  status: 'success' | 'failure' | 'error' | 'processing';
  data?: T;
  message?: string;
};
