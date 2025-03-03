import { JsonMappingSingleType } from 'src/template-specification/types/json.type';
import { OfficeStrategy } from '../interfaces/office.interface';
import { JsonMappingListType } from '../types/json-mapping-list.type';

export class HtmlStrategy implements OfficeStrategy {
  constructor() {}

  async importList<T extends any>(
    file: Express.Multer.File,
    template: JsonMappingListType,
  ): Promise<T[]> {
    throw new Error('Method not implemented.');
  }

  async exportList<T extends unknown>(
    list: T[],
    templateFile: Express.Multer.File,
    template: JsonMappingListType,
  ): Promise<Partial<Express.Multer.File>> {
    throw new Error('Method not implemented.');
  }

  async exportSingle<T extends unknown>(
    data: T,
    templateFile: Partial<Express.Multer.File>,
    template: JsonMappingSingleType,
  ): Promise<Partial<Express.Multer.File>> {
    throw new Error('Method not implemented.');
  }
}
