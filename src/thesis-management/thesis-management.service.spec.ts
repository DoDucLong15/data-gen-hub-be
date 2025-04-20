import { Test, TestingModule } from '@nestjs/testing';
import { ThesisManagementService } from './thesis-management.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssignmentSheetsEntity } from './entities/assignment-sheet.entity';
import { GuidanceReviewEntity } from './entities/guidance-review.entity';
import { SupervisoryCommentsEntity } from './entities/supervisory-comments.entity';
import { ClassService } from '../class/class.service';
import { StorageService } from '../storage/storage.service';
import { OfficeService } from '../office/office.service';
import { TemplateSpecificationService } from '../template-specification/template-specification.service';
import { Repository } from 'typeorm';
import { ThesisDocumentEnum } from './enums/thesis-document.enum';
import { BadRequestException } from '@nestjs/common';
import { UserPayload } from '../auth/types/user-playload.type';
import { CreateAssignmentSheetDto } from './dtos/assignment-sheet.dto';
import { GetListAssignmentSheetDto } from './dtos/assignment-sheet.dto';
import { DownloadFileAssignmentSheetDto } from './dtos/assignment-sheet.dto';
import { DeleteFileAssignmentSheetDto } from './dtos/assignment-sheet.dto';

// Mock streamToBuffer function
jest.mock('src/storage/helpers/convert.helper', () => ({
  streamToBuffer: jest.fn().mockResolvedValue(Buffer.from('test')),
}));

