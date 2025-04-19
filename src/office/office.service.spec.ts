import { Test, TestingModule } from '@nestjs/testing';
import { OfficeService } from './office.service';
import { PythonScriptService } from '../python-script/python-script.service';
import { ProgressService } from '../progress/progress.service';
import { MailerService } from '../mailer/mailer.service';
import { forwardRef, Logger } from '@nestjs/common';
import { ExcelStrategy } from './strategies/excel.strategy';
import { WordStrategy } from './strategies/word.strategy';
import { HtmlStrategy } from './strategies/html.strategy';
import { OfficeTypeEnum } from './enums/office-type.enum';
import { ImportExportDynamicDto, ImportExportDynamicType } from './dtos/office.dto';
import { UserPayload } from '../auth/types/user-playload.type';
import { EProgressType } from '../progress/constant/progress.const';
import { ActionEnum } from '../template-specification/enums/action.enum';
import { CommonUtils } from '../utils/common.util';
import { PassThrough } from 'stream';

// Mock archiver
const mockArchive = {
  pipe: jest.fn().mockReturnThis(),
  append: jest.fn().mockReturnThis(),
  finalize: jest.fn(),
  on: jest.fn().mockImplementation(function (event, callback) {
    if (event === 'error') return this;
    return this;
  }),
};

const archiver = jest.fn().mockReturnValue(mockArchive);

// Mock dependencies
jest.mock('../python-script/python-script.service');
jest.mock('../progress/progress.service');
jest.mock('../mailer/mailer.service');
jest.mock('./strategies/excel.strategy');
jest.mock('./strategies/word.strategy');
jest.mock('./strategies/html.strategy');
jest.mock('../utils/common.util');
jest.mock('archiver', () => jest.fn(() => mockArchive));

