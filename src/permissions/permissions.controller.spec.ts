import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PermissionEntity } from './entities/permission.entity';
import { CreatePermissionDto, UpdatePermissionDto } from './dtos/permission.dto';
import { EAction } from './enums/action.enum';
import { BadRequestException } from '@nestjs/common';
import { BaseResponse } from 'src/base/types/response.type';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { Reflector } from '@nestjs/core';

// Mock guards
jest.mock('src/authorization/guards/policies.guard');
jest.mock('src/auth/guards/access-token.guard');

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let service: PermissionsService;

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

  const mockBaseResponse: BaseResponse = {
    status: 'success',
    message: 'Permission deleted successfully.',
  };

  beforeEach(async () => {
    // Đặt lại trạng thái của mocks trước mỗi test
    jest.clearAllMocks();

    // Mock behavior của guards
    (PoliciesGuard as jest.Mock).mockImplementation(() => ({
      canActivate: jest.fn().mockReturnValue(true),
    }));

    (AccessTokenGuard as jest.Mock).mockImplementation(() => ({
      canActivate: jest.fn().mockReturnValue(true),
    }));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        {
          provide: PermissionsService,
          useValue: {
            createPermission: jest.fn(),
            updatePermission: jest.fn(),
            deletePermission: jest.fn(),
            getPermissions: jest.fn(),
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
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PermissionsController>(PermissionsController);
    service = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPermission', () => {
    it('should successfully create a permission', async () => {
      // Arrange
      jest.spyOn(service, 'createPermission').mockResolvedValueOnce(mockPermission);

      // Act
      const result = await controller.createPermission(mockCreatePermissionDto);

      // Assert
      expect(service.createPermission).toHaveBeenCalledWith(mockCreatePermissionDto);
      expect(result).toEqual(mockPermission);
    });

    it('should throw BadRequestException when permission already exists', async () => {
      // Arrange
      jest
        .spyOn(service, 'createPermission')
        .mockRejectedValueOnce(new BadRequestException('Permission already exists.'));

      // Act & Assert
      await expect(controller.createPermission(mockCreatePermissionDto)).rejects.toThrow(
        new BadRequestException('Permission already exists.'),
      );
      expect(service.createPermission).toHaveBeenCalledWith(mockCreatePermissionDto);
    });
  });

  describe('updatePermission', () => {
    it('should successfully update a permission', async () => {
      // Arrange
      const updatedPermission = {
        ...mockPermission,
        action: mockUpdatePermissionDto.action,
        subject: mockUpdatePermissionDto.subject,
        fields: mockUpdatePermissionDto.fields,
        conditions: mockUpdatePermissionDto.conditions,
        description: mockUpdatePermissionDto.description,
      };
      jest
        .spyOn(service, 'updatePermission')
        .mockResolvedValueOnce(updatedPermission as PermissionEntity);

      // Act
      const result = await controller.updatePermission(mockUpdatePermissionDto);

      // Assert
      expect(service.updatePermission).toHaveBeenCalledWith(mockUpdatePermissionDto);
      expect(result).toEqual(updatedPermission);
    });

    it('should throw BadRequestException when permission does not exist', async () => {
      // Arrange
      jest
        .spyOn(service, 'updatePermission')
        .mockRejectedValueOnce(new BadRequestException('Permission does not exist.'));

      // Act & Assert
      await expect(controller.updatePermission(mockUpdatePermissionDto)).rejects.toThrow(
        new BadRequestException('Permission does not exist.'),
      );
      expect(service.updatePermission).toHaveBeenCalledWith(mockUpdatePermissionDto);
    });
  });

  describe('deletePermission', () => {
    it('should successfully delete a permission', async () => {
      // Arrange
      jest.spyOn(service, 'deletePermission').mockResolvedValueOnce(mockBaseResponse);

      // Act
      const result = await controller.deletePermission('permission-id-1');

      // Assert
      expect(service.deletePermission).toHaveBeenCalledWith('permission-id-1');
      expect(result).toEqual(mockBaseResponse);
    });

    it('should throw BadRequestException when permission not found', async () => {
      // Arrange
      jest
        .spyOn(service, 'deletePermission')
        .mockRejectedValueOnce(new BadRequestException('Permission not found.'));

      // Act & Assert
      await expect(controller.deletePermission('non-existent-id')).rejects.toThrow(
        new BadRequestException('Permission not found.'),
      );
      expect(service.deletePermission).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('getPermissions', () => {
    it('should return all permissions', async () => {
      // Arrange
      jest.spyOn(service, 'getPermissions').mockResolvedValueOnce(mockPermissions);

      // Act
      const result = await controller.getPermissions();

      // Assert
      expect(service.getPermissions).toHaveBeenCalledWith({
        order: {
          createdAt: 'DESC',
        },
      });
      expect(result).toEqual(mockPermissions);
    });
  });
});
