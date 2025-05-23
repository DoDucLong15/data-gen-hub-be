import { Test, TestingModule } from '@nestjs/testing';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { ClassDriveInfoService } from './sub-services/class-drive-info.service';
import { CreateClassDto, SyncClassDriveDataRequest, UpdateClassDto } from './dtos/class.dto';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { ClassEntity } from './entities/class.entity';
import { BadRequestException, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { APP_GUARD } from '@nestjs/core';
import { ESyncDriveDataType } from './enums/sync-data.type';
import { ProgressService } from 'src/progress/progress.service';
import { ClassOnedriveInfoService } from './sub-services/class-onedrive-info.service';

// Mock ProgressService.generateId
jest.mock('src/progress/progress.service', () => ({
  ProgressService: {
    generateId: jest.fn().mockReturnValue('mock-process-id'),
  },
}));

describe('ClassController', () => {
  let controller: ClassController;
  let classService: ClassService;
  let classDriveInfoService: ClassDriveInfoService;
  let classOnedriveInfoService: ClassOnedriveInfoService;

  // Mock data
  const mockUserPayload: UserPayload = {
    email: 'teacher@example.com',
    role: 'teacher',
  };

  const mockCreateClassDto: CreateClassDto = {
    name: 'Test Class',
    classCode: 'TC101',
    courseCode: 'CS101',
    semester: '2023-2024-2',
    studentPaths: [],
    driveId: '',
    onedriveSharedLink: '',
  };

  const mockCreateClassWithDriveDto: CreateClassDto = {
    ...mockCreateClassDto,
    driveId: 'mock-drive-id',
  };

  const mockUpdateClassDto: UpdateClassDto = {
    id: 'class-id-1',
    name: 'Updated Class Name',
    classCode: 'TC101-Updated',
    courseCode: 'CS101-Updated',
    semester: '2023-2024-2',
  };

  const mockUpdateClassWithDriveDto: UpdateClassDto = {
    ...mockUpdateClassDto,
    driveId: 'new-drive-id',
  };

  const mockClassEntity = {
    id: 'class-id-1',
    name: 'Test Class',
    classCode: 'TC101',
    courseCode: 'CS101',
    semester: '2023-2024-2',
    teacher: {
      id: '1',
      email: 'teacher@example.com',
      name: 'Test Teacher',
    },
  } as ClassEntity;

  const mockUpdatedClassEntity = {
    id: 'class-id-1',
    name: 'Updated Class Name',
    classCode: 'TC101-Updated',
    courseCode: 'CS101-Updated',
    semester: '2023-2024-2',
    teacher: {
      id: '1',
      email: 'teacher@example.com',
      name: 'Test Teacher',
    },
  } as ClassEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassController],
      providers: [
        {
          provide: ClassService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            getMany: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ClassDriveInfoService,
          useValue: {
            getByClassId: jest.fn(),
            downloadFile: jest.fn(),
            uploadFiles: jest.fn(),
            deleteFile: jest.fn(),
            createFolder: jest.fn(),
            syncClassDriveData: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getPrincipalAbility: jest.fn().mockResolvedValue({
              can: jest.fn().mockReturnValue(true),
            }),
          },
        },
        {
          provide: APP_GUARD,
          useClass: PoliciesGuard,
        },
        {
          provide: ClassOnedriveInfoService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ClassController>(ClassController);
    classService = module.get<ClassService>(ClassService);
    classDriveInfoService = module.get<ClassDriveInfoService>(ClassDriveInfoService);
    classOnedriveInfoService = module.get<ClassOnedriveInfoService>(ClassOnedriveInfoService);
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    // Scenario 1: Successfully create a class
    it('should successfully create a class', async () => {
      // Arrange
      jest.spyOn(classService, 'create').mockResolvedValueOnce(mockClassEntity);

      // Act
      const result = await controller.create(mockCreateClassDto, mockUserPayload);

      // Assert
      expect(classService.create).toHaveBeenCalledWith(mockCreateClassDto, mockUserPayload);
      expect(result).toEqual(mockClassEntity);
    });

    // Scenario 2: Successfully create a class with driveId
    it('should successfully create a class with driveId', async () => {
      // Arrange
      jest.spyOn(classService, 'create').mockResolvedValueOnce(mockClassEntity);

      // Act
      const result = await controller.create(mockCreateClassWithDriveDto, mockUserPayload);

      // Assert
      expect(classService.create).toHaveBeenCalledWith(
        mockCreateClassWithDriveDto,
        mockUserPayload,
      );
      expect(result).toEqual(mockClassEntity);
    });

    // Scenario 3: Handle service throwing BadRequestException
    it('should propagate BadRequestException from service', async () => {
      // Arrange
      const errorMessage = 'Teacher not found';
      jest
        .spyOn(classService, 'create')
        .mockRejectedValueOnce(new BadRequestException(errorMessage));

      // Act & Assert
      await expect(controller.create(mockCreateClassDto, mockUserPayload)).rejects.toThrow(
        BadRequestException,
      );
      expect(classService.create).toHaveBeenCalledWith(mockCreateClassDto, mockUserPayload);
    });

    // Scenario 4: Handle service throwing other exceptions
    it('should propagate other exceptions from service', async () => {
      // Arrange
      const error = new Error('Unexpected error');
      jest.spyOn(classService, 'create').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.create(mockCreateClassDto, mockUserPayload)).rejects.toThrow(error);
      expect(classService.create).toHaveBeenCalledWith(mockCreateClassDto, mockUserPayload);
    });
  });

  describe('update', () => {
    // Scenario 1: Successfully update a class
    it('should successfully update a class', async () => {
      // Arrange
      jest.spyOn(classService, 'update').mockResolvedValueOnce(mockUpdatedClassEntity);

      // Act
      const result = await controller.update(mockUpdateClassDto, mockUserPayload);

      // Assert
      expect(classService.update).toHaveBeenCalledWith(mockUpdateClassDto, mockUserPayload);
      expect(result).toEqual(mockUpdatedClassEntity);
    });

    // Scenario 2: Successfully update a class with driveId
    it('should successfully update a class with driveId', async () => {
      // Arrange
      jest.spyOn(classService, 'update').mockResolvedValueOnce({
        ...mockUpdatedClassEntity,
        driveId: 'new-drive-id',
      } as ClassEntity);

      // Act
      const result = await controller.update(mockUpdateClassWithDriveDto, mockUserPayload);

      // Assert
      expect(classService.update).toHaveBeenCalledWith(
        mockUpdateClassWithDriveDto,
        mockUserPayload,
      );
      expect(result).toEqual({
        ...mockUpdatedClassEntity,
        driveId: 'new-drive-id',
      });
    });

    // Scenario 3: Handle service throwing BadRequestException when class not found
    it('should propagate BadRequestException when class not found', async () => {
      // Arrange
      const errorMessage = 'Class with id class-id-1 not found';
      jest
        .spyOn(classService, 'update')
        .mockRejectedValueOnce(new BadRequestException(errorMessage));

      // Act & Assert
      await expect(controller.update(mockUpdateClassDto, mockUserPayload)).rejects.toThrow(
        BadRequestException,
      );
      expect(classService.update).toHaveBeenCalledWith(mockUpdateClassDto, mockUserPayload);
    });

    // Scenario 4: Handle service throwing other exceptions
    it('should propagate other exceptions from service', async () => {
      // Arrange
      const error = new Error('Unexpected error during update');
      jest.spyOn(classService, 'update').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.update(mockUpdateClassDto, mockUserPayload)).rejects.toThrow(error);
      expect(classService.update).toHaveBeenCalledWith(mockUpdateClassDto, mockUserPayload);
    });
  });

  describe('syncDriveInfo', () => {
    // Mock data for syncDriveInfo tests
    const mockSyncRequest: SyncClassDriveDataRequest = {
      classIds: ['class-id-1', 'class-id-2'],
      types: [ESyncDriveDataType.STUDENT_LIST, ESyncDriveDataType.ASSIGNMENT_SHEET],
    };

    // Scenario 1: Successfully start sync process with all parameters
    it('should successfully start sync process with all parameters', async () => {
      // Arrange
      jest.spyOn(classDriveInfoService, 'syncClassDriveData').mockResolvedValueOnce({
        status: 'success',
        message: 'Sync completed successfully',
      });
      jest.spyOn(Logger, 'error').mockImplementation(() => {});

      // Act
      const result = await controller.syncDriveInfo(mockSyncRequest, mockUserPayload);

      // Assert
      expect(ProgressService.generateId).toHaveBeenCalledWith('sync-class-drive-data-manual');
      expect(classDriveInfoService.syncClassDriveData).toHaveBeenCalledWith(
        mockSyncRequest,
        mockUserPayload,
        'mock-process-id',
      );
      expect(result).toEqual({
        status: 'processing',
        message: 'Processing sync class drive data',
        data: {
          processId: 'mock-process-id',
        },
      });
    });

    // Scenario 2: Successfully start sync process with empty request
    it('should successfully start sync process with empty request', async () => {
      // Arrange
      const emptyRequest = {} as SyncClassDriveDataRequest;
      jest.spyOn(classDriveInfoService, 'syncClassDriveData').mockResolvedValueOnce({
        status: 'success',
        message: 'Sync completed successfully',
      });
      jest.spyOn(Logger, 'error').mockImplementation(() => {});

      // Act
      const result = await controller.syncDriveInfo(emptyRequest, mockUserPayload);

      // Assert
      expect(ProgressService.generateId).toHaveBeenCalledWith('sync-class-drive-data-manual');
      expect(classDriveInfoService.syncClassDriveData).toHaveBeenCalledWith(
        emptyRequest,
        mockUserPayload,
        'mock-process-id',
      );
      expect(result).toEqual({
        status: 'processing',
        message: 'Processing sync class drive data',
        data: {
          processId: 'mock-process-id',
        },
      });
    });

    // Scenario 3: Handle service throwing an error
    it('should handle service throwing an error', async () => {
      // Arrange
      const error = new Error('Sync process failed');
      jest.spyOn(classDriveInfoService, 'syncClassDriveData').mockRejectedValueOnce(error);
      jest.spyOn(Logger, 'error').mockImplementation(() => {});

      // Act
      const result = await controller.syncDriveInfo(mockSyncRequest, mockUserPayload);

      // Assert
      expect(ProgressService.generateId).toHaveBeenCalledWith('sync-class-drive-data-manual');
      expect(classDriveInfoService.syncClassDriveData).toHaveBeenCalledWith(
        mockSyncRequest,
        mockUserPayload,
        'mock-process-id',
      );
      expect(Logger.error).toHaveBeenCalledWith(error, 'ClassController.syncDriveInfo');
      expect(result).toEqual({
        status: 'processing',
        message: 'Processing sync class drive data',
        data: {
          processId: 'mock-process-id',
        },
      });
    });

    // Scenario 4: Successfully start sync with specific data types
    it('should successfully start sync with specific data types', async () => {
      // Arrange
      const specificTypesRequest = {
        types: [ESyncDriveDataType.GUIDANCE_REVIEW, ESyncDriveDataType.SUPERVISORY_COMMENTS],
      } as SyncClassDriveDataRequest;
      jest.spyOn(classDriveInfoService, 'syncClassDriveData').mockResolvedValueOnce({
        status: 'success',
        message: 'Sync completed successfully',
      });
      jest.spyOn(Logger, 'error').mockImplementation(() => {});

      // Act
      const result = await controller.syncDriveInfo(specificTypesRequest, mockUserPayload);

      // Assert
      expect(ProgressService.generateId).toHaveBeenCalledWith('sync-class-drive-data-manual');
      expect(classDriveInfoService.syncClassDriveData).toHaveBeenCalledWith(
        specificTypesRequest,
        mockUserPayload,
        'mock-process-id',
      );
      expect(result).toEqual({
        status: 'processing',
        message: 'Processing sync class drive data',
        data: {
          processId: 'mock-process-id',
        },
      });
    });
  });
});
