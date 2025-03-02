import { JsonMappingListType } from "../types/json-mapping-list.type";

export interface OfficeStrategy {
  importList<T extends any>(file: Express.Multer.File, template: JsonMappingListType): Promise<T[]>;
}