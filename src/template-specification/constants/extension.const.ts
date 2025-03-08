import { FileTypes } from '../enums/file-type.enum';

export const FileExtension = {
  [FileTypes.EXCEL]: ['xlsx', 'xls', 'csv'],
  [FileTypes.WORD]: ['docx', 'doc'],
  [FileTypes.HTML]: ['html'],
};
