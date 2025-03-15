import { JsonMappingSingleType } from 'src/template-specification/types/json.type';
import { JsonMappingListType } from '../types/json-mapping-list.type';
import { ThesisDocumentEnum } from 'src/thesis-management/enums/thesis-document.enum';

export interface OfficeStrategy {
  importList<T extends any>(file: Express.Multer.File, template: JsonMappingListType): Promise<T[]>;
  exportList<T extends any>(
    list: T[],
    templateFile: Express.Multer.File,
    template: JsonMappingListType,
  ): Promise<Partial<Express.Multer.File>>;
  exportSingle<T extends any>(
    data: T,
    templateFile: Partial<Express.Multer.File>,
    template: JsonMappingSingleType,
  ): Promise<Partial<Express.Multer.File>>;
  importSingle<T extends any>(
    file: Express.Multer.File,
    template: JsonMappingSingleType,
  ): Promise<T>;

  // Script
  importListByScript(inputPath: string, specificationPath: string, classId: string): Promise<void>;
  exportListByScript(
    classId: string,
    studentIds: string[],
    templatePath: string,
    specificationPath: string,
  ): Promise<void>;
  exportSingleByScript(
    classId: string,
    studentIds: string[],
    templatePath: string,
    specificationPath: string,
    thesisType: ThesisDocumentEnum,
    extraData?: any,
  ): Promise<void>;
  importSingleByScript(
    inputPath: string,
    specificationPath: string,
    classId: string,
  ): Promise<void>;
}
