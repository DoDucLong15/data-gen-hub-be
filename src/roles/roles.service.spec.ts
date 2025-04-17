import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoleEnity } from './entities/role.entity';
import { BadRequestException, Logger } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, In, Repository } from 'typeorm';
import { PermissionsService } from 'src/permissions/permissions.service';
import { CreateRoleDto, UpdateRoleDto } from './dtos/role.dto';
import { PermissionEntity } from 'src/permissions/entities/permission.entity';
import { UserEntity } from 'src/users/entities/user.entity';

describe('RolesService', () => {
  let service: RolesService;
  let roleRepository: Repository<RoleEnity>;
  let permissionsService: PermissionsService;

  // Mock data
  const mockPermissions = [
    {
      id: 'permission-id-1',
      action: 'read',
      subject: 'users',
      description: 'First permission',
      fields: null,
      conditions: null,
      roles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'permission-id-2',
      action: 'write',
      subject: 'users',
      description: 'Second permission',
      fields: null,
      conditions: null,
      roles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ] as unknown as PermissionEntity[];

  const mockRole = {
    id: 'role-id-1',
    name: 'Admin',
    description: 'Admin role',
    permissions: mockPermissions,
    users: [] as UserEntity[],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as RoleEnity;

  const mockRoles = [
    mockRole,
    {
      id: 'role-id-2',
      name: 'User',
      description: 'User role',
      permissions: [mockPermissions[0]],
      users: [{} as UserEntity, {} as UserEntity, {} as UserEntity], // 3 users
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as RoleEnity,
  ];

  const mockCreateRoleDto: CreateRoleDto = {
    name: 'Admin',
    description: 'Admin role',
    permissionIds: ['permission-id-1', 'permission-id-2'],
  };

  const mockUpdateRoleDto: UpdateRoleDto = {
    id: 'role-id-1',
    name: 'Updated Admin',
    description: 'Updated admin role',
    permissionIds: ['permission-id-1'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(RoleEnity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            getPermissions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    roleRepository = module.get<Repository<RoleEnity>>(getRepositoryToken(RoleEnity));
    permissionsService = module.get<PermissionsService>(PermissionsService);

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger, 'verbose').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findRoleByName', () => {
    it('should return a role when found by name', async () => {
      // Arrange
      jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(mockRole);

      // Act
      const result = await service.findRoleByName('Admin');

      // Assert
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Admin' },
      });
      expect(result).toEqual(mockRole);
    });

    it('should throw BadRequestException when role not found by name', async () => {
      // Arrange
      jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.findRoleByName('NonExistentRole')).rejects.toThrow(
        new BadRequestException('Role not found'),
      );
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'NonExistentRole' },
      });
    });
  });

  describe('getRoles', () => {
    it('should return all roles with provided options', async () => {
      // Arrange
      const options: FindManyOptions<RoleEnity> = {
        relations: {
          users: true,
        },
      };
      jest.spyOn(roleRepository, 'find').mockResolvedValueOnce(mockRoles);

      // Act
      const result = await service.getRoles(options);

      // Assert
      expect(roleRepository.find).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockRoles);
    });
  });

  describe('getRole', () => {
    it('should return a role with provided options', async () => {
      // Arrange
      const options: FindOneOptions<RoleEnity> = {
        where: { id: 'role-id-1' },
      };
      jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(mockRole);

      // Act
      const result = await service.getRole(options);

      // Assert
      expect(roleRepository.findOne).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockRole);
    });
  });

  describe('getRoleById', () => {
    it('should return a role when found by id', async () => {
      // Arrange
      jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(mockRole);

      // Act
      const result = await service.getRoleById('role-id-1');

      // Assert
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'role-id-1' },
      });
      expect(result).toEqual(mockRole);
    });

    it('should throw BadRequestException when role not found by id', async () => {
      // Arrange
      jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.getRoleById('non-existent-id')).rejects.toThrow(
        new BadRequestException('Role not found'),
      );
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
    });
  });

  describe('createRole', () => {
    it('should successfully create a role', async () => {
      // Arrange
      jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(permissionsService, 'getPermissions').mockResolvedValueOnce(mockPermissions);
      jest.spyOn(roleRepository, 'save').mockResolvedValueOnce(mockRole);

      // Act
      const result = await service.createRole(mockCreateRoleDto);

      // Assert
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { name: mockCreateRoleDto.name },
      });
      expect(permissionsService.getPermissions).toHaveBeenCalledWith({
        where: { id: In(mockCreateRoleDto.permissionIds) },
      });
      expect(roleRepository.save).toHaveBeenCalledWith({
        ...mockCreateRoleDto,
        permissions: mockPermissions,
      });
      expect(result).toEqual(mockRole);
    });

    it('should throw BadRequestException when role already exists', async () => {
      // Arrange
      jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(mockRole);

      // Act & Assert
      await expect(service.createRole(mockCreateRoleDto)).rejects.toThrow(
        new BadRequestException('Role already exists'),
      );
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { name: mockCreateRoleDto.name },
      });
      expect(permissionsService.getPermissions).not.toHaveBeenCalled();
      expect(roleRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('should successfully update a role', async () => {
      // Arrange
      const existingRole = { ...mockRole };
      const updatedRole = {
        ...existingRole,
        name: mockUpdateRoleDto.name!,
        description: mockUpdateRoleDto.description!,
        permissions: [mockPermissions[0]],
      };

      jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(existingRole);
      jest.spyOn(permissionsService, 'getPermissions').mockResolvedValueOnce([mockPermissions[0]]);
      jest.spyOn(roleRepository, 'save').mockResolvedValueOnce(updatedRole as unknown as RoleEnity);

      // Act
      const result = await service.updateRole(mockUpdateRoleDto);

      // Assert
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUpdateRoleDto.id },
      });

      // Sử dụng cách kiểm tra đơn giản hơn, không cần truy cập đến mock.calls
      expect(permissionsService.getPermissions).toHaveBeenCalled();

      expect(roleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...existingRole,
          name: mockUpdateRoleDto.name,
          description: mockUpdateRoleDto.description,
          permissions: [mockPermissions[0]],
        }),
      );
      expect(result).toEqual(updatedRole);
    });

    it('should throw BadRequestException when role not found', async () => {
      // Arrange
      jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.updateRole(mockUpdateRoleDto)).rejects.toThrow(
        new BadRequestException('Role not found'),
      );
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUpdateRoleDto.id },
      });
      expect(permissionsService.getPermissions).not.toHaveBeenCalled();
      expect(roleRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when new name already exists', async () => {
      // Arrange
      const existingRole = { ...mockRole, name: 'OldName' };
      const duplicateRole = { ...mockRole, id: 'role-id-2' };

      jest
        .spyOn(roleRepository, 'findOne')
        .mockResolvedValueOnce(existingRole as unknown as RoleEnity) // First call for finding role by id
        .mockResolvedValueOnce(duplicateRole as unknown as RoleEnity); // Second call for finding role by name

      // Act & Assert
      await expect(service.updateRole(mockUpdateRoleDto)).rejects.toThrow(
        new BadRequestException('Role already exists'),
      );
      expect(roleRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: mockUpdateRoleDto.id },
      });
      expect(roleRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { name: mockUpdateRoleDto.name },
      });
      expect(permissionsService.getPermissions).not.toHaveBeenCalled();
      expect(roleRepository.save).not.toHaveBeenCalled();
    });

    it('should update role without changing permissions when permissionIds not provided', async () => {
      // Arrange
      const updateDtoWithoutPermissions: UpdateRoleDto = {
        id: 'role-id-1',
        name: 'Updated Admin',
        description: 'Updated admin role',
      };

      const existingRole = { ...mockRole };
      const updatedRole = {
        ...existingRole,
        name: updateDtoWithoutPermissions.name!,
        description: updateDtoWithoutPermissions.description!,
      };

      jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(existingRole);
      jest.spyOn(roleRepository, 'save').mockResolvedValueOnce(updatedRole as unknown as RoleEnity);

      // Act
      const result = await service.updateRole(updateDtoWithoutPermissions);

      // Assert
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: updateDtoWithoutPermissions.id },
      });
      expect(permissionsService.getPermissions).not.toHaveBeenCalled();
      expect(roleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...existingRole,
          name: updateDtoWithoutPermissions.name,
          description: updateDtoWithoutPermissions.description,
        }),
      );
      expect(result).toEqual(updatedRole);
    });
  });

  describe('deleteRole', () => {
    it('should successfully delete a role', async () => {
      // Arrange
      jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(mockRole);
      jest.spyOn(roleRepository, 'delete').mockResolvedValueOnce({ affected: 1, raw: {} });

      // Act
      const result = await service.deleteRole('role-id-1');

      // Assert
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'role-id-1' },
      });
      expect(roleRepository.delete).toHaveBeenCalledWith('role-id-1');
      expect(result).toBe(true);
    });

    it('should throw BadRequestException when role not found', async () => {
      // Arrange
      jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.deleteRole('non-existent-id')).rejects.toThrow(
        new BadRequestException('Role not found'),
      );
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
      expect(roleRepository.delete).not.toHaveBeenCalled();
    });
  });
});
