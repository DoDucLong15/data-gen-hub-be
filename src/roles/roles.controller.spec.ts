import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dtos/role.dto';
import { RoleEnity } from './entities/role.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;

  // Mock data
  const mockRole = {
    id: 'role-id-1',
    name: 'Admin',
    description: 'Admin role',
    permissions: [],
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
      permissions: [],
      users: Array(3).fill({} as UserEntity),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as RoleEnity,
  ];

  // DTOs for testing
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
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: {
            getRoles: jest.fn(),
            createRole: jest.fn(),
            updateRole: jest.fn(),
            deleteRole: jest.fn(),
          },
        },
        {
          provide: AccessTokenGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: PoliciesGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<RolesController>(RolesController);
    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRoles', () => {
    it('should return roles with user count', async () => {
      // Arrange
      const rolesWithUsers = [...mockRoles];
      const expectedRoles = [
        {
          id: mockRoles[0].id,
          name: mockRoles[0].name,
          description: mockRoles[0].description,
          permissions: mockRoles[0].permissions,
          createdAt: mockRoles[0].createdAt,
          updatedAt: mockRoles[0].updatedAt,
          deletedAt: mockRoles[0].deletedAt,
          userCount: 0,
        },
        {
          id: mockRoles[1].id,
          name: mockRoles[1].name,
          description: mockRoles[1].description,
          permissions: mockRoles[1].permissions,
          createdAt: mockRoles[1].createdAt,
          updatedAt: mockRoles[1].updatedAt,
          deletedAt: mockRoles[1].deletedAt,
          userCount: 3,
        },
      ];

      jest.spyOn(service, 'getRoles').mockResolvedValueOnce(rolesWithUsers);

      // Act
      const result = await controller.getRoles();

      // Assert
      expect(service.getRoles).toHaveBeenCalledWith({
        relations: {
          users: true,
        },
      });
      expect(result).toEqual(expectedRoles);
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      // Arrange
      jest.spyOn(service, 'createRole').mockResolvedValueOnce(mockRole);

      // Act
      const result = await controller.createRole(mockCreateRoleDto);

      // Assert
      expect(service.createRole).toHaveBeenCalledWith(mockCreateRoleDto);
      expect(result).toEqual(mockRole);
    });
  });

  describe('updateRole', () => {
    it('should update an existing role', async () => {
      // Arrange
      const updatedRole = {
        ...mockRole,
        name: mockUpdateRoleDto.name!,
        description: mockUpdateRoleDto.description!,
      } as unknown as RoleEnity;

      jest.spyOn(service, 'updateRole').mockResolvedValueOnce(updatedRole);

      // Act
      const result = await controller.updateRole(mockUpdateRoleDto);

      // Assert
      expect(service.updateRole).toHaveBeenCalledWith(mockUpdateRoleDto);
      expect(result).toEqual(updatedRole);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role by id', async () => {
      // Arrange
      const roleId = 'role-id-1';
      jest.spyOn(service, 'deleteRole').mockResolvedValueOnce(true);

      // Act
      const result = await controller.deleteRole(roleId);

      // Assert
      expect(service.deleteRole).toHaveBeenCalledWith(roleId);
      expect(result).toBe(true);
    });
  });
});
