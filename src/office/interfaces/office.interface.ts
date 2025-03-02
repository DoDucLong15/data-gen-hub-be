import { JsonMappingListType } from "../types/json-mapping-list.type";

export interface OfficeStrategy {
  importList<T extends any>(file: Express.Multer.File, template: JsonMappingListType): Promise<T[]>;
  exportList<T extends any>(list: T[], templateFile: Express.Multer.File, template: JsonMappingListType): Promise<Partial<Express.Multer.File>>;
}