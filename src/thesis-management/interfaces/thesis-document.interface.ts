import { UserPayload } from 'src/auth/types/user-playload.type';

export interface ThesisDocumentInterface {
  create(...args: any[]): Promise<any>;
  update(...args: any[]): Promise<any>;
  list(...args: any[]): Promise<any>;
  delete(...args: any[]): Promise<any>;
  getOne(...args: any[]): Promise<any>;
  downloadFile(...args: any[]): Promise<any>;
  deleteFile(...args: any[]): Promise<any>;
}
