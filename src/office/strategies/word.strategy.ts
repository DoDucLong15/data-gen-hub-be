import {
  JsonMappingSingleType,
  JsonMappingWordSingleType,
} from 'src/template-specification/types/json.type';
import { OfficeStrategy } from '../interfaces/office.interface';
import { JsonMappingListType } from '../types/json-mapping-list.type';
import { PythonScriptService } from 'src/python-script/python-script.service';
import { ThesisDocumentEnum } from 'src/thesis-management/enums/thesis-document.enum';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import slugify from 'slugify';
import * as PizZip from 'pizzip';
import * as Docxtemplater from 'docxtemplater';

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
    template: JsonMappingWordSingleType,
  ): Promise<Partial<Express.Multer.File>> {
    try {
      Logger.verbose(
        `Exporting Word file ${templateFile.originalname} with template ${JSON.stringify(template)}`,
        'WordStrategy.exportSingle',
      );
      // 1. Determine output file name
      Logger.verbose(
        `Step 1 - Generating output name for Word file ${templateFile.originalname}`,
        'WordStrategy.exportSingle',
      );
      let wordOutputName = '';
      if (template.config?.nameformat) {
        for (const element of template.config.nameformat) {
          if (element[0] === '?') {
            const fieldname = element.slice(1);
            try {
              wordOutputName += slugify(String((data as Record<string, any>)[fieldname] || ''));
            } catch (err) {
              console.error('Error handle output name:', err);
              throw new InternalServerErrorException('Failed to handle output name');
            }
          } else {
            wordOutputName += element;
          }
        }
      } else {
        wordOutputName = `${Date.now()}`;
      }

      const docSpec = template.document;
      if (!docSpec.mapping || !docSpec.mapping.cells) {
        throw new InternalServerErrorException('Invalid JSON specification.');
      }

      // 2. Load the docx file as a template
      Logger.verbose(
        `Step 2 - Loading docx file as template for Word file ${templateFile.originalname}`,
        'WordStrategy.exportSingle',
      );
      if (!templateFile.buffer) {
        throw new InternalServerErrorException('Failed to load DOCX buffer');
      }
      let zip;
      try {
        zip = new PizZip(templateFile.buffer);
      } catch (error) {
        throw new InternalServerErrorException('Failed to load DOCX buffer');
      }
      let doc;
      try {
        doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      } catch (error) {
        throw new InternalServerErrorException('Failed to create Docxtemplater');
      }

      // 3. Prepare replacement data
      Logger.verbose(
        `Step 3 - Preparing replacement data for Word file ${templateFile.originalname}`,
        'WordStrategy.exportSingle',
      );
      const replacements: Record<string, string> = {};
      for (const cellmap of docSpec.mapping.cells) {
        if (!cellmap.cell) continue;
        let queryValue = '';
        if (cellmap.dbfield) {
          try {
            queryValue = (data as Record<string, any>)[cellmap.dbfield];
          } catch (err) {
            console.error('Error handle dbfield:', err);
          }
        }
        if (cellmap.const) {
          queryValue = cellmap.const;
        }
        if (cellmap.dbfields) {
          try {
            const srcfields = cellmap.dbfields;
            const fieldvalues: string[] = [];
            for (let i = 1; i < srcfields.length; i++) {
              fieldvalues.push((data as Record<string, any>)[srcfields[i]] ?? '');
            }
            queryValue = srcfields[0].replace(/{(\d+)}/g, (match, number) =>
              typeof fieldvalues[number] !== 'undefined' ? fieldvalues[number] : '',
            );
          } catch (err) {
            console.error('Error handle dbfields:', err);
          }
        }
        const placeholder = cellmap.cell.replace(/^[<{]+|[>}]$/g, '');
        replacements[placeholder] = queryValue;
      }

      // 4. Set the data for docxtemplater
      Logger.verbose(
        `Step 4 - Setting data for docxtemplater for Word file ${JSON.stringify(replacements)}`,
        'WordStrategy.exportSingle',
      );
      try {
        doc.render(replacements);
      } catch (error) {
        console.error('Error rendering docx:', error);
        throw new InternalServerErrorException('Failed to render docx');
      }

      // 5. Generate the new docx file as a buffer
      Logger.verbose(
        `Step 5 - Generating new docx file for Word file ${templateFile.originalname}`,
        'WordStrategy.exportSingle',
      );
      const generatedBuffer = doc.getZip().generate({ type: 'nodebuffer' });
      // Optionally, return both the buffer and the output name
      return {
        buffer: generatedBuffer,
        originalname: `${wordOutputName}.docx`,
        mimetype: templateFile.mimetype,
        size: generatedBuffer.length,
      };
    } catch (error) {
      Logger.error(error, 'WordStrategy.exportSingle');
      throw new Error(`Error exporting single to Word: ${error.message}`);
    } finally {
      Logger.verbose(
        `Finished exporting Word file ${templateFile.originalname}`,
        'WordStrategy.exportSingle',
      );
    }
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
    studentIds: string[],
    templatePath: string,
    specificationPath: string,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async exportSingleByScript(
    classId: string,
    studentIds: string[],
    templatePath: string,
    specificationPath: string,
    thesisType: ThesisDocumentEnum,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async importSingleByScript(
    inputPath: string,
    specificationPath: string,
    classId: string,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
