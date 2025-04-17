import { Test, TestingModule } from '@nestjs/testing';
import { ClassService } from './class.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassEntity } from './entities/class.entity';
import { Repository, UpdateResult } from 'typeorm';
import { UsersService } from '../users/users.service';
import { TemplateSpecificationService } from '../template-specification/template-specification.service';
import { ClassDriveInfoService } from './sub-services/class-drive-info.service';
import { CreateClassDto } from './dtos/class.dto';
import { UserPayload } from '../auth/types/user-playload.type';
import { BadRequestException, Logger } from '@nestjs/common';
import { UserEntity } from '../users/entities/user.entity';
import { SystemConfigUtils } from '../system-configuration/utils/system-config.util';
import { TemplateSpecificationEntity } from '../template-specification/entities/template-specification.entity';
import { ClassDriveInfoEntity } from './entities/drive-info.entity';

describe('ClassService', () => {
  let service: ClassService;
  let repository: Repository<ClassEntity>;
  let usersService: UsersService;
  let templateSpecificationService: TemplateSpecificationService;
  let classDriveInfoService: ClassDriveInfoService;

  // Mock data
  const mockUser = {
    id: '1',
    email: 'teacher@example.com',
    name: 'Test Teacher',
  } as UserEntity;

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
    driveId: '', // Empty string to satisfy the type
  };

  const mockCreateClassWithDriveDto: CreateClassDto = {
    ...mockCreateClassDto,
    driveId: 'mock-drive-id',
  };

  const mockClassEntity = {
    id: 'class-id-1',
    name: 'Test Class',
    classCode: 'TC101',
    courseCode: 'CS101',
    semester: '2023-2024-2',
    teacher: mockUser,
  } as ClassEntity;

  // Save original values to restore later
  const originalDefaultTemplateSpecification = SystemConfigUtils.defaultTemplateSpecification;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassService,
        {
          provide: getRepositoryToken(ClassEntity),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUser: jest.fn(),
          },
        },
        {
          provide: TemplateSpecificationService,
          useValue: {
            _save: jest.fn().mockImplementation(() => Promise.resolve(true)),
          },
        },
        {
          provide: ClassDriveInfoService,
          useValue: {
            create: jest.fn().mockImplementation(() => Promise.resolve({})),
          },
        },
      ],
    }).compile();

    service = module.get<ClassService>(ClassService);
    repository = module.get<Repository<ClassEntity>>(getRepositoryToken(ClassEntity));
    usersService = module.get<UsersService>(UsersService);
    templateSpecificationService = module.get<TemplateSpecificationService>(
      TemplateSpecificationService,
    );
    classDriveInfoService = module.get<ClassDriveInfoService>(ClassDriveInfoService);

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger, 'verbose').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    // Restore original values
    SystemConfigUtils.defaultTemplateSpecification = originalDefaultTemplateSpecification;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Mock data for update tests
  const mockUpdateClassDto = {
    id: 'class-id-1',
    name: 'Updated Class Name',
    classCode: 'TC101-Updated',
    courseCode: 'CS101',
    semester: '2023-2024-2',
  };

  const mockUpdateClassWithDriveDto = {
    ...mockUpdateClassDto,
    driveId: 'new-drive-id',
  };

  describe('create', () => {
    // Scenario 1: Successfully create class with teacher
    it('should successfully create class with teacher', async () => {
      // Arrange
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValueOnce(mockClassEntity);

      // Set defaultTemplateSpecification to empty array to skip that logic
      SystemConfigUtils.defaultTemplateSpecification = [];

      // Act
      const result = await service.create(mockCreateClassDto, mockUserPayload);

      // Assert
      expect(usersService.getUser).toHaveBeenCalledWith({
        where: { email: mockUserPayload.email },
      });
      expect(repository.save).toHaveBeenCalledWith({
        ...mockCreateClassDto,
        teacher: mockUser,
      });
      expect(result).toEqual(mockClassEntity);
      expect(templateSpecificationService._save).not.toHaveBeenCalled();
      expect(classDriveInfoService.create).not.toHaveBeenCalled();
    });

    // Scenario 2: Create class with default templates
    it('should create class with default template specifications', async () => {
      // Arrange
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValueOnce(mockClassEntity);

      // Set mock default template specifications
      const mockTemplateSpecs = [
        { id: '1', name: 'Template1' },
        { id: '2', name: 'Template2' },
      ] as Partial<TemplateSpecificationEntity>[];

      SystemConfigUtils.defaultTemplateSpecification = mockTemplateSpecs;

      jest.spyOn(templateSpecificationService, '_save').mockImplementation(() => {
        return Promise.resolve(true);
      });

      // Act
      const result = await service.create(mockCreateClassDto, mockUserPayload);

      // Allow time for the async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(usersService.getUser).toHaveBeenCalledWith({
        where: { email: mockUserPayload.email },
      });
      expect(repository.save).toHaveBeenCalledWith({
        ...mockCreateClassDto,
        teacher: mockUser,
      });
      expect(templateSpecificationService._save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Template1',
            class: mockClassEntity,
          }),
          expect.objectContaining({
            name: 'Template2',
            class: mockClassEntity,
          }),
        ]),
      );
      expect(result).toEqual(mockClassEntity);
    });

    // Scenario 3: Create class with driveId
    it('should create class with driveId and call classDriveInfoService', async () => {
      // Arrange
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValueOnce(mockClassEntity);

      // Temporarily set defaultTemplateSpecification to empty array to skip that logic
      SystemConfigUtils.defaultTemplateSpecification = [];

      jest.spyOn(classDriveInfoService, 'create').mockImplementation(() => {
        return Promise.resolve({} as ClassDriveInfoEntity);
      });

      // Act
      const result = await service.create(mockCreateClassWithDriveDto, mockUserPayload);

      // Allow time for the async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(usersService.getUser).toHaveBeenCalledWith({
        where: { email: mockUserPayload.email },
      });
      expect(repository.save).toHaveBeenCalledWith({
        ...mockCreateClassWithDriveDto,
        teacher: mockUser,
      });
      expect(classDriveInfoService.create).toHaveBeenCalledWith(
        mockClassEntity.id,
        mockCreateClassWithDriveDto.driveId,
      );
      expect(result).toEqual(mockClassEntity);
    });

    // Scenario 4: Throw error for non-existent teacher
    it('should throw BadRequestException when teacher does not exist', async () => {
      // Arrange
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.create(mockCreateClassDto, mockUserPayload)).rejects.toThrow(
        new BadRequestException(`Teacher with email ${mockUserPayload.email} not found`),
      );

      expect(usersService.getUser).toHaveBeenCalledWith({
        where: { email: mockUserPayload.email },
      });
      expect(repository.save).not.toHaveBeenCalled();
      expect(templateSpecificationService._save).not.toHaveBeenCalled();
      expect(classDriveInfoService.create).not.toHaveBeenCalled();
    });

    // Scenario 5: Handle template specification creation error
    it('should handle template specification creation error gracefully', async () => {
      // Arrange
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValueOnce(mockClassEntity);

      // Set mock default template specifications
      const mockTemplateSpecs = [
        { id: '1', name: 'Template1' },
      ] as Partial<TemplateSpecificationEntity>[];

      SystemConfigUtils.defaultTemplateSpecification = mockTemplateSpecs;

      // Simulate error in template specification creation
      jest.spyOn(templateSpecificationService, '_save').mockImplementation(() => {
        return Promise.reject(new Error('Template error'));
      });

      // Act
      const result = await service.create(mockCreateClassDto, mockUserPayload);

      // Assert
      expect(usersService.getUser).toHaveBeenCalledWith({
        where: { email: mockUserPayload.email },
      });
      expect(repository.save).toHaveBeenCalledWith({
        ...mockCreateClassDto,
        teacher: mockUser,
      });
      expect(templateSpecificationService._save).toHaveBeenCalled();

      // Wait for error to be logged (asynchronous)
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(Logger.error).toHaveBeenCalled();
      // The class should still be created despite the template error
      expect(result).toEqual(mockClassEntity);
    });

    // Scenario 6: Handle drive info creation error
    it('should handle drive info creation error and update class', async () => {
      // Arrange
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValueOnce(mockClassEntity);

      // Temporarily set defaultTemplateSpecification to empty array to skip that logic
      SystemConfigUtils.defaultTemplateSpecification = [];

      // Simulate error in drive info creation
      jest.spyOn(classDriveInfoService, 'create').mockImplementation(() => {
        return Promise.reject(new Error('Drive error'));
      });
      jest.spyOn(repository, 'update').mockResolvedValueOnce({} as UpdateResult);

      // Act
      const result = await service.create(mockCreateClassWithDriveDto, mockUserPayload);

      // Assert
      expect(usersService.getUser).toHaveBeenCalledWith({
        where: { email: mockUserPayload.email },
      });
      expect(repository.save).toHaveBeenCalledWith({
        ...mockCreateClassWithDriveDto,
        teacher: mockUser,
      });
      expect(classDriveInfoService.create).toHaveBeenCalledWith(
        mockClassEntity.id,
        mockCreateClassWithDriveDto.driveId,
      );

      // Wait for error to be logged (asynchronous)
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(Logger.error).toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(mockClassEntity.id, {
        driveId: null,
      });
      expect(result).toEqual(mockClassEntity);
    });
  });

  describe('update', () => {
    // Scenario 1: Successfully update class
    it('should successfully update class', async () => {
      // Arrange
      const updatedClassEntity = {
        ...mockClassEntity,
        name: mockUpdateClassDto.name,
        classCode: mockUpdateClassDto.classCode,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockClassEntity);
      jest.spyOn(repository, 'save').mockResolvedValueOnce(updatedClassEntity);

      // Act
      const result = await service.update(mockUpdateClassDto, mockUserPayload);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockUpdateClassDto.id, teacher: { email: mockUserPayload.email } },
      });
      expect(repository.save).toHaveBeenCalledWith({
        ...mockClassEntity,
        ...mockUpdateClassDto,
      });
      expect(result).toEqual(updatedClassEntity);
      expect(classDriveInfoService.create).not.toHaveBeenCalled();
    });

    // Scenario 2: Update class with new driveId
    it('should update class with new driveId and call classDriveInfoService', async () => {
      // Arrange
      const classWithoutDriveId = {
        ...mockClassEntity,
        driveId: null,
      };

      const updatedClassEntity = {
        ...classWithoutDriveId,
        name: mockUpdateClassWithDriveDto.name,
        classCode: mockUpdateClassWithDriveDto.classCode,
        driveId: mockUpdateClassWithDriveDto.driveId,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(classWithoutDriveId);
      jest.spyOn(repository, 'save').mockResolvedValueOnce(updatedClassEntity);
      jest.spyOn(classDriveInfoService, 'create').mockImplementation(() => {
        return Promise.resolve({} as ClassDriveInfoEntity);
      });

      // Act
      const result = await service.update(mockUpdateClassWithDriveDto, mockUserPayload);

      // Allow time for the async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockUpdateClassWithDriveDto.id, teacher: { email: mockUserPayload.email } },
      });
      expect(classDriveInfoService.create).toHaveBeenCalledWith(
        classWithoutDriveId.id,
        mockUpdateClassWithDriveDto.driveId,
      );
      expect(repository.save).toHaveBeenCalledWith({
        ...classWithoutDriveId,
        ...mockUpdateClassWithDriveDto,
      });
      expect(result).toEqual(updatedClassEntity);
    });

    // Scenario 3: Class not found
    it('should throw BadRequestException when class does not exist', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.update(mockUpdateClassDto, mockUserPayload)).rejects.toThrow(
        new BadRequestException(`Class with id ${mockUpdateClassDto.id} not found`),
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockUpdateClassDto.id, teacher: { email: mockUserPayload.email } },
      });
      expect(repository.save).not.toHaveBeenCalled();
      expect(classDriveInfoService.create).not.toHaveBeenCalled();
    });

    // Scenario 4: Handle drive info creation error
    it('should handle drive info creation error and restore original driveId', async () => {
      // Arrange
      const classWithExistingDriveId = {
        ...mockClassEntity,
        driveId: 'existing-drive-id',
      };

      const updatedClassEntity = {
        ...classWithExistingDriveId,
        name: mockUpdateClassWithDriveDto.name,
        classCode: mockUpdateClassWithDriveDto.classCode,
        driveId: mockUpdateClassWithDriveDto.driveId,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(classWithExistingDriveId);
      jest.spyOn(repository, 'save').mockResolvedValueOnce(updatedClassEntity);

      // Simulate error in drive info creation
      jest.spyOn(classDriveInfoService, 'create').mockImplementation(() => {
        return Promise.reject(new Error('Drive error'));
      });
      jest.spyOn(repository, 'update').mockResolvedValueOnce({} as UpdateResult);

      // Act
      const result = await service.update(mockUpdateClassWithDriveDto, mockUserPayload);

      // Allow time for the async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockUpdateClassWithDriveDto.id, teacher: { email: mockUserPayload.email } },
      });
      expect(classDriveInfoService.create).toHaveBeenCalledWith(
        classWithExistingDriveId.id,
        mockUpdateClassWithDriveDto.driveId,
      );
      expect(Logger.error).toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(classWithExistingDriveId.id, {
        driveId: classWithExistingDriveId.driveId,
      });
      expect(result).toEqual(updatedClassEntity);
    });
  });

  describe('delete', () => {
    // Scenario 1: Successfully delete existing class
    it('should successfully delete an existing class', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockClassEntity);
      jest.spyOn(repository, 'softDelete').mockResolvedValueOnce({ affected: 1 } as any);

      // Act
      const result = await service.delete(mockClassEntity.id, mockUserPayload);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockClassEntity.id, teacher: { email: mockUserPayload.email } },
      });
      expect(repository.softDelete).toHaveBeenCalledWith(mockClassEntity.id);
      expect(result).toBe(true);
    });

    // Scenario 2: Throw error for non-existent class
    it('should throw BadRequestException when class does not exist', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.delete('non-existent-id', mockUserPayload)).rejects.toThrow(
        new BadRequestException('Class with id non-existent-id not found'),
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id', teacher: { email: mockUserPayload.email } },
      });
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    // Scenario 3: Throw error for unauthorized user
    it('should throw BadRequestException when user is not authorized', async () => {
      // Arrange
      const unauthorizedUserPayload: UserPayload = {
        email: 'unauthorized@example.com',
        role: 'teacher',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.delete(mockClassEntity.id, unauthorizedUserPayload)).rejects.toThrow(
        new BadRequestException(`Class with id ${mockClassEntity.id} not found`),
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockClassEntity.id, teacher: { email: unauthorizedUserPayload.email } },
      });
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    // Scenario 4: Verify softDelete is called
    it('should call repository.softDelete with correct id', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockClassEntity);
      jest.spyOn(repository, 'softDelete').mockResolvedValueOnce({ affected: 1 } as any);

      // Act
      await service.delete(mockClassEntity.id, mockUserPayload);

      // Assert
      expect(repository.softDelete).toHaveBeenCalledWith(mockClassEntity.id);
    });
  });
});
