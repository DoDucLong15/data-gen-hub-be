import { Test, TestingModule } from '@nestjs/testing';
import { StudentServiceV2 } from './student-v2.service';
import { BadRequestException, Logger } from '@nestjs/common';
import { OfficeService } from '../office/office.service';
import { ClassService } from '../class/class.service';
import { TemplateSpecificationService } from '../template-specification/template-specification.service';
import { StorageService } from '../storage/storage.service';
import { ProgressService } from '../progress/progress.service';
import { UsersService } from '../users/users.service';
import { UserPayload } from '../auth/types/user-playload.type';
import { ImportListStudentRequest } from '../students/dtos/import-data.dto';
import {
  ExportListStudentRequestV2,
  ExportStudentFormDataRequestV2,
} from '../students/dtos/export-data.dto';
import { ImportStudentFormDataRequestV2 } from '../students/dtos/import-data.dto';
import { CommonUtils } from '../utils/common.util';
import { AsyncUtils } from '../utils/async.utils';
import { ActionEnum } from '../template-specification/enums/action.enum';
import { SpecificationNameEnum } from '../template-specification/constants/default.const';
import { EProgressType } from '../progress/constant/progress.const';
import { ClassEntity } from '../class/entities/class.entity';
import { TemplateSpecificationEntity } from '../template-specification/entities/template-specification.entity';
import { StorageUploadResult } from '../storage/types/storage.type';
import { Response } from 'express';
import { Readable } from 'stream';
import { ThesisDocumentEnum } from '../thesis-management/enums/thesis-document.enum';

