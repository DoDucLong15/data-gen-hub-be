import { JsonMappingSingleType } from 'src/template-specification/types/json.type';
import { OfficeStrategy } from '../interfaces/office.interface';
import { JsonMappingListType } from '../types/json-mapping-list.type';
import { PythonScriptService } from 'src/python-script/python-script.service';

export class WordStrategy implements OfficeStrategy {
  constructor(private readonly pythonScriptService: PythonScriptService) {}

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

  async importSingle<T extends unknown>(
    file: Express.Multer.File,
    template: JsonMappingSingleType,
  ): Promise<T> {
    throw new Error('Method not implemented.');
  }

  async importListByScript(
    inputPath: string,
    specificationPath: string,
    classId: string,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async exportListByScript(
    classId: string,
    templatePath: string,
    specificationPath: string,
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }
  async exportSingleByScript(
    classId: string,
    templatePath: string,
    specificationPath: string,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async importSingleByScript(
    inputPaths: string[],
    specificationPath: string,
    classId: string,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
