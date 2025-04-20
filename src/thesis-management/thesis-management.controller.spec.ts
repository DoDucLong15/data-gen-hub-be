import { Test, TestingModule } from '@nestjs/testing';
import { ThesisManagementController } from './thesis-management.controller';
import { ThesisManagementService } from './thesis-management.service';
import { PoliciesGuardV2 } from 'src/authorization/guards/policies-v2.guard';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { ThesisDocumentEnum } from './enums/thesis-document.enum';
import { CreateAssignmentSheetDto } from './dtos/assignment-sheet.dto';
import { UpdateAssignmentSheetDto } from './dtos/assignment-sheet.dto';
import { GetListAssignmentSheetDto } from './dtos/assignment-sheet.dto';
import { DeleteAssignmentSheetDto } from './dtos/assignment-sheet.dto';
import { DownloadFileAssignmentSheetDto } from './dtos/assignment-sheet.dto';
import { DeleteFileAssignmentSheetDto } from './dtos/assignment-sheet.dto';

describe('ThesisManagementController', () => {
  let controller: ThesisManagementController;
  let service: ThesisManagementService;

  const mockThesisManagementService = {
    create: jest.fn(),
    update: jest.fn(),
    list: jest.fn(),
    delete: jest.fn(),
    downloadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockUser: UserPayload = {
    email: 'test@example.com',
    role: 'teacher',
    sub: 'user-id',
  } as UserPayload;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThesisManagementController],
      providers: [
        {
          provide: ThesisManagementService,
          useValue: mockThesisManagementService,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PoliciesGuardV2)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ThesisManagementController>(ThesisManagementController);
    service = module.get<ThesisManagementService>(ThesisManagementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an assignment sheet', async () => {
      const createDto: CreateAssignmentSheetDto = {
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
      };

      const expectedResult = {
        id: 'entity-id',
        ...createDto,
      };

      mockThesisManagementService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, mockUser);

      expect(result).toEqual(expectedResult);
      expect(mockThesisManagementService.create).toHaveBeenCalledWith(createDto, mockUser);
    });
  });

  describe('update', () => {
    it('should update an assignment sheet', async () => {
      const updateDto: UpdateAssignmentSheetDto = {
        id: 'entity-id',
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        fullName: 'Updated Full Name',
        mssv: '123456',
      };

      const expectedResult = {
        ...updateDto,
        studentClassName: 'Class A',
      };

      mockThesisManagementService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(updateDto, mockUser);

      expect(result).toEqual(expectedResult);
      expect(mockThesisManagementService.update).toHaveBeenCalledWith(updateDto, mockUser);
    });
  });

  describe('list', () => {
    it('should return a list of assignment sheets', async () => {
      const listDto: GetListAssignmentSheetDto = {
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        classId: 'class-id',
        ids: [],
      };

      const expectedResult = [
        {
          id: 'entity-id-1',
          mssv: '123456',
          fullName: 'Student 1',
        },
        {
          id: 'entity-id-2',
          mssv: '654321',
          fullName: 'Student 2',
        },
      ];

      mockThesisManagementService.list.mockResolvedValue(expectedResult);

      const result = await controller.list(listDto, mockUser);

      expect(result).toEqual(expectedResult);
      expect(mockThesisManagementService.list).toHaveBeenCalledWith(listDto, mockUser);
    });
  });

  describe('delete', () => {
    it('should delete an assignment sheet', async () => {
      const deleteDto: DeleteAssignmentSheetDto = {
        id: 'entity-id',
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
      };

      const expectedResult = {
        status: 'success',
        message: 'Assignment sheet deleted',
      };

      mockThesisManagementService.delete.mockResolvedValue(expectedResult);

      const result = await controller.delete(deleteDto, mockUser);

      expect(result).toEqual(expectedResult);
      expect(mockThesisManagementService.delete).toHaveBeenCalledWith(deleteDto, mockUser);
    });
  });

  describe('downloadFile', () => {
    it('should download files', async () => {
      const downloadDto: DownloadFileAssignmentSheetDto = {
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        classId: 'class-id',
        ids: ['entity-id'],
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
        setHeader: jest.fn(),
      } as any;

      await controller.downloadFile(downloadDto, mockResponse, mockUser);

      expect(mockThesisManagementService.downloadFile).toHaveBeenCalledWith(
        downloadDto,
        mockResponse,
        mockUser,
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete files', async () => {
      const deleteFileDto: DeleteFileAssignmentSheetDto = {
        thesisDocType: ThesisDocumentEnum.ASSIGNMENT_SHEET,
        classId: 'class-id',
        ids: ['entity-id'],
      };

      const expectedResult = {
        status: 'success',
        message: 'File deleted',
      };

      mockThesisManagementService.deleteFile.mockResolvedValue(expectedResult);

      const result = await controller.deleteFile(deleteFileDto, mockUser);

      expect(result).toEqual(expectedResult);
      expect(mockThesisManagementService.deleteFile).toHaveBeenCalledWith(deleteFileDto, mockUser);
    });
  });
});
