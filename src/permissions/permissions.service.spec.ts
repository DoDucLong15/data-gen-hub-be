import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PermissionEntity } from './entities/permission.entity';
import { BadRequestException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreatePermissionDto, UpdatePermissionDto } from './dtos/permission.dto';
import { EAction } from './enums/action.enum';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionRepository: Repository<PermissionEntity>;

  // Mock data
  const mockPermission = {
    id: 'permission-id-1',
    action: EAction.READ,
    subject: 'users',
    fields: ['id', 'name', 'email'],
    conditions: { isOwner: true },
    description: 'Đọc thông tin người dùng',
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as PermissionEntity;

  const mockPermissions = [
    mockPermission,
    {
      id: 'permission-id-2',
      action: EAction.CREATE,
      subject: 'users',
      fields: null,
      conditions: null,
      description: 'Tạo người dùng mới',
      roles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as PermissionEntity,
  ];

  const mockCreatePermissionDto: CreatePermissionDto = {
    action: EAction.READ,
    subject: 'users',
    fields: ['id', 'name', 'email'],
    conditions: { isOwner: true },
    description: 'Đọc thông tin người dùng',
  };

  const mockUpdatePermissionDto: UpdatePermissionDto = {
    id: 'permission-id-1',
    action: EAction.UPDATE,
    subject: 'users',
    fields: ['id', 'name', 'email', 'phone'],
    conditions: { isAdmin: true },
    description: 'Cập nhật thông tin người dùng',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(PermissionEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    permissionRepository = module.get<Repository<PermissionEntity>>(
      getRepositoryToken(PermissionEntity),
    );

    // Mock Logger để ngăn in ra console trong tests
    jest.spyOn(Logger, 'verbose').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPermission', () => {
    it('should return a permission with provided options', async () => {
      // Arrange
      const options = {
        where: { id: 'permission-id-1' },
      };
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValueOnce(mockPermission);

      // Act
      const result = await service.getPermission(options);

      // Assert
      expect(permissionRepository.findOne).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockPermission);
    });

    it('should return null when permission not found', async () => {
      // Arrange
      const options = {
        where: { id: 'non-existent-id' },
      };
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValueOnce(null);

      // Act
      const result = await service.getPermission(options);

      // Assert
      expect(permissionRepository.findOne).toHaveBeenCalledWith(options);
      expect(result).toBeNull();
    });
  });

  describe('getPermissions', () => {
    it('should return all permissions with provided options', async () => {
      // Arrange
      const options = {
        relations: {
          roles: true,
        },
      };
      jest.spyOn(permissionRepository, 'find').mockResolvedValueOnce(mockPermissions);

      // Act
      const result = await service.getPermissions(options);

      // Assert
      expect(permissionRepository.find).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockPermissions);
    });

    it('should return all permissions when no options provided', async () => {
      // Arrange
      jest.spyOn(permissionRepository, 'find').mockResolvedValueOnce(mockPermissions);

      // Act
      const result = await service.getPermissions();

      // Assert
      expect(permissionRepository.find).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockPermissions);
    });
  });

  describe('createPermission', () => {
    it('should successfully create a permission', async () => {
      // Arrange
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(permissionRepository, 'save').mockResolvedValueOnce(mockPermission);

      // Act
      const result = await service.createPermission(mockCreatePermissionDto);

      // Assert
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: {
          subject: mockCreatePermissionDto.subject,
          action: mockCreatePermissionDto.action,
          fields: mockCreatePermissionDto.fields,
          conditions: mockCreatePermissionDto.conditions,
        },
      });
      expect(permissionRepository.save).toHaveBeenCalledWith({
        action: mockCreatePermissionDto.action,
        subject: mockCreatePermissionDto.subject,
        fields: mockCreatePermissionDto.fields,
        conditions: mockCreatePermissionDto.conditions,
        description: mockCreatePermissionDto.description,
      });
      expect(result).toEqual(mockPermission);
    });

    it('should throw BadRequestException when permission already exists', async () => {
      // Arrange
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValueOnce(mockPermission);

      // Act & Assert
      await expect(service.createPermission(mockCreatePermissionDto)).rejects.toThrow(
        new BadRequestException('Permission already exists.'),
      );
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: {
          subject: mockCreatePermissionDto.subject,
          action: mockCreatePermissionDto.action,
          fields: mockCreatePermissionDto.fields,
          conditions: mockCreatePermissionDto.conditions,
        },
      });
      expect(permissionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updatePermission', () => {
    it('should successfully update a permission', async () => {
      // Arrange
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValueOnce(mockPermission);
      const updatedPermission = {
        ...mockPermission,
        action: mockUpdatePermissionDto.action,
        subject: mockUpdatePermissionDto.subject,
        fields: mockUpdatePermissionDto.fields,
        conditions: mockUpdatePermissionDto.conditions,
        description: mockUpdatePermissionDto.description,
      };
      jest
        .spyOn(permissionRepository, 'save')
        .mockResolvedValueOnce(updatedPermission as PermissionEntity);

      // Act
      const result = await service.updatePermission(mockUpdatePermissionDto);

      // Assert
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockUpdatePermissionDto.id,
        },
      });
      expect(permissionRepository.save).toHaveBeenCalledWith({
        ...mockPermission,
        action: mockUpdatePermissionDto.action,
        subject: mockUpdatePermissionDto.subject,
        fields: mockUpdatePermissionDto.fields,
        conditions: mockUpdatePermissionDto.conditions,
        description: mockUpdatePermissionDto.description,
      });
      expect(result).toEqual(updatedPermission);
    });

    it('should throw BadRequestException when permission does not exist', async () => {
      // Arrange
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.updatePermission(mockUpdatePermissionDto)).rejects.toThrow(
        new BadRequestException('Permission does not exist.'),
      );
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockUpdatePermissionDto.id,
        },
      });
      expect(permissionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deletePermission', () => {
    it('should successfully delete a permission', async () => {
      // Arrange
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValueOnce(mockPermission);
      jest.spyOn(permissionRepository, 'delete').mockResolvedValueOnce({ affected: 1, raw: [] });

      // Act
      const result = await service.deletePermission('permission-id-1');

      // Assert
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'permission-id-1' },
      });
      expect(permissionRepository.delete).toHaveBeenCalledWith('permission-id-1');
      expect(result).toEqual({
        status: 'success',
        message: 'Permission deleted successfully.',
      });
    });

    it('should throw BadRequestException when permission not found', async () => {
      // Arrange
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.deletePermission('non-existent-id')).rejects.toThrow(
        new BadRequestException('Permission not found.'),
      );
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
      expect(permissionRepository.delete).not.toHaveBeenCalled();
    });
  });
});
