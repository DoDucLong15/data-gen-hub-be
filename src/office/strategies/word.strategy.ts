import { OfficeStrategy } from "../interfaces/office.interface";
import { JsonMappingListType } from "../types/json-mapping-list.type";

export class WordStrategy implements OfficeStrategy {
  constructor(){}

  async importList<T extends any>(file: Express.Multer.File, template: JsonMappingListType): Promise<T[]> {
    throw new Error("Method not implemented.");
  }
}