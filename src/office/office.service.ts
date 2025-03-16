import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { OfficeStrategy } from './interfaces/office.interface';
import { OfficeTypeEnum } from './enums/office-type.enum';
import { ExcelStrategy } from './strategies/excel.strategy';
import { WordStrategy } from './strategies/word.strategy';
import { HtmlStrategy } from './strategies/html.strategy';
import { MimeType } from 'src/template-specification/constants/mime-type.const';
import { FileTypes } from 'src/template-specification/enums/file-type.enum';
import { JsonMappingListType } from './types/json-mapping-list.type';
import { JsonMappingSingleType } from 'src/template-specification/types/json.type';
import { ImportExportDynamicDto, ImportExportDynamicType } from './dtos/office.dto';
import { CommonUtils } from 'src/utils/common.util';
import { PythonScriptService } from 'src/python-script/python-script.service';
import { FileExtension } from 'src/template-specification/constants/extension.const';
import { ThesisDocumentEnum } from 'src/thesis-management/enums/thesis-document.enum';
import { ProgressService } from 'src/progress/progress.service';
import { ActionEnum } from 'src/template-specification/enums/action.enum';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { EProgressType } from 'src/progress/constant/progress.const';
import { MailerService } from 'src/mailer/mailer.service';
import { PassThrough, Readable } from 'stream';
const archiver = require('archiver');