// Mock type for TemplateSpecificationEntity since we don't have access to the real entity
interface MockTemplateSpecificationEntity {
  id: string;
  name: string;
  action: string;
  templateFile: string;
  jsonFile: string;
  classId: string;
  class: { id: string };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

describe('ThesisManagementService', () => {
  let service: ThesisManagementService;
  let assignmentSheetsRepository: Repository<AssignmentSheetsEntity>;
  let guidanceReviewRepository: Repository<GuidanceReviewEntity>;
  let supervisoryCommentsRepository: Repository<SupervisoryCommentsEntity>;
  let classService: ClassService;
  let storageService: StorageService;
  let officeService: OfficeService;
  let specificationService: TemplateSpecificationService;

  const mockAssignmentSheetsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockGuidanceReviewRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockSupervisoryCommentsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockClassService = {
    getOne: jest.fn(),
  };

  const mockStorageService = {
    uploadDataToFile: jest.fn(),
    downloadFile: jest.fn(),
    getMetadata: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockOfficeService = {
    exportSingleByScript: jest.fn(),
  };

  const mockSpecificationService = {
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThesisManagementService,
        {
          provide: getRepositoryToken(AssignmentSheetsEntity),
          useValue: mockAssignmentSheetsRepository,
        },
        {
          provide: getRepositoryToken(GuidanceReviewEntity),
          useValue: mockGuidanceReviewRepository,
        },
        {
          provide: getRepositoryToken(SupervisoryCommentsEntity),
          useValue: mockSupervisoryCommentsRepository,
        },
        {
          provide: ClassService,
          useValue: mockClassService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: OfficeService,
          useValue: mockOfficeService,
        },
        {
          provide: TemplateSpecificationService,
          useValue: mockSpecificationService,
        },
      ],
    }).compile();

    service = module.get<ThesisManagementService>(ThesisManagementService);
    assignmentSheetsRepository = module.get<Repository<AssignmentSheetsEntity>>(
      getRepositoryToken(AssignmentSheetsEntity),
    );
    guidanceReviewRepository = module.get<Repository<GuidanceReviewEntity>>(
      getRepositoryToken(GuidanceReviewEntity),
    );
    supervisoryCommentsRepository = module.get<Repository<SupervisoryCommentsEntity>>(
      getRepositoryToken(SupervisoryCommentsEntity),
    );
    classService = module.get<ClassService>(ClassService);
    storageService = module.get<StorageService>(StorageService);
    officeService = module.get<OfficeService>(OfficeService);
    specificationService = module.get<TemplateSpecificationService>(TemplateSpecificationService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStrategy', () => {
    it('should return the correct strategy for ASSIGNMENT_SHEET', () => {
      const strategy = (service as any).getStrategy(ThesisDocumentEnum.ASSIGNMENT_SHEET);
      expect(strategy).toBeDefined();
    });

    it('should return the correct strategy for GUIDANCE_REVIEW', () => {
      const strategy = (service as any).getStrategy(ThesisDocumentEnum.GUIDANCE_REVIEW);
      expect(strategy).toBeDefined();
    });

    it('should return the correct strategy for SUPERVISORY_COMMENTS', () => {
      const strategy = (service as any).getStrategy(ThesisDocumentEnum.SUPERVISORY_COMMENTS);
      expect(strategy).toBeDefined();
    });

    it('should throw BadRequestException for invalid strategy', () => {
      expect(() => (service as any).getStrategy('INVALID_STRATEGY')).toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('should create an assignment sheet and sync data and file', async () => {
      const mockUser: UserPayload = { email: 'test@example.com', role: 'teacher' } as UserPayload;

      // Create a mock request that combines all required and optional properties
      const mockRequest = {
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        classId: 'class-id',
        mssv: '123456',
        fullName: 'Test Full Name',
        thesisStartDate: '2023-01-01',
        thesisEndDate: '2023-06-01',
        studentClassName: 'Class A',
        projectTitle: 'Project Title',
        supervisor: 'Test Supervisor',
        phone: '+84123456789',
        email: 'student@example.com',
        classCode: 'IT001',
        semester: 'Spring 2023',
        school: 'Test School',
        studentKnowledgeGained: 'Knowledge',
        technologyGained: 'Technology',
        acquiredSkills: 'Skills',
        expectedProducts: 'Products',
        realWorldProblemSolved: 'Problems',
        student_sign_date: '2023-06-05',
        supervisor_sign_date: '2023-06-07',
        teacherSignatureDate: '2023-06-10',
        projectType: 'Test Type',
        projectTypeOther: '',
        projectRequirements: 'Test Requirements',
        projectImplementationPlace: 'Test Place',
        projectImplementationPlaceOther: '',
      };

      // Add additional properties in the mock entity
      const mockEntity = {
        id: 'entity-id',
        ...mockRequest,
        studentName: 'Test Student',
        thesisName: 'Test Thesis',
        department: 'Test Department',
      };

      jest.spyOn(service as any, 'getStrategy').mockReturnValue({
        create: jest.fn().mockResolvedValue(mockEntity),
      });
      jest.spyOn(service, 'syncDataAndFile' as any).mockResolvedValue(undefined);

      const result = await service.create(mockRequest as CreateAssignmentSheetDto, mockUser);

      expect(result).toEqual(mockEntity);
      expect((service as any).getStrategy).toHaveBeenCalledWith(
        ThesisDocumentEnum.ASSIGNMENT_SHEET,
      );
      expect((service as any).syncDataAndFile).toHaveBeenCalledWith(
        mockEntity.id,
        ThesisDocumentEnum.ASSIGNMENT_SHEET,
        mockUser,
      );
    });
  });

  describe('update', () => {
    it('should update an assignment sheet and sync data and file', async () => {
      const mockUser: UserPayload = { email: 'test@example.com', role: 'teacher' } as UserPayload;
      const mockRequest = {
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        studentName: 'Updated Student',
        thesisName: 'Updated Thesis',
        id: 'entity-id',
      };
      const mockEntity = {
        ...mockRequest,
      };

      jest.spyOn(service as any, 'getStrategy').mockReturnValue({
        update: jest.fn().mockResolvedValue(mockEntity),
      });
      jest.spyOn(service, 'syncDataAndFile' as any).mockResolvedValue(undefined);

      const result = await service.update(mockRequest as any, mockUser);

      expect(result).toEqual(mockEntity);
      expect((service as any).getStrategy).toHaveBeenCalledWith(
        ThesisDocumentEnum.ASSIGNMENT_SHEET,
      );
      expect((service as any).syncDataAndFile).toHaveBeenCalledWith(
        mockEntity.id,
        ThesisDocumentEnum.ASSIGNMENT_SHEET,
        mockUser,
      );
    });
  });

  describe('list', () => {
    it('should return a list of assignment sheets', async () => {
      const mockUser: UserPayload = { email: 'test@example.com', role: 'teacher' } as UserPayload;
      const mockRequest: GetListAssignmentSheetDto = {
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        classId: 'class-id',
        ids: [],
      };
      const mockEntities = [
        { id: 'entity-id-1', studentName: 'Student 1' },
        { id: 'entity-id-2', studentName: 'Student 2' },
      ];

      jest.spyOn(service as any, 'getStrategy').mockReturnValue({
        list: jest.fn().mockResolvedValue(mockEntities),
      });

      const result = await service.list(mockRequest, mockUser);

      expect(result).toEqual(mockEntities);
      expect((service as any).getStrategy).toHaveBeenCalledWith(
        ThesisDocumentEnum.ASSIGNMENT_SHEET,
      );
    });
  });

  describe('delete', () => {
    it('should delete an assignment sheet', async () => {
      const mockUser: UserPayload = { email: 'test@example.com', role: 'teacher' } as UserPayload;
      const mockRequest = {
        id: 'entity-id',
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
      };
      const mockResponse = { status: 'success', message: 'Assignment sheet deleted' };

      jest.spyOn(service as any, 'getStrategy').mockReturnValue({
        delete: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.delete(mockRequest, mockUser);

      expect(result).toEqual(mockResponse);
      expect((service as any).getStrategy).toHaveBeenCalledWith(
        ThesisDocumentEnum.ASSIGNMENT_SHEET,
      );
    });
  });

  describe('getOne', () => {
    it('should return a single assignment sheet', async () => {
      const mockUser: UserPayload = { email: 'test@example.com', role: 'teacher' } as UserPayload;
      const mockRequest = {
        id: 'entity-id',
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
      };
      const mockEntity = {
        id: 'entity-id',
        studentName: 'Test Student',
        thesisName: 'Test Thesis',
      };

      jest.spyOn(service as any, 'getStrategy').mockReturnValue({
        getOne: jest.fn().mockResolvedValue(mockEntity),
      });

      const result = await service.getOne(mockRequest, mockUser);

      expect(result).toEqual(mockEntity);
      expect((service as any).getStrategy).toHaveBeenCalledWith(
        ThesisDocumentEnum.ASSIGNMENT_SHEET,
      );
    });
  });

  describe('downloadFile', () => {
    it('should download a file', async () => {
      const mockUser: UserPayload = { email: 'test@example.com', role: 'teacher' } as UserPayload;
      const mockRequest: DownloadFileAssignmentSheetDto = {
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        classId: 'class-id',
        ids: ['entity-id'],
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
        setHeader: jest.fn(),
      } as any;

      jest.spyOn(service as any, 'getStrategy').mockReturnValue({
        downloadFile: jest.fn().mockResolvedValue(undefined),
      });

      await service.downloadFile(mockRequest, mockRes, mockUser);

      expect((service as any).getStrategy).toHaveBeenCalledWith(
        ThesisDocumentEnum.ASSIGNMENT_SHEET,
      );
      expect((service as any).getStrategy().downloadFile).toHaveBeenCalledWith(
        mockRequest,
        mockRes,
        mockUser,
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      const mockUser: UserPayload = { email: 'test@example.com', role: 'teacher' } as UserPayload;
      const mockRequest: DeleteFileAssignmentSheetDto = {
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        classId: 'class-id',
        ids: ['entity-id'],
      };
      const mockResponse = { status: 'success', message: 'File deleted' };

      jest.spyOn(service as any, 'getStrategy').mockReturnValue({
        deleteFile: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.deleteFile(mockRequest, mockUser);

      expect(result).toEqual(mockResponse);
      expect((service as any).getStrategy).toHaveBeenCalledWith(
        ThesisDocumentEnum.ASSIGNMENT_SHEET,
      );
    });
  });

  describe('syncDataAndFile', () => {
    it('should sync data and file', async () => {
      const mockUser: UserPayload = { email: 'test@example.com', role: 'teacher' } as UserPayload;
      const mockEntityId = 'entity-id';
      const mockThesisDocType = ThesisDocumentEnum.ASSIGNMENT_SHEET;
      const mockEntity = {
        id: mockEntityId,
        class: {
          id: 'class-id',
        },
        thesisStartDate: '2023-01-01',
        thesisEndDate: '2023-06-01',
        teacherSignatureDate: '2023-06-10',
        outputPath: 'output/path',
        mssv: '123456',
      };

      const mockSpecExport: MockTemplateSpecificationEntity = {
        templateFile: 'template.docx',
        name: 'export-spec',
        action: 'export',
        jsonFile: 'export-json.json',
        class: { id: 'class-id' },
        classId: 'class-id',
        id: 'export-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSpecImport: MockTemplateSpecificationEntity = {
        jsonFile: 'import.json',
        name: 'import-spec',
        action: 'import',
        templateFile: 'import-template.docx',
        class: { id: 'class-id' },
        classId: 'class-id',
        id: 'import-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockStream = {};
      const mockBuffer = Buffer.from('test');
      const mockMetadata = {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        name: 'path/123456.xlsx',
      };

      const mockUploadResult = {
        key: 'input/path',
        url: 'https://example.com/input/path',
      };

      jest
        .spyOn(service, 'getOne')
        .mockResolvedValueOnce(mockEntity)
        .mockResolvedValueOnce(mockEntity);
      jest
        .spyOn(specificationService, 'getOne')
        .mockResolvedValueOnce(mockSpecExport as any)
        .mockResolvedValueOnce(mockSpecImport as any);
      jest.spyOn(officeService, 'exportSingleByScript').mockResolvedValue(undefined);
      jest.spyOn(storageService, 'downloadFile').mockResolvedValue(mockStream as any);
      jest.spyOn(storageService, 'getMetadata').mockResolvedValue(mockMetadata);
      // No need to mock require as we've mocked the streamToBuffer function at the top of the file
      jest.spyOn(storageService, 'uploadDataToFile').mockResolvedValue(mockUploadResult as any);
      jest
        .spyOn(assignmentSheetsRepository, 'save')
        .mockResolvedValue({} as AssignmentSheetsEntity);

      await (service as any).syncDataAndFile(mockEntityId, mockThesisDocType, mockUser);

      expect(service.getOne).toHaveBeenCalledWith(
        { id: mockEntityId, thesisDocType: mockThesisDocType },
        mockUser,
      );
      expect(specificationService.getOne).toHaveBeenCalledTimes(2);
      expect(officeService.exportSingleByScript).toHaveBeenCalledWith(
        mockEntity.class.id,
        [mockEntityId],
        mockSpecExport.templateFile,
        mockSpecImport.jsonFile,
        mockThesisDocType,
        {
          thesis_start_date: mockEntity.thesisStartDate,
          thesis_end_date: mockEntity.thesisEndDate,
          teacher_sign_date: mockEntity.teacherSignatureDate,
        },
      );
    });

    it('should do nothing if no specifications are found', async () => {
      const mockUser: UserPayload = { email: 'test@example.com', role: 'teacher' } as UserPayload;
      const mockEntityId = 'entity-id';
      const mockThesisDocType = ThesisDocumentEnum.ASSIGNMENT_SHEET;
      const mockEntity = {
        id: mockEntityId,
        class: {
          id: 'class-id',
        },
      };

      // Clear any previous mock calls
      jest.clearAllMocks();

      // Configure mocks for this specific test
      jest.spyOn(service, 'getOne').mockResolvedValue(mockEntity);
      jest.spyOn(specificationService, 'getOne').mockResolvedValue(null);

      await (service as any).syncDataAndFile(mockEntityId, mockThesisDocType, mockUser);

      expect(service.getOne).toHaveBeenCalledWith(
        { id: mockEntityId, thesisDocType: mockThesisDocType },
        mockUser,
      );
      expect(specificationService.getOne).toHaveBeenCalledTimes(2);
      expect(officeService.exportSingleByScript).not.toHaveBeenCalled();
    });
  });
});
