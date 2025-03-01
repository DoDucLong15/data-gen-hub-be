import { FileTypes } from "../enums/file-type.enum";

export const MimeType = {
  [FileTypes.EXCEL]: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ],
  [FileTypes.WORD]: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ],
  [FileTypes.HTML]: [
    'text/html',
  ],
}