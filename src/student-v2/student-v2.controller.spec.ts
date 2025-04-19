import { Test, TestingModule } from '@nestjs/testing';
import { StudentControllerV2 } from './student-v2.controller';
import { StudentServiceV2 } from './student-v2.service';
import {
  ImportListStudentRequest,
  ImportStudentFormDataRequestV2,
} from '../students/dtos/import-data.dto';
import {
  ExportListStudentRequestV2,
  ExportStudentFormDataRequestV2,
} from '../students/dtos/export-data.dto';
import { UserPayload } from '../auth/types/user-playload.type';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ProgressService } from '../progress/progress.service';
import { ThesisDocumentEnum } from '../thesis-management/enums/thesis-document.enum';
import { EAction } from '../permissions/enums/action.enum';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { PoliciesGuard } from '../authorization/guards/policies.guard';
import { UsersService } from '../users/users.service';
import { Reflector } from '@nestjs/core';

describe('StudentControllerV2', () => {
  let controller: StudentControllerV2;
  let studentV2Service: StudentServiceV2;

  // Mock data
  const mockUser: UserPayload = {
    email: 'teacher@example.com',
    role: 'teacher',
  };

  const mockImportListRequest: ImportListStudentRequest = {
    classId: 'class-id-1',
    files: [],
  };

  const mockExportListRequest: ExportListStudentRequestV2 = {
    classId: 'class-id-1',
    studentIds: ['student-id-1', 'student-id-2'],
  };

  const mockExportDocRequest: ExportStudentFormDataRequestV2 = {
    classId: 'class-id-1',
    studentIds: ['student-id-1', 'student-id-2'],
    thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
    thesisStartDate: '2023-01-01',
    thesisEndDate: '2023-05-31',
    teacherSignatureDate: '2023-06-01',
  };

  const mockImportDocRequest: ImportStudentFormDataRequestV2 = {
    classId: 'class-id-1',
    thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
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
  ] as Express.Multer.File[];

  const mockProcessId = 'process-id-1';

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentControllerV2],
      providers: [
        {
          provide: StudentServiceV2,
          useValue: {
            importListStudents: jest.fn().mockResolvedValue({
              status: 'success',
              message: 'Imported students successfully',
            }),
            exportListStudent: jest.fn().mockResolvedValue(undefined),
            validateActionWithThesisData: jest.fn(),
            generateStudentFormData: jest.fn().mockResolvedValue({
              status: 'success',
              message: 'Generated student form data successfully',
            }),
            importStudentFormData: jest.fn().mockResolvedValue({
              status: 'success',
              message: 'Imported student form data successfully',
            }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            createPrincipalAbility: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<StudentControllerV2>(StudentControllerV2);
    studentV2Service = module.get<StudentServiceV2>(StudentServiceV2);

    // Mock static methods
    jest.spyOn(ProgressService, 'generateId').mockReturnValue(mockProcessId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('importList', () => {
    it('should return processing response with processId when importing student list', async () => {
      // Act
      const result = await controller.importList(mockImportListRequest, mockUser, mockFiles);

      // Assert
      expect(ProgressService.generateId).toHaveBeenCalledWith('import-student-list-manual');
      expect(studentV2Service.importListStudents).toHaveBeenCalledWith(
        mockFiles,
        mockImportListRequest,
        mockUser,
        mockProcessId,
      );
      expect(result).toEqual({
        status: 'processing',
        message: 'Processing import student list',
        data: {
          processId: mockProcessId,
        },
      });
    });
  });

  describe('exportList', () => {
    it('should call exportListStudent service with proper parameters', async () => {
      // Act
      await controller.exportList(mockExportListRequest, mockUser, mockResponse);

      // Assert
      expect(ProgressService.generateId).toHaveBeenCalledWith('export-student-list-manual');
      expect(studentV2Service.exportListStudent).toHaveBeenCalledWith(
        mockExportListRequest,
        mockUser,
        mockResponse,
        mockProcessId,
      );
    });
  });

  describe('generate', () => {
    it('should return processing response when user has permission', async () => {
      // Arrange
      jest.spyOn(studentV2Service, 'validateActionWithThesisData').mockResolvedValue(true);

      // Act
      const result = await controller.generate(mockExportDocRequest, mockUser);

      // Assert
      expect(ProgressService.generateId).toHaveBeenCalledWith(
        `export-${mockExportDocRequest.thesisDocType}-manual`,
      );
      expect(studentV2Service.validateActionWithThesisData).toHaveBeenCalledWith(
        mockUser.email,
        mockExportDocRequest.thesisDocType,
        EAction.READ,
      );
      expect(studentV2Service.generateStudentFormData).toHaveBeenCalledWith(
        mockExportDocRequest,
        mockUser,
        mockProcessId,
      );
      expect(result).toEqual({
        status: 'processing',
        message: 'Processing generate student form data',
        data: {
          processId: mockProcessId,
        },
      });
    });

    it('should throw BadRequestException when user has no permission', async () => {
      // Arrange
      jest.spyOn(studentV2Service, 'validateActionWithThesisData').mockResolvedValue(false);

      // Act & Assert
      await expect(controller.generate(mockExportDocRequest, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(studentV2Service.validateActionWithThesisData).toHaveBeenCalledWith(
        mockUser.email,
        mockExportDocRequest.thesisDocType,
        EAction.READ,
      );
      expect(studentV2Service.generateStudentFormData).not.toHaveBeenCalled();
    });
  });

  describe('importStudentFormData', () => {
    it('should return processing response when user has permission', async () => {
      // Arrange
      jest.spyOn(studentV2Service, 'validateActionWithThesisData').mockResolvedValue(true);

      // Act
      const result = await controller.importStudentFormData(
        mockImportDocRequest,
        mockUser,
        mockFiles,
      );

      // Assert
      expect(ProgressService.generateId).toHaveBeenCalledWith(
        `import-${mockImportDocRequest.thesisDocType}-manual`,
      );
      expect(studentV2Service.validateActionWithThesisData).toHaveBeenCalledWith(
        mockUser.email,
        mockImportDocRequest.thesisDocType,
        EAction.MANAGE,
      );
      expect(studentV2Service.importStudentFormData).toHaveBeenCalledWith(
        mockFiles,
        mockImportDocRequest,
        mockUser,
        mockProcessId,
      );
      expect(result).toEqual({
        status: 'processing',
        message: 'Processing import student form data',
        data: {
          processId: mockProcessId,
        },
      });
    });

    it('should throw BadRequestException when user has no permission', async () => {
      // Arrange
      jest.spyOn(studentV2Service, 'validateActionWithThesisData').mockResolvedValue(false);

      // Act & Assert
      await expect(
        controller.importStudentFormData(mockImportDocRequest, mockUser, mockFiles),
      ).rejects.toThrow(BadRequestException);
      expect(studentV2Service.validateActionWithThesisData).toHaveBeenCalledWith(
        mockUser.email,
        mockImportDocRequest.thesisDocType,
        EAction.MANAGE,
      );
      expect(studentV2Service.importStudentFormData).not.toHaveBeenCalled();
    });
  });
});