describe('OfficeService', () => {
  let service: OfficeService;
  let pythonScriptService: PythonScriptService;
  let progressService: ProgressService;
  let mailerService: MailerService;
  let excelStrategy: ExcelStrategy;
  let wordStrategy: WordStrategy;
  let htmlStrategy: HtmlStrategy;

  beforeEach(async () => {
    // Create mock instances with mocked PythonScriptService
    const mockPythonScriptService = {} as PythonScriptService;
    excelStrategy = new ExcelStrategy(mockPythonScriptService);
    wordStrategy = new WordStrategy(mockPythonScriptService);
    htmlStrategy = new HtmlStrategy(mockPythonScriptService);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfficeService,
        {
          provide: PythonScriptService,
          useValue: {
            // Mock methods as needed
          },
        },
        {
          provide: ProgressService,
          useValue: {
            createProgress: jest.fn().mockResolvedValue([]),
            makeCompleted: jest.fn().mockResolvedValue({}),
            makeFailed: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<OfficeService>(OfficeService);
    pythonScriptService = module.get<PythonScriptService>(PythonScriptService);
    progressService = module.get<ProgressService>(ProgressService);
    mailerService = module.get<MailerService>(MailerService);

    // Mock strategies
    jest.spyOn(ExcelStrategy.prototype, 'importList').mockImplementation();
    jest.spyOn(ExcelStrategy.prototype, 'exportList').mockImplementation();
    jest.spyOn(ExcelStrategy.prototype, 'importSingle').mockImplementation();
    jest.spyOn(ExcelStrategy.prototype, 'exportSingle').mockImplementation();

    jest.spyOn(WordStrategy.prototype, 'importList').mockImplementation();
    jest.spyOn(WordStrategy.prototype, 'exportList').mockImplementation();
    jest.spyOn(WordStrategy.prototype, 'importSingle').mockImplementation();
    jest.spyOn(WordStrategy.prototype, 'exportSingle').mockImplementation();

    jest.spyOn(HtmlStrategy.prototype, 'importList').mockImplementation();
    jest.spyOn(HtmlStrategy.prototype, 'exportList').mockImplementation();
    jest.spyOn(HtmlStrategy.prototype, 'importSingle').mockImplementation();
    jest.spyOn(HtmlStrategy.prototype, 'exportSingle').mockImplementation();

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);

    // Setup PassThrough streams for tests
    const passThroughPrototype = PassThrough.prototype;
    jest.spyOn(passThroughPrototype, 'on').mockImplementation(function (event, callback) {
      if (event === 'data') {
        callback(Buffer.from('test data'));
      }
      if (event === 'end') {
        callback();
      }
      return this;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dynamic', () => {
    // Mock data for tests
    const mockProcessId = 'test-process-id';
    const mockUser: UserPayload = {
      email: 'test@example.com',
      role: 'teacher',
    };
    const mockRequest: ImportExportDynamicDto = {
      classId: 'test-class-id',
      importType: ImportExportDynamicType.LIST,
      exportType: ImportExportDynamicType.LIST,
      shareEmails: ['recipient1@example.com', 'recipient2@example.com'],
      inputFiles: [],
      specificationInput: '',
      templateFile: '',
      specificationOutput: '',
    };
    const mockInputFiles: Express.Multer.File[] = [
      {
        fieldname: 'file',
        originalname: 'test-input.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from('test input content'),
        size: 100,
      } as Express.Multer.File,
    ];
    const mockSpecificationInput: Express.Multer.File = {
      fieldname: 'specificationInput',
      originalname: 'spec-input.json',
      encoding: '7bit',
      mimetype: 'application/json',
      buffer: Buffer.from(JSON.stringify({ mapping: { field1: 'A1', field2: 'B1' } })),
      size: 100,
    } as Express.Multer.File;
    const mockTemplateFile: Express.Multer.File = {
      fieldname: 'template',
      originalname: 'template.xlsx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('template content'),
      size: 100,
    } as Express.Multer.File;
    const mockSpecificationOutput: Express.Multer.File = {
      fieldname: 'specificationOutput',
      originalname: 'spec-output.json',
      encoding: '7bit',
      mimetype: 'application/json',
      buffer: Buffer.from(JSON.stringify({ mapping: { field1: 'A1', field2: 'B1' } })),
      size: 100,
    } as Express.Multer.File;
    const mockUnzippedFiles: Express.Multer.File[] = [
      {
        fieldname: 'file',
        originalname: 'unzipped-file.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from('unzipped content'),
        size: 100,
      } as Express.Multer.File,
    ];
    const mockImportedData = [{ field1: 'value1', field2: 'value2' }];
    const mockExportedFile: Partial<Express.Multer.File> = {
      originalname: 'exported-file.xlsx',
      buffer: Buffer.from('exported content'),
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    // Successfully process dynamic export (LIST import and LIST export)
    it('should successfully process dynamic export with LIST import and LIST export', async () => {
      // Arrange
      mockRequest.importType = ImportExportDynamicType.LIST;
      mockRequest.exportType = ImportExportDynamicType.LIST;

      // Mock unzip
      (CommonUtils.unzip as jest.Mock).mockResolvedValue(mockUnzippedFiles);

      // Mock strategy methods
      jest.spyOn(service as any, 'getStrategyByMimeType').mockReturnValue({
        importList: jest.fn().mockResolvedValue(mockImportedData),
        exportList: jest.fn().mockResolvedValue(mockExportedFile),
      });

      // Act
      await service.dynamic(
        mockInputFiles,
        mockSpecificationInput,
        mockRequest,
        mockTemplateFile,
        mockSpecificationOutput,
        mockProcessId,
        mockUser,
      );

      // Assert
      expect(progressService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.OTHER_DOCUMENT,
          action: ActionEnum.EXPORT,
          createBy: mockUser.email,
          classId: mockRequest.classId,
        },
      ]);
      expect(CommonUtils.unzip).toHaveBeenCalledWith(mockInputFiles);
      expect(service['getStrategyByMimeType']).toHaveBeenCalledTimes(2);
      expect(mailerService.sendEmail).toHaveBeenCalledWith({
        to: mockRequest.shareEmails.join(','),
        subject: expect.stringContaining('Other Document Export'),
        content: 'Please find the attachment for the exported files',
        attachments: expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('exported_files_'),
          }),
        ]),
      });
      expect(progressService.makeCompleted).toHaveBeenCalledWith(
        { processId: mockProcessId },
        { error: {} },
      );
    });

    // Handle SINGLE import and SINGLE export
    it('should successfully process dynamic export with SINGLE import and SINGLE export', async () => {
      // Arrange
      mockRequest.importType = ImportExportDynamicType.SINGLE;
      mockRequest.exportType = ImportExportDynamicType.SINGLE;

      // Mock unzip
      (CommonUtils.unzip as jest.Mock).mockResolvedValue(mockUnzippedFiles);

      // Mock strategy methods
      jest.spyOn(service as any, 'getStrategyByMimeType').mockReturnValue({
        importSingle: jest.fn().mockResolvedValue(mockImportedData[0]),
        exportSingle: jest.fn().mockResolvedValue(mockExportedFile),
      });

      // Act
      await service.dynamic(
        mockInputFiles,
        mockSpecificationInput,
        mockRequest,
        mockTemplateFile,
        mockSpecificationOutput,
        mockProcessId,
        mockUser,
      );

      // Assert
      expect(progressService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.OTHER_DOCUMENT,
          action: ActionEnum.EXPORT,
          createBy: mockUser.email,
          classId: mockRequest.classId,
        },
      ]);
      expect(CommonUtils.unzip).toHaveBeenCalledWith(mockInputFiles);
      expect(service['getStrategyByMimeType']).toHaveBeenCalledTimes(2);
      expect(mailerService.sendEmail).toHaveBeenCalledWith({
        to: mockRequest.shareEmails.join(','),
        subject: expect.stringContaining('Other Document Export'),
        content: 'Please find the attachment for the exported files',
        attachments: expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('exported_files_'),
          }),
        ]),
      });
      expect(progressService.makeCompleted).toHaveBeenCalledWith(
        { processId: mockProcessId },
        { error: {} },
      );
    });

    // Handle LIST import and SINGLE export
    it('should successfully process dynamic export with LIST import and SINGLE export', async () => {
      // Arrange
      mockRequest.importType = ImportExportDynamicType.LIST;
      mockRequest.exportType = ImportExportDynamicType.SINGLE;

      // Mock unzip
      (CommonUtils.unzip as jest.Mock).mockResolvedValue(mockUnzippedFiles);

      // Mock strategy methods
      jest.spyOn(service as any, 'getStrategyByMimeType').mockReturnValue({
        importList: jest.fn().mockResolvedValue(mockImportedData),
        exportSingle: jest.fn().mockResolvedValue(mockExportedFile),
      });

      // Act
      await service.dynamic(
        mockInputFiles,
        mockSpecificationInput,
        mockRequest,
        mockTemplateFile,
        mockSpecificationOutput,
        mockProcessId,
        mockUser,
      );

      // Assert
      expect(progressService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.OTHER_DOCUMENT,
          action: ActionEnum.EXPORT,
          createBy: mockUser.email,
          classId: mockRequest.classId,
        },
      ]);
      expect(CommonUtils.unzip).toHaveBeenCalledWith(mockInputFiles);
      expect(service['getStrategyByMimeType']).toHaveBeenCalledTimes(2);
      expect(mailerService.sendEmail).toHaveBeenCalledWith({
        to: mockRequest.shareEmails.join(','),
        subject: expect.stringContaining('Other Document Export'),
        content: 'Please find the attachment for the exported files',
        attachments: expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('exported_files_'),
          }),
        ]),
      });
      expect(progressService.makeCompleted).toHaveBeenCalledWith(
        { processId: mockProcessId },
        { error: {} },
      );
    });

    // Handle SINGLE import and LIST export
    it('should successfully process dynamic export with SINGLE import and LIST export', async () => {
      // Arrange
      mockRequest.importType = ImportExportDynamicType.SINGLE;
      mockRequest.exportType = ImportExportDynamicType.LIST;

      // Mock unzip
      (CommonUtils.unzip as jest.Mock).mockResolvedValue(mockUnzippedFiles);

      // Mock strategy methods
      jest.spyOn(service as any, 'getStrategyByMimeType').mockReturnValue({
        importSingle: jest.fn().mockResolvedValue(mockImportedData[0]),
        exportList: jest.fn().mockResolvedValue(mockExportedFile),
      });

      // Act
      await service.dynamic(
        mockInputFiles,
        mockSpecificationInput,
        mockRequest,
        mockTemplateFile,
        mockSpecificationOutput,
        mockProcessId,
        mockUser,
      );

      // Assert
      expect(progressService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.OTHER_DOCUMENT,
          action: ActionEnum.EXPORT,
          createBy: mockUser.email,
          classId: mockRequest.classId,
        },
      ]);
      expect(CommonUtils.unzip).toHaveBeenCalledWith(mockInputFiles);
      expect(service['getStrategyByMimeType']).toHaveBeenCalledTimes(2);
      expect(mailerService.sendEmail).toHaveBeenCalledWith({
        to: mockRequest.shareEmails.join(','),
        subject: expect.stringContaining('Other Document Export'),
        content: 'Please find the attachment for the exported files',
        attachments: expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('exported_files_'),
          }),
        ]),
      });
      expect(progressService.makeCompleted).toHaveBeenCalledWith(
        { processId: mockProcessId },
        { error: {} },
      );
    });

    // Handle error during import
    it('should handle error during import', async () => {
      // Arrange
      mockRequest.importType = ImportExportDynamicType.LIST;
      mockRequest.exportType = ImportExportDynamicType.LIST;

      // Mock unzip
      (CommonUtils.unzip as jest.Mock).mockResolvedValue(mockUnzippedFiles);

      // Mock strategy methods with error
      const importError = new Error('Import failed');
      jest.spyOn(service as any, 'getStrategyByMimeType').mockReturnValue({
        importList: jest.fn().mockRejectedValue(importError),
      });

      // Act
      await service.dynamic(
        mockInputFiles,
        mockSpecificationInput,
        mockRequest,
        mockTemplateFile,
        mockSpecificationOutput,
        mockProcessId,
        mockUser,
      );

      // Assert
      expect(progressService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.OTHER_DOCUMENT,
          action: ActionEnum.EXPORT,
          createBy: mockUser.email,
          classId: mockRequest.classId,
        },
      ]);
      expect(CommonUtils.unzip).toHaveBeenCalledWith(mockInputFiles);
      expect(service['getStrategyByMimeType']).toHaveBeenCalledTimes(1);
      expect(Logger.error).toHaveBeenCalledWith(
        importError.message,
        expect.any(String),
        'OfficeService.dynamic',
      );
      expect(progressService.makeFailed).toHaveBeenCalledWith(
        { processId: mockProcessId },
        { error: { unknown: importError.message } },
      );
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });

    // Handle error during export
    it('should handle error during export', async () => {
      // Arrange
      mockRequest.importType = ImportExportDynamicType.LIST;
      mockRequest.exportType = ImportExportDynamicType.LIST;

      // Mock unzip
      (CommonUtils.unzip as jest.Mock).mockResolvedValue(mockUnzippedFiles);

      // Mock strategy methods with error during export
      const exportError = new Error('Export failed');
      const mockStrategy = {
        importList: jest.fn().mockResolvedValue(mockImportedData),
        exportList: jest.fn().mockRejectedValue(exportError),
      };
      jest.spyOn(service as any, 'getStrategyByMimeType').mockReturnValue(mockStrategy);

      // Act
      await service.dynamic(
        mockInputFiles,
        mockSpecificationInput,
        mockRequest,
        mockTemplateFile,
        mockSpecificationOutput,
        mockProcessId,
        mockUser,
      );

      // Assert
      expect(progressService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.OTHER_DOCUMENT,
          action: ActionEnum.EXPORT,
          createBy: mockUser.email,
          classId: mockRequest.classId,
        },
      ]);
      expect(CommonUtils.unzip).toHaveBeenCalledWith(mockInputFiles);
      expect(service['getStrategyByMimeType']).toHaveBeenCalledTimes(2);
      expect(Logger.error).toHaveBeenCalledWith(
        exportError.message,
        expect.any(String),
        'OfficeService.dynamic',
      );
      expect(progressService.makeFailed).toHaveBeenCalledWith(
        { processId: mockProcessId },
        { error: { unknown: exportError.message } },
      );
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });

    // Handle error during email sending
    it('should handle error during email sending', async () => {
      // Arrange
      mockRequest.importType = ImportExportDynamicType.LIST;
      mockRequest.exportType = ImportExportDynamicType.LIST;

      // Mock unzip
      (CommonUtils.unzip as jest.Mock).mockResolvedValue(mockUnzippedFiles);

      // Mock strategy methods
      jest.spyOn(service as any, 'getStrategyByMimeType').mockReturnValue({
        importList: jest.fn().mockResolvedValue(mockImportedData),
        exportList: jest.fn().mockResolvedValue(mockExportedFile),
      });

      // Mock email error
      const emailError = new Error('Email sending failed');
      jest.spyOn(mailerService, 'sendEmail').mockRejectedValue(emailError);

      // Act
      await service.dynamic(
        mockInputFiles,
        mockSpecificationInput,
        mockRequest,
        mockTemplateFile,
        mockSpecificationOutput,
        mockProcessId,
        mockUser,
      );

      // Assert
      expect(progressService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.OTHER_DOCUMENT,
          action: ActionEnum.EXPORT,
          createBy: mockUser.email,
          classId: mockRequest.classId,
        },
      ]);
      expect(CommonUtils.unzip).toHaveBeenCalledWith(mockInputFiles);
      expect(service['getStrategyByMimeType']).toHaveBeenCalledTimes(2);
      expect(mailerService.sendEmail).toHaveBeenCalled();
      expect(Logger.error).toHaveBeenCalledWith(
        emailError.message,
        expect.any(String),
        'OfficeService.dynamic',
      );
      expect(progressService.makeFailed).toHaveBeenCalledWith(
        { processId: mockProcessId },
        { error: { unknown: emailError.message } },
      );
    });
  });
});
