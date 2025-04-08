import { Test, TestingModule } from '@nestjs/testing';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { ClassDriveInfoService } from './sub-services/class-drive-info.service';
import { CreateClassDto, UpdateClassDto } from './dtos/class.dto';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { ClassEntity } from './entities/class.entity';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { APP_GUARD } from '@nestjs/core';

describe('ClassController', () => {
  let controller: ClassController;
  let classService: ClassService;
  let classDriveInfoService: ClassDriveInfoService;

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
      ],
    })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ClassController>(ClassController);
    classService = module.get<ClassService>(ClassService);
    classDriveInfoService = module.get<ClassDriveInfoService>(ClassDriveInfoService);
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
});