@Injectable()
export class OfficeService {
  private officeStrategy: Record<string, OfficeStrategy> = {};
  constructor(
    private readonly pythonScriptService: PythonScriptService,
    @Inject(forwardRef(() => ProgressService))
    private readonly progressService: ProgressService,
    private readonly mailerService: MailerService,
  ) {
    this.use(OfficeTypeEnum.EXCEL, new ExcelStrategy(pythonScriptService));
    this.use(OfficeTypeEnum.WORD, new WordStrategy(pythonScriptService));
    this.use(OfficeTypeEnum.HTML, new HtmlStrategy(pythonScriptService));
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

  private getStrategyByFileExtension(extension: string): OfficeStrategy {
    if (FileExtension[FileTypes.EXCEL].includes(extension)) {
      return this.getStrategy(OfficeTypeEnum.EXCEL);
    } else if (FileExtension[FileTypes.WORD].includes(extension)) {
      return this.getStrategy(OfficeTypeEnum.WORD);
    } else if (FileExtension[FileTypes.HTML].includes(extension)) {
      return this.getStrategy(OfficeTypeEnum.HTML);
    } else {
      throw new Error(`Strategy not found for file extension ${extension}`);
    }
  }

  private getFileExtension(filePath: string): string {
    return filePath.split('/').pop()?.split('.').pop() || '';
  }

  private getStrategy(name: string): OfficeStrategy {
    if (!this.officeStrategy[name]) {
      throw new Error(`Strategy ${name} not found`);
    }
    return this.officeStrategy[name];
  }

  async importList<T extends any>(
    file: Express.Multer.File,
    template: JsonMappingListType,
  ): Promise<T[]> {
    const strategy = this.getStrategyByMimeType(file.mimetype);
    return await strategy.importList<T>(file, template);
  }

  async exportList<T extends any>(
    list: T[],
    templateFile: Express.Multer.File,
    template: JsonMappingListType,
  ): Promise<Partial<Express.Multer.File>> {
    const strategy = this.getStrategyByMimeType(templateFile.mimetype);
    return await strategy.exportList<T>(list, templateFile, template);
  }

  async exportSingle<T extends any>(
    data: T,
    templateFile: Partial<Express.Multer.File>,
    template: JsonMappingSingleType,
  ): Promise<Partial<Express.Multer.File>> {
    const strategy = this.getStrategyByMimeType(templateFile.mimetype!);
    return await strategy.exportSingle<T>(data, templateFile, template);
  }

  async importSingle<T extends any>(
    file: Express.Multer.File,
    template: JsonMappingSingleType,
  ): Promise<T> {
    const strategy = this.getStrategyByMimeType(file.mimetype);
    return await strategy.importSingle<T>(file, template);
  }

  async dynamic(
    inputFiles: Express.Multer.File[],
    specificationInput: Express.Multer.File,
    request: ImportExportDynamicDto,
    templateFile: Express.Multer.File,
    specificationOutput: Express.Multer.File,
    processId: string,
    user: UserPayload,
  ): Promise<void> {
    const errorCollector: Record<string, any> = {};
    try {
      await this.progressService.createProgress([
        {
          processId,
          type: EProgressType.OTHER_DOCUMENT,
          action: ActionEnum.EXPORT,
          createBy: user.email,
          classId: request.classId,
        },
      ]);
      const inputData = [];
      const unzipInputFiles = await CommonUtils.unzip(inputFiles);
      if (request.importType === ImportExportDynamicType.LIST) {
        for (const file of unzipInputFiles) {
          const data = await this.importList<any>(
            file,
            JSON.parse(specificationInput.buffer.toString()),
          );
          data.map((item) => {
            if (item && Object.keys(item).length) inputData.push(item);
          });
        }
      } else {
        for (const file of unzipInputFiles) {
          const data = await this.importSingle<any>(
            file,
            JSON.parse(specificationInput.buffer.toString()),
          );
          if (data && Object.keys(data).length) inputData.push(data);
        }
      }
      const outputData: Express.Multer.File[] = [];
      if (request.exportType === ImportExportDynamicType.LIST) {
        const data = await this.exportList<any>(
          inputData,
          templateFile,
          JSON.parse(specificationOutput.buffer.toString()),
        );
        outputData.push(data as Express.Multer.File);
      } else {
        for (const data of inputData) {
          const output = await this.exportSingle<any>(
            data,
            templateFile,
            JSON.parse(specificationOutput.buffer.toString()),
          );
          outputData.push(output as Express.Multer.File);
        }
      }
      // Zip to send mail
      // Tạo một stream để lưu dữ liệu zip
      const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const passThrough = new PassThrough();

        passThrough.on('data', (chunk) => chunks.push(chunk));
        passThrough.on('end', () => resolve(Buffer.concat(chunks)));
        passThrough.on('error', reject);

        const archive = archiver('zip', {
          zlib: { level: 9 },
        });

        archive.on('error', reject);

        // Pipe archive vào passThrough
        archive.pipe(passThrough);

        // Thêm các file vào archive
        outputData.forEach((file) => {
          archive.append(file.buffer, { name: file.originalname });
        });

        // Kết thúc archiver để hoàn thành quá trình
        archive.finalize();
      });

      await this.mailerService.sendEmail({
        to: request.shareEmails.join(','),
        subject: `Other Document Export - ${new Date().toLocaleString()}`,
        content: 'Please find the attachment for the exported files',
        attachments: [
          {
            filename: `exported_files_${Date.now()}.zip`,
            content: zipBuffer,
          },
        ],
      });

      await this.progressService.makeCompleted({ processId }, { error: errorCollector });
    } catch (error) {
      Logger.error(error.message, error.stack, 'OfficeService.dynamic');
      errorCollector['unknown'] = error.message;
      await this.progressService.makeFailed({ processId }, { error: errorCollector });
    }
  }

  async importListByScript(
    inputPath: string,
    specificationPath: string,
    classId: string,
  ): Promise<void> {
    const fileExt = this.getFileExtension(inputPath);
    const strategy = this.getStrategyByFileExtension(fileExt);
    return await strategy.importListByScript(inputPath, specificationPath, classId);
  }

  async exportListByScript(
    classId: string,
    studentIds: string[],
    templatePath: string,
    specificationPath: string,
  ): Promise<void> {
    const fileExt = this.getFileExtension(templatePath);
    const strategy = this.getStrategyByFileExtension(fileExt);
    return await strategy.exportListByScript(classId, studentIds, templatePath, specificationPath);
  }

  async exportSingleByScript(
    classId: string,
    studentIds: string[],
    templatePath: string,
    specificationPath: string,
    thesisType: ThesisDocumentEnum,
    extraData?: any,
  ): Promise<void> {
    const fileExt = this.getFileExtension(templatePath);
    const strategy = this.getStrategyByFileExtension(fileExt);
    return await strategy.exportSingleByScript(
      classId,
      studentIds,
      templatePath,
      specificationPath,
      thesisType,
      extraData,
    );
  }

  async importSingleByScript(
    inputPath: string,
    specificationPath: string,
    classId: string,
  ): Promise<void> {
    const fileExt = this.getFileExtension(inputPath);
    const strategy = this.getStrategyByFileExtension(fileExt);
    return await strategy.importSingleByScript(inputPath, specificationPath, classId);
  }
}
