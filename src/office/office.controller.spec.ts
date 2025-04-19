import { Test, TestingModule } from '@nestjs/testing';
import { OfficeController } from './office.controller';
import { OfficeService } from './office.service';
import { ImportExportDynamicDto, ImportExportDynamicType } from './dtos/office.dto';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { ProgressService } from 'src/progress/progress.service';
import { Logger } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';

describe('OfficeController', () => {
  let controller: OfficeController;
  let officeService: OfficeService;

  // Mock data
  const mockUserPayload: UserPayload = {
    email: 'teacher@example.com',
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

  const mockFiles = {
    inputFiles: [
      {
        fieldname: 'inputFiles',
        originalname: 'test-input.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from('test input content'),
        size: 100,
      },
    ] as Express.Multer.File[],
    templateFile: [
      {
        fieldname: 'templateFile',
        originalname: 'template.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from('template content'),
        size: 100,
      },
    ] as Express.Multer.File[],
    specificationInput: [
      {
        fieldname: 'specificationInput',
        originalname: 'spec-input.json',
        encoding: '7bit',
        mimetype: 'application/json',
        buffer: Buffer.from(JSON.stringify({ mapping: { field1: 'A1', field2: 'B1' } })),
        size: 100,
      },
    ] as Express.Multer.File[],
    specificationOutput: [
      {
        fieldname: 'specificationOutput',
        originalname: 'spec-output.json',
        encoding: '7bit',
        mimetype: 'application/json',
        buffer: Buffer.from(JSON.stringify({ mapping: { field1: 'A1', field2: 'B1' } })),
        size: 100,
      },
    ] as Express.Multer.File[],
  };

  const mockProcessId = 'test-process-id';

  beforeEach(async () => {
    // Mock ProgressService.generateId
    jest.spyOn(ProgressService, 'generateId').mockReturnValue(mockProcessId);

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OfficeController],
      providers: [
        {
          provide: OfficeService,
          useValue: {
            dynamic: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<OfficeController>(OfficeController);
    officeService = module.get<OfficeService>(OfficeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('importExportDynamic', () => {
    // Scenario 1: Successfully process import-export request
    it('should successfully process import-export request', async () => {
      // Act
      const result = await controller.importExportDynamic(mockFiles, mockRequest, mockUserPayload);

      // Assert
      expect(ProgressService.generateId).toHaveBeenCalledWith('import-export-dynamic-manual');
      expect(officeService.dynamic).toHaveBeenCalledWith(
        mockFiles.inputFiles,
        mockFiles.specificationInput[0],
        mockRequest,
        mockFiles.templateFile[0],
        mockFiles.specificationOutput[0],
        mockProcessId,
        mockUserPayload,
      );
      expect(result).toEqual({
        status: 'processing',
        message: 'Processing import export dynamic',
        data: {
          processId: mockProcessId,
        },
      });
    });

    // Scenario 2: Missing required files
    it('should throw an error when required files are missing', async () => {
      // Arrange
      const incompleteFiles = {
        inputFiles: [] as Express.Multer.File[],
        templateFile: mockFiles.templateFile,
        specificationInput: mockFiles.specificationInput,
        specificationOutput: mockFiles.specificationOutput,
      };

      // Act & Assert
      await expect(
        controller.importExportDynamic(incompleteFiles, mockRequest, mockUserPayload),
      ).rejects.toThrow(
        'Input files and template file and specificationInput and specificationOutput are required',
      );
      expect(officeService.dynamic).not.toHaveBeenCalled();
    });

    // Scenario 3: Error handling during processing
    it('should handle errors during processing', async () => {
      // Arrange
      const error = new Error('Processing failed');
      jest.spyOn(officeService, 'dynamic').mockRejectedValueOnce(error);

      // Act
      const result = await controller.importExportDynamic(mockFiles, mockRequest, mockUserPayload);

      // Assert
      expect(Logger.error).toHaveBeenCalledWith(error, 'OfficeController.importExportDynamic');
      expect(result).toEqual({
        status: 'processing',
        message: 'Processing import export dynamic',
        data: {
          processId: mockProcessId,
        },
      });
    });

    // Scenario 4: Verify correct process ID generation
    it('should generate a process ID with the correct prefix', async () => {
      // Act
      await controller.importExportDynamic(mockFiles, mockRequest, mockUserPayload);

      // Assert
      expect(ProgressService.generateId).toHaveBeenCalledWith('import-export-dynamic-manual');
    });

    // Scenario 5: Verify service method called correctly
    it('should call the service method with correct parameters', async () => {
      // Arrange
      const customRequest = {
        ...mockRequest,
        importType: ImportExportDynamicType.SINGLE,
        exportType: ImportExportDynamicType.SINGLE,
      };

      // Act
      await controller.importExportDynamic(mockFiles, customRequest, mockUserPayload);

      // Assert
      expect(officeService.dynamic).toHaveBeenCalledWith(
        mockFiles.inputFiles,
        mockFiles.specificationInput[0],
        customRequest,
        mockFiles.templateFile[0],
        mockFiles.specificationOutput[0],
        mockProcessId,
        mockUserPayload,
      );
    });
  });
});