describe('StudentServiceV2', () => {
  let service: StudentServiceV2;
  let officeService: OfficeService;
  let classService: ClassService;
  let specificationService: TemplateSpecificationService;
  let storageService: StorageService;
  let processService: ProgressService;
  let userService: UsersService;

  // Mock data
  const mockUser: UserPayload = {
    email: 'teacher@example.com',
    role: 'teacher',
  };

  const mockClass = {
    id: 'class-id-1',
    name: 'Test Class',
    classCode: 'TC001',
    courseCode: 'CC001',
    semester: '2023-2024',
    teacher: {
      email: 'teacher@example.com',
    },
    studentPaths: ['path1', 'path2'],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as ClassEntity;

  const mockSpecification = {
    id: 'spec-id-1',
    name: SpecificationNameEnum.DSSV,
    action: ActionEnum.IMPORT,
    classId: 'class-id-1',
    jsonFile: 'json-file-path',
    templateFile: 'template-file-path',
    class: {} as ClassEntity,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as TemplateSpecificationEntity;

  const mockRequest: ImportListStudentRequest = {
    classId: 'class-id-1',
    files: [],
  };

  const mockFiles = [
    {
      fieldname: 'files',
      originalname: 'test1.xlsx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('test'),
      size: 100,
    },
    {
      fieldname: 'files',
      originalname: 'test2.xlsx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('test'),
      size: 100,
    },
  ] as Express.Multer.File[];

  const mockUnzippedFiles = [
    {
      originalname: 'test1.xlsx',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('test'),
    },
    {
      originalname: 'test2.xlsx',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('test'),
    },
  ] as Express.Multer.File[];

  const mockUploadResponse = {
    key: 'uploaded-file-path',
    url: 'https://example.com/uploaded-file-path',
  } as StorageUploadResult;

  const mockProcessId = 'process-id-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentServiceV2,
        {
          provide: OfficeService,
          useValue: {
            importListByScript: jest.fn().mockResolvedValue(undefined),
            exportListByScript: jest.fn().mockResolvedValue(undefined),
            exportSingleByScript: jest.fn().mockResolvedValue(undefined),
            importSingleByScript: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ClassService,
          useValue: {
            getOne: jest.fn(),
            update: jest.fn().mockResolvedValue(mockClass),
          },
        },
        {
          provide: TemplateSpecificationService,
          useValue: {
            getOne: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            uploadDataToFile: jest.fn(),
            deleteFile: jest.fn().mockResolvedValue(true),
            downloadFile: jest.fn(),
            getMetadata: jest.fn(),
          },
        },
        {
          provide: ProgressService,
          useValue: {
            createProgress: jest.fn().mockResolvedValue(undefined),
            makeCompleted: jest.fn().mockResolvedValue(undefined),
            makeFailed: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StudentServiceV2>(StudentServiceV2);
    officeService = module.get<OfficeService>(OfficeService);
    classService = module.get<ClassService>(ClassService);
    specificationService = module.get<TemplateSpecificationService>(TemplateSpecificationService);
    storageService = module.get<StorageService>(StorageService);
    processService = module.get<ProgressService>(ProgressService);
    userService = module.get<UsersService>(UsersService);

    // Mock static methods
    jest.spyOn(ProgressService, 'generateId').mockReturnValue(mockProcessId);
    jest.spyOn(CommonUtils, 'unzip').mockResolvedValue(mockUnzippedFiles);
    jest.spyOn(CommonUtils, 'getStudentFilePath').mockReturnValue('student-file-path');
    jest.spyOn(AsyncUtils, 'delay').mockResolvedValue(undefined);

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'verbose').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('importListStudents', () => {
    // Successfully import student list
    it('should successfully import student list', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue(mockSpecification);
      jest.spyOn(storageService, 'uploadDataToFile').mockResolvedValue(mockUploadResponse);

      // Act
      const result = await service.importListStudents(mockFiles, mockRequest, mockUser);

      // Assert
      expect(processService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.STUDENT_LIST,
          action: ActionEnum.IMPORT,
          createBy: mockUser.email,
          classId: mockRequest.classId,
        },
      ]);
      expect(classService.getOne).toHaveBeenCalledWith({
        where: {
          id: mockRequest.classId,
          teacher: {
            email: mockUser.email,
          },
        },
      });
      expect(specificationService.getOne).toHaveBeenCalledWith({
        where: {
          classId: mockRequest.classId,
          action: ActionEnum.IMPORT,
          name: SpecificationNameEnum.DSSV,
        },
      });
      expect(CommonUtils.unzip).toHaveBeenCalledWith(mockFiles);
      expect(storageService.uploadDataToFile).toHaveBeenCalledTimes(2);
      expect(officeService.importListByScript).toHaveBeenCalledTimes(2);
      expect(classService.update).toHaveBeenCalledWith(
        {
          id: mockRequest.classId,
          studentPaths: expect.arrayContaining([
            ...mockClass.studentPaths,
            mockUploadResponse.key,
            mockUploadResponse.key,
          ]),
        },
        mockUser,
      );
      expect(processService.makeCompleted).toHaveBeenCalledWith(
        { processId: mockProcessId },
        { error: {} },
      );
      expect(result).toEqual({
        status: 'success',
        message: 'Imported students successfully',
      });
    });

    // Handle empty files array
    it('should return error response when files array is empty', async () => {
      // Act
      const result = await service.importListStudents([], mockRequest, mockUser);

      // Assert
      expect(processService.createProgress).toHaveBeenCalled();
      expect(processService.makeFailed).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'error',
        message: 'Error importing students: Files are required',
        data: [],
      });
    });

    // Handle class not found
    it('should return error response when class is not found', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(null);

      // Act
      const result = await service.importListStudents(mockFiles, mockRequest, mockUser);

      // Assert
      expect(processService.createProgress).toHaveBeenCalled();
      expect(classService.getOne).toHaveBeenCalledWith({
        where: {
          id: mockRequest.classId,
          teacher: {
            email: mockUser.email,
          },
        },
      });
      expect(processService.makeFailed).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'error',
        message: `Error importing students: Class ${mockRequest.classId} not found`,
        data: [],
      });
    });

    // Handle specification not found
    it('should return error response when specification is not found', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue(null);

      // Act
      const result = await service.importListStudents(mockFiles, mockRequest, mockUser);

      // Assert
      expect(processService.createProgress).toHaveBeenCalled();
      expect(classService.getOne).toHaveBeenCalled();
      expect(specificationService.getOne).toHaveBeenCalledWith({
        where: {
          classId: mockRequest.classId,
          action: ActionEnum.IMPORT,
          name: SpecificationNameEnum.DSSV,
        },
      });
      expect(processService.makeFailed).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'error',
        message: 'Error importing students: Specification not found',
        data: [],
      });
    });

    // Handle file upload error
    it('should handle file upload errors and continue processing other files', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue(mockSpecification);

      // First file upload succeeds, second fails
      jest
        .spyOn(storageService, 'uploadDataToFile')
        .mockResolvedValueOnce(mockUploadResponse)
        .mockRejectedValueOnce(new Error('Upload failed'));

      // Act
      const result = await service.importListStudents(mockFiles, mockRequest, mockUser);

      // Assert
      expect(storageService.uploadDataToFile).toHaveBeenCalledTimes(2);
      expect(officeService.importListByScript).toHaveBeenCalledTimes(1);
      expect(storageService.deleteFile).not.toHaveBeenCalled(); // No need to delete on success
      expect(classService.update).toHaveBeenCalledWith(
        {
          id: mockRequest.classId,
          studentPaths: expect.arrayContaining([...mockClass.studentPaths, mockUploadResponse.key]),
        },
        mockUser,
      );
      expect(processService.makeCompleted).toHaveBeenCalledWith(
        { processId: mockProcessId },
        {
          error: expect.objectContaining({
            [mockUnzippedFiles[1].originalname]: expect.any(Error),
          }),
        },
      );
      expect(result).toEqual({
        status: 'success',
        message: 'Imported students successfully',
      });
    });

    // Update class with new paths
    it('should update class with new student paths', async () => {
      // Arrange
      const classWithoutPaths = {
        ...mockClass,
        studentPaths: null,
      } as unknown as ClassEntity;

      jest.spyOn(classService, 'getOne').mockResolvedValue(classWithoutPaths);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue(mockSpecification);
      jest.spyOn(storageService, 'uploadDataToFile').mockResolvedValue(mockUploadResponse);

      // Act
      const result = await service.importListStudents(mockFiles, mockRequest, mockUser);

      // Assert
      expect(classService.update).toHaveBeenCalledWith(
        {
          id: mockRequest.classId,
          studentPaths: [mockUploadResponse.key],
        },
        mockUser,
      );
      expect(result).toEqual({
        status: 'success',
        message: 'Imported students successfully',
      });
    });

    // Handle progress service errors
    it('should handle progress service errors', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue(mockSpecification);
      jest.spyOn(storageService, 'uploadDataToFile').mockResolvedValue(mockUploadResponse);
      jest
        .spyOn(processService, 'createProgress')
        .mockRejectedValue(new Error('Progress service error'));

      // Act
      const result = await service.importListStudents(mockFiles, mockRequest, mockUser);

      // Assert
      expect(processService.createProgress).toHaveBeenCalled();
      expect(processService.makeFailed).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'error',
        message: 'Error importing students: Progress service error',
        data: [],
      });
    });
  });

  describe('exportListStudent', () => {
    let mockResponse: Partial<Response>;
    const mockExportRequest: ExportListStudentRequestV2 = {
      classId: 'class-id-1',
      studentIds: ['student-id-1', 'student-id-2'],
    };

    const mockExportSpecification = {
      ...mockSpecification,
      action: ActionEnum.EXPORT,
    };

    const mockClassWithOutput = {
      ...mockClass,
      outputPath: 'output-file-path',
    };

    const mockFileStream = new Readable();
    mockFileStream.push('test file content');
    mockFileStream.push(null);

    const mockMetadata = {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'path/to/output.xlsx',
    };

    beforeEach(() => {
      mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock streamToBuffer function
      jest
        .spyOn(require('../storage/helpers/convert.helper'), 'streamToBuffer')
        .mockResolvedValue(Buffer.from('test file content'));
    });

    // Successfully export student list
    it('should successfully export student list', async () => {
      // Arrange
      jest
        .spyOn(classService, 'getOne')
        .mockResolvedValueOnce(mockClass)
        .mockResolvedValueOnce(mockClassWithOutput);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue(mockExportSpecification);
      jest.spyOn(officeService, 'exportListByScript').mockResolvedValue(undefined);
      jest.spyOn(storageService, 'downloadFile').mockResolvedValue(mockFileStream);
      jest.spyOn(storageService, 'getMetadata').mockResolvedValue(mockMetadata);
      jest.spyOn(storageService, 'deleteFile').mockResolvedValue(true);

      // Act
      await service.exportListStudent(mockExportRequest, mockUser, mockResponse as Response);

      // Assert
      expect(processService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.STUDENT_LIST,
          action: ActionEnum.EXPORT,
          createBy: mockUser.email,
          classId: mockExportRequest.classId,
        },
      ]);
      expect(classService.getOne).toHaveBeenCalledWith({
        where: {
          id: mockExportRequest.classId,
          teacher: {
            email: mockUser.email,
          },
        },
      });
      expect(specificationService.getOne).toHaveBeenCalledWith({
        where: {
          classId: mockExportRequest.classId,
          action: ActionEnum.EXPORT,
          name: SpecificationNameEnum.DSSV,
        },
      });
      expect(officeService.exportListByScript).toHaveBeenCalledWith(
        mockExportRequest.classId,
        mockExportRequest.studentIds,
        mockExportSpecification.templateFile,
        mockExportSpecification.jsonFile,
      );
      expect(storageService.downloadFile).toHaveBeenCalledWith('output-file-path');
      expect(storageService.getMetadata).toHaveBeenCalledWith('output-file-path');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="output-file-path"',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(mockResponse.send).toHaveBeenCalled();
      expect(processService.makeCompleted).toHaveBeenCalledWith(
        { processId: mockProcessId },
        { error: {} },
      );
    });

    // Class not found
    it('should return error when class is not found', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(null);

      // Act
      await service.exportListStudent(mockExportRequest, mockUser, mockResponse as Response);

      // Assert
      expect(processService.createProgress).toHaveBeenCalled();
      expect(classService.getOne).toHaveBeenCalledWith({
        where: {
          id: mockExportRequest.classId,
          teacher: {
            email: mockUser.email,
          },
        },
      });
      expect(processService.makeFailed).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: `Error exporting students: Class ${mockExportRequest.classId} not found`,
      });
    });

    // Specification not found
    it('should return error when specification is not found', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue(null);

      // Act
      await service.exportListStudent(mockExportRequest, mockUser, mockResponse as Response);

      // Assert
      expect(processService.createProgress).toHaveBeenCalled();
      expect(classService.getOne).toHaveBeenCalled();
      expect(specificationService.getOne).toHaveBeenCalledWith({
        where: {
          classId: mockExportRequest.classId,
          action: ActionEnum.EXPORT,
          name: SpecificationNameEnum.DSSV,
        },
      });
      expect(processService.makeFailed).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error exporting students: Specification not found',
      });
    });

    // File output not found
    it('should return error when file output is not found', async () => {
      // Arrange
      jest
        .spyOn(classService, 'getOne')
        .mockResolvedValueOnce(mockClass)
        .mockResolvedValueOnce({ ...mockClass, outputPath: '' });
      jest.spyOn(specificationService, 'getOne').mockResolvedValue(mockExportSpecification);
      jest.spyOn(officeService, 'exportListByScript').mockResolvedValue(undefined);

      // Act
      await service.exportListStudent(mockExportRequest, mockUser, mockResponse as Response);

      // Assert
      expect(processService.createProgress).toHaveBeenCalled();
      expect(officeService.exportListByScript).toHaveBeenCalled();
      expect(classService.getOne).toHaveBeenCalledTimes(2);
      expect(processService.makeCompleted).toHaveBeenCalledWith(
        { processId: mockProcessId },
        { error: { 'exist-output': 'Notfound file output' } },
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error exporting students: Notfound file output',
      });
    });

    // Error during export process
    it('should handle errors during the export process', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue(mockExportSpecification);
      jest.spyOn(officeService, 'exportListByScript').mockRejectedValue(new Error('Export failed'));

      // Act
      await service.exportListStudent(mockExportRequest, mockUser, mockResponse as Response);

      // Assert
      expect(processService.createProgress).toHaveBeenCalled();
      expect(classService.getOne).toHaveBeenCalled();
      expect(specificationService.getOne).toHaveBeenCalled();
      expect(officeService.exportListByScript).toHaveBeenCalled();
      expect(processService.makeFailed).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error exporting students: Export failed',
      });
    });
  });

  describe('generateStudentFormData', () => {
    // Test case 1: Successfully generate student form data
    it('should successfully generate student form data', async () => {
      // Arrange
      const request: ExportStudentFormDataRequestV2 = {
        classId: 'class-id-1',
        studentIds: ['student-1', 'student-2'],
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        thesisStartDate: '2023-01-01',
        thesisEndDate: '2023-06-30',
        teacherSignatureDate: '2023-07-01',
      };

      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue({
        ...mockSpecification,
        name: SpecificationNameEnum.PGNV,
        action: ActionEnum.EXPORT,
      });

      // Act
      const result = await service.generateStudentFormData(request, mockUser);

      // Assert
      expect(processService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.ASSIGNMENT_SHEET,
          action: ActionEnum.EXPORT,
          createBy: mockUser.email,
          classId: request.classId,
        },
      ]);

      expect(classService.getOne).toHaveBeenCalledWith({
        where: {
          id: request.classId,
          teacher: {
            email: mockUser.email,
          },
        },
      });

      expect(specificationService.getOne).toHaveBeenCalledWith({
        where: {
          classId: request.classId,
          action: ActionEnum.EXPORT,
          name: SpecificationNameEnum.PGNV,
        },
      });

      expect(officeService.exportSingleByScript).toHaveBeenCalledWith(
        request.classId,
        request.studentIds,
        mockSpecification.templateFile,
        mockSpecification.jsonFile,
        request.thesisDocType,
        {
          thesis_start_date: request.thesisStartDate,
          thesis_end_date: request.thesisEndDate,
          teacher_sign_date: request.teacherSignatureDate,
        },
      );

      expect(processService.makeCompleted).toHaveBeenCalledWith(
        { processId: mockProcessId },
        { error: {} },
      );

      expect(result).toEqual({
        status: 'success',
        message: 'Generating student form data successfully',
      });
    });

    // Test case 2: Handle missing class
    it('should return error response when class is not found', async () => {
      // Arrange
      const request: ExportStudentFormDataRequestV2 = {
        classId: 'non-existent-class',
        studentIds: ['student-1'],
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        thesisStartDate: '2023-01-01',
        thesisEndDate: '2023-06-30',
        teacherSignatureDate: '2023-07-01',
      };

      // Mock class service to return null
      jest.spyOn(classService, 'getOne').mockResolvedValueOnce(null);

      // Act
      const result = await service.generateStudentFormData(request, mockUser);

      // Assert
      expect(processService.createProgress).toHaveBeenCalled();
      expect(classService.getOne).toHaveBeenCalledWith({
        where: {
          id: request.classId,
          teacher: {
            email: mockUser.email,
          },
        },
      });
      expect(processService.makeFailed).toHaveBeenCalled();
      expect(officeService.exportSingleByScript).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: 'error',
        message: `Error generating student form data: Class ${request.classId} not found`,
      });
    });

    // Test case 3: Handle missing specification
    it('should return error response when specification is not found', async () => {
      // Arrange
      const request: ExportStudentFormDataRequestV2 = {
        classId: 'class-id-1',
        studentIds: ['student-1'],
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        thesisStartDate: '2023-01-01',
        thesisEndDate: '2023-06-30',
        teacherSignatureDate: '2023-07-01',
      };

      // Mock services
      jest.spyOn(classService, 'getOne').mockResolvedValueOnce(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValueOnce(null);

      // Act
      const result = await service.generateStudentFormData(request, mockUser);

      // Assert
      expect(processService.createProgress).toHaveBeenCalled();
      expect(classService.getOne).toHaveBeenCalled();
      expect(specificationService.getOne).toHaveBeenCalledWith({
        where: {
          classId: request.classId,
          action: ActionEnum.EXPORT,
          name: SpecificationNameEnum.PGNV,
        },
      });
      expect(processService.makeFailed).toHaveBeenCalled();
      expect(officeService.exportSingleByScript).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: 'error',
        message: 'Error generating student form data: Specification not found',
      });
    });

    // Test case 4: Process different thesis document types
    it('should handle different thesis document types correctly', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue({
        ...mockSpecification,
        action: ActionEnum.EXPORT,
      });

      // Test for GUIDANCE_REVIEW
      const guidanceReviewRequest = {
        classId: 'class-id-1',
        studentIds: ['student-1'],
        thesisDocType: ThesisDocumentEnum.GUIDANCE_REVIEW,
        teacherSignatureDate: '2023-07-01',
      } as ExportStudentFormDataRequestV2;

      await service.generateStudentFormData(guidanceReviewRequest, mockUser);

      expect(processService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.GUIDANCE_REVIEW,
          action: ActionEnum.EXPORT,
          createBy: mockUser.email,
          classId: guidanceReviewRequest.classId,
        },
      ]);

      expect(specificationService.getOne).toHaveBeenCalledWith({
        where: {
          classId: guidanceReviewRequest.classId,
          action: ActionEnum.EXPORT,
          name: SpecificationNameEnum.NXHD,
        },
      });

      // Test for SUPERVISORY_COMMENTS
      jest.clearAllMocks();
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue({
        ...mockSpecification,
        action: ActionEnum.EXPORT,
      });

      const supervisoryCommentsRequest = {
        classId: 'class-id-1',
        studentIds: ['student-1'],
        thesisDocType: ThesisDocumentEnum.SUPERVISORY_COMMENTS,
        teacherSignatureDate: '2023-07-01',
      } as ExportStudentFormDataRequestV2;

      await service.generateStudentFormData(supervisoryCommentsRequest, mockUser);

      expect(processService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.SUPERVISORY_COMMENTS,
          action: ActionEnum.EXPORT,
          createBy: mockUser.email,
          classId: supervisoryCommentsRequest.classId,
        },
      ]);

      expect(specificationService.getOne).toHaveBeenCalledWith({
        where: {
          classId: supervisoryCommentsRequest.classId,
          action: ActionEnum.EXPORT,
          name: SpecificationNameEnum.NXPB,
        },
      });
    });

    // Test case 5: Handle service errors
    it('should handle errors from office service', async () => {
      // Arrange
      const request: ExportStudentFormDataRequestV2 = {
        classId: 'class-id-1',
        studentIds: ['student-1'],
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        thesisStartDate: '2023-01-01',
        thesisEndDate: '2023-06-30',
        teacherSignatureDate: '2023-07-01',
      };

      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue({
        ...mockSpecification,
        name: SpecificationNameEnum.PGNV,
        action: ActionEnum.EXPORT,
      });

      const error = new Error('Export script failed');
      jest.spyOn(officeService, 'exportSingleByScript').mockRejectedValueOnce(error);

      // Act
      const result = await service.generateStudentFormData(request, mockUser);

      // Assert
      expect(processService.makeFailed).toHaveBeenCalledWith(
        { processId: mockProcessId },
        { error: { unknown: error } },
      );

      expect(result).toEqual({
        status: 'error',
        message: 'Error generating student form data: Export script failed',
      });
    });

    // Test case 6: Generate with custom process ID
    it('should use provided process ID instead of generating one', async () => {
      // Arrange
      const request: ExportStudentFormDataRequestV2 = {
        classId: 'class-id-1',
        studentIds: ['student-1'],
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        thesisStartDate: '2023-01-01',
        thesisEndDate: '2023-06-30',
        teacherSignatureDate: '2023-07-01',
      };

      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue({
        ...mockSpecification,
        name: SpecificationNameEnum.PGNV,
        action: ActionEnum.EXPORT,
      });

      const customProcessId = 'custom-process-id';

      // Act
      await service.generateStudentFormData(request, mockUser, customProcessId);

      // Assert
      expect(processService.createProgress).toHaveBeenCalledWith([
        {
          processId: customProcessId,
          type: EProgressType.ASSIGNMENT_SHEET,
          action: ActionEnum.EXPORT,
          createBy: mockUser.email,
          classId: request.classId,
        },
      ]);

      expect(processService.makeCompleted).toHaveBeenCalledWith(
        { processId: customProcessId },
        { error: {} },
      );
    });
  });

  describe('importStudentFormData', () => {
    const mockImportFormRequest: ImportStudentFormDataRequestV2 = {
      classId: 'class-id-1',
      thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
      files: [],
    };

    // Successfully import student form data
    it('should successfully import student form data', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue({
        ...mockSpecification,
        name: SpecificationNameEnum.PGNV,
      });
      jest.spyOn(storageService, 'uploadDataToFile').mockResolvedValue(mockUploadResponse);
      jest.spyOn(officeService, 'importSingleByScript').mockResolvedValue(undefined);
      jest.spyOn(Logger, 'debug').mockImplementation(() => undefined);

      // Act
      const result = await service.importStudentFormData(
        mockFiles,
        mockImportFormRequest,
        mockUser,
      );

      // Assert
      expect(processService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.ASSIGNMENT_SHEET,
          action: ActionEnum.IMPORT,
          createBy: mockUser.email,
          classId: mockImportFormRequest.classId,
        },
      ]);
      expect(classService.getOne).toHaveBeenCalledWith({
        where: {
          id: mockImportFormRequest.classId,
          teacher: {
            email: mockUser.email,
          },
        },
      });
      expect(specificationService.getOne).toHaveBeenCalledWith({
        where: {
          classId: mockImportFormRequest.classId,
          action: ActionEnum.IMPORT,
          name: SpecificationNameEnum.PGNV,
        },
      });
      expect(CommonUtils.unzip).toHaveBeenCalledWith(mockFiles);
      expect(storageService.uploadDataToFile).toHaveBeenCalledTimes(2);
      expect(officeService.importSingleByScript).toHaveBeenCalledTimes(2);
      expect(officeService.importSingleByScript).toHaveBeenCalledWith(
        mockUploadResponse.key,
        expect.any(String),
        mockImportFormRequest.classId,
      );
      expect(processService.makeCompleted).toHaveBeenCalledWith(
        { processId: mockProcessId },
        { error: {} },
      );
      expect(result).toEqual({
        status: 'success',
        message: 'Imported student form data successfully',
      });
    });

    // Handle empty files array
    it('should return error response when files array is empty', async () => {
      // Act
      const result = await service.importStudentFormData([], mockImportFormRequest, mockUser);

      // Assert
      expect(processService.createProgress).toHaveBeenCalled();
      expect(processService.makeFailed).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'error',
        message: 'Error importing student form data: Files are required',
      });
    });

    // Handle class not found
    it('should return error response when class is not found', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(null);

      // Act
      const result = await service.importStudentFormData(
        mockFiles,
        mockImportFormRequest,
        mockUser,
      );

      // Assert
      expect(processService.createProgress).toHaveBeenCalled();
      expect(classService.getOne).toHaveBeenCalledWith({
        where: {
          id: mockImportFormRequest.classId,
          teacher: {
            email: mockUser.email,
          },
        },
      });
      expect(processService.makeFailed).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'error',
        message: `Error importing student form data: Class ${mockImportFormRequest.classId} not found`,
      });
    });

    // Handle specification not found
    it('should return error response when specification is not found', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue(null);

      // Act
      const result = await service.importStudentFormData(
        mockFiles,
        mockImportFormRequest,
        mockUser,
      );

      // Assert
      expect(processService.createProgress).toHaveBeenCalled();
      expect(classService.getOne).toHaveBeenCalled();
      expect(specificationService.getOne).toHaveBeenCalledWith({
        where: {
          classId: mockImportFormRequest.classId,
          action: ActionEnum.IMPORT,
          name: SpecificationNameEnum.PGNV,
        },
      });
      expect(processService.makeFailed).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'error',
        message: 'Error importing student form data: Specification not found',
      });
    });

    // Test with different thesis document types
    it('should handle different thesis document types correctly', async () => {
      // Arrange
      const guidanceReviewRequest = {
        ...mockImportFormRequest,
        thesisDocType: ThesisDocumentEnum.GUIDANCE_REVIEW,
      };

      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue({
        ...mockSpecification,
        name: SpecificationNameEnum.NXHD,
      });
      jest.spyOn(storageService, 'uploadDataToFile').mockResolvedValue(mockUploadResponse);
      jest.spyOn(officeService, 'importSingleByScript').mockResolvedValue(undefined);
      jest.spyOn(Logger, 'debug').mockImplementation(() => undefined);

      // Act
      const result = await service.importStudentFormData(
        mockFiles,
        guidanceReviewRequest,
        mockUser,
      );

      // Assert
      expect(processService.createProgress).toHaveBeenCalledWith([
        {
          processId: mockProcessId,
          type: EProgressType.GUIDANCE_REVIEW,
          action: ActionEnum.IMPORT,
          createBy: mockUser.email,
          classId: guidanceReviewRequest.classId,
        },
      ]);
      expect(specificationService.getOne).toHaveBeenCalledWith({
        where: {
          classId: guidanceReviewRequest.classId,
          action: ActionEnum.IMPORT,
          name: SpecificationNameEnum.NXHD,
        },
      });
      expect(result).toEqual({
        status: 'success',
        message: 'Imported student form data successfully',
      });
    });

    // Handle file upload error
    it('should handle file upload errors and continue processing other files', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue({
        ...mockSpecification,
        name: SpecificationNameEnum.PGNV,
      });

      // First file upload succeeds, second fails
      jest
        .spyOn(storageService, 'uploadDataToFile')
        .mockResolvedValueOnce(mockUploadResponse)
        .mockRejectedValueOnce(new Error('Upload failed'));

      jest.spyOn(Logger, 'debug').mockImplementation(() => undefined);

      // Act
      const result = await service.importStudentFormData(
        mockFiles,
        mockImportFormRequest,
        mockUser,
      );

      // Assert
      expect(storageService.uploadDataToFile).toHaveBeenCalledTimes(2);
      expect(officeService.importSingleByScript).toHaveBeenCalledTimes(1);
      expect(processService.makeCompleted).toHaveBeenCalledWith(
        { processId: mockProcessId },
        {
          error: expect.objectContaining({
            [mockUnzippedFiles[1].originalname]: expect.any(Error),
          }),
        },
      );
      expect(result).toEqual({
        status: 'success',
        message: 'Imported student form data successfully',
      });
    });

    // Test with custom process ID
    it('should use provided process ID when available', async () => {
      // Arrange
      const customProcessId = 'custom-process-id';
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue({
        ...mockSpecification,
        name: SpecificationNameEnum.PGNV,
      });
      jest.spyOn(storageService, 'uploadDataToFile').mockResolvedValue(mockUploadResponse);
      jest.spyOn(Logger, 'debug').mockImplementation(() => undefined);

      // Act
      const result = await service.importStudentFormData(
        mockFiles,
        mockImportFormRequest,
        mockUser,
        customProcessId,
      );

      // Assert
      expect(processService.createProgress).toHaveBeenCalledWith([
        {
          processId: customProcessId,
          type: EProgressType.ASSIGNMENT_SHEET,
          action: ActionEnum.IMPORT,
          createBy: mockUser.email,
          classId: mockImportFormRequest.classId,
        },
      ]);
      expect(processService.makeCompleted).toHaveBeenCalledWith(
        { processId: customProcessId },
        { error: {} },
      );
      expect(result).toEqual({
        status: 'success',
        message: 'Imported student form data successfully',
      });
    });

    // Test error in importSingleByScript
    it('should handle errors in importSingleByScript and delete uploaded file', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue({
        ...mockSpecification,
        name: SpecificationNameEnum.PGNV,
      });
      jest.spyOn(storageService, 'uploadDataToFile').mockResolvedValue(mockUploadResponse);
      jest
        .spyOn(officeService, 'importSingleByScript')
        .mockRejectedValue(new Error('Import failed'));
      jest.spyOn(Logger, 'debug').mockImplementation(() => undefined);

      // Act
      const result = await service.importStudentFormData(
        mockFiles,
        mockImportFormRequest,
        mockUser,
      );

      // Assert
      expect(storageService.uploadDataToFile).toHaveBeenCalledTimes(2);
      expect(officeService.importSingleByScript).toHaveBeenCalledTimes(2);
      expect(storageService.deleteFile).toHaveBeenCalledTimes(2);
      expect(storageService.deleteFile).toHaveBeenCalledWith(mockUploadResponse.key);
      expect(processService.makeCompleted).toHaveBeenCalledWith(
        { processId: mockProcessId },
        {
          error: expect.objectContaining({
            [mockUnzippedFiles[0].originalname]: expect.any(Error),
            [mockUnzippedFiles[1].originalname]: expect.any(Error),
          }),
        },
      );
      expect(result).toEqual({
        status: 'success',
        message: 'Imported student form data successfully',
      });
    });
  });
});
