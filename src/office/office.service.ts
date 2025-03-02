import { Injectable, Logger } from '@nestjs/common';
import { OfficeStrategy } from './interfaces/office.interface';
import { OfficeTypeEnum } from './enums/office-type.enum';
import { ExcelStrategy } from './strategies/excel.strategy';
import { WordStrategy } from './strategies/word.strategy';
import { HtmlStrategy } from './strategies/html.strategy';
import { MimeType } from 'src/template-specification/constants/mime-type.const';
import { FileTypes } from 'src/template-specification/enums/file-type.enum';
import { JsonMappingListType } from './types/json-mapping-list.type';

@Injectable()
export class OfficeService {
  private officeStrategy: Record<string, OfficeStrategy> = {};
  constructor() {
    this.use(OfficeTypeEnum.EXCEL, new ExcelStrategy());
    this.use(OfficeTypeEnum.WORD, new WordStrategy());
    this.use(OfficeTypeEnum.HTML, new HtmlStrategy());
  }

  private use(name: string, strategy: OfficeStrategy): void {
    this.officeStrategy[name] = strategy;
  }

  private getStrategyByMimeType(mimeType: string): OfficeStrategy {
    if (MimeType[FileTypes.EXCEL].includes(mimeType)) {
      return this.getStrategy(OfficeTypeEnum.EXCEL);
    } else if (MimeType[FileTypes.WORD].includes(mimeType)) {
      return this.getStrategy(OfficeTypeEnum.WORD);
    } else if (MimeType[FileTypes.HTML].includes(mimeType)) {
      return this.getStrategy(OfficeTypeEnum.HTML);
    } else {
      throw new Error(`Strategy not found for mime type ${mimeType}`);
    }
  }

  private getStrategy(name: string): OfficeStrategy {
    if (!this.officeStrategy[name]) {
      throw new Error(`Strategy ${name} not found`);
    }
    return this.officeStrategy[name];
  }

  async importList<T extends any>(file: Express.Multer.File, template: JsonMappingListType): Promise<T[]> {
    const strategy = this.getStrategyByMimeType(file.mimetype);
    return await strategy.importList<T>(file, template);
  }
}
