import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RolesService } from '../roles/roles.service';
import { MailerService } from '../mailer/mailer.service';
import { StorageService } from '../storage/storage.service';
import { BadRequestException, Logger } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dtos/user.dto';
import { RoleEnity } from '../roles/entities/role.entity';
import { SystemConfigUtils } from '../system-configuration/utils/system-config.util';
import { TemplateHelper } from '../mailer/helpers/template.helper';
import { AbilityHelper } from '../authorization/helpers/ability.helper';
import { EAction } from '../permissions/enums/action.enum';
import { ESubject } from '../authorization/enums/subject.enum';
import { UserPayload } from '../auth/types/user-playload.type';
import { PermissionEntity } from '../permissions/entities/permission.entity';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<UserEntity>;
  let roleService: RolesService;
  let mailerService: MailerService;
  let storageService: StorageService;

  // Mock data
  const mockRole = {
    id: 'role-id-1',
    name: 'teacher',
    permissions: [],
    description: 'Teacher role',
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as RoleEnity;

  const mockUser = {
    id: 'user-id-1',
    email: 'test@example.com',
    name: 'Test User',
    phone: '0123456789',
    school: 'Test School',
    department: 'Test Department',
    position: 'Test Position',
    role: mockRole,
    roleName: 'teacher',
    avatar: null,
  } as UserEntity;

  const mockCreateUserDto: CreateUserDto = {
    email: 'test@example.com',
    name: 'Test User',
    phone: '0123456789',
    school: 'Test School',
    department: 'Test Department',
    position: 'Test Position',
    roleId: 'role-id-1',
  };

  // Save original values to restore later
  const originalSystemName = SystemConfigUtils.systemName;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: RolesService,
          useValue: {
            getRoleById: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue({} as any),
          },
        },
        {
          provide: StorageService,
          useValue: {
            uploadDataToFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    roleService = module.get<RolesService>(RolesService);
    mailerService = module.get<MailerService>(MailerService);
    storageService = module.get<StorageService>(StorageService);

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger, 'verbose').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);

    // Set system name for testing
    SystemConfigUtils.systemName = 'Test System';
  });

  afterEach(() => {
    // Restore original values
    SystemConfigUtils.systemName = originalSystemName;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    // Scenario 1: Successfully create user
    it('should successfully create a user', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(roleService, 'getRoleById').mockResolvedValueOnce(mockRole);
      jest.spyOn(userRepository, 'save').mockResolvedValueOnce(mockUser);
      jest.spyOn(mailerService, 'sendEmail').mockResolvedValueOnce({} as any);

      // Mock the template helper
      const templateSpy = jest.spyOn(TemplateHelper, 'getTemplateNotifyNewUser');
      templateSpy.mockReturnValue('mock email content');

      // Act
      const result = await service.createUser(mockCreateUserDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
        withDeleted: true,
      });
      expect(roleService.getRoleById).toHaveBeenCalledWith(mockCreateUserDto.roleId);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockCreateUserDto,
        role: mockRole,
      });
      expect(mailerService.sendEmail).toHaveBeenCalledWith({
        to: mockUser.email,
        subject: `Welcome to ${SystemConfigUtils.systemName}`,
        content: expect.any(String),
      });
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        phone: mockUser.phone,
        school: mockUser.school,
        department: mockUser.department,
        position: mockUser.position,
        role: mockUser.roleName,
        roleId: mockUser.role.id,
        avatar: null,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        deletedAt: mockUser.deletedAt,
        permissions: expect.any(Array),
      });
    });

    // Scenario 2: Reject existing user
    it('should throw BadRequestException when user already exists', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser);

      // Act & Assert
      await expect(service.createUser(mockCreateUserDto)).rejects.toThrow(
        new BadRequestException(`User ${mockCreateUserDto.email} already exists`),
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
        withDeleted: true,
      });
      expect(roleService.getRoleById).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });

    // Scenario 3: Reject soft-deleted user
    it('should throw BadRequestException when user exists but is soft-deleted', async () => {
      // Arrange
      const softDeletedUser = {
        ...mockUser,
        deletedAt: new Date(),
        roleName: 'teacher',
      } as UserEntity;
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(softDeletedUser);

      // Act & Assert
      await expect(service.createUser(mockCreateUserDto)).rejects.toThrow(
        new BadRequestException(
          `User ${mockCreateUserDto.email} already exists, please restore it.`,
        ),
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
        withDeleted: true,
      });
      expect(roleService.getRoleById).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });

    // Scenario 4: Handle role not found
    it('should propagate BadRequestException when role is not found', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);
      jest
        .spyOn(roleService, 'getRoleById')
        .mockRejectedValueOnce(new BadRequestException('Role not found'));

      // Act & Assert
      await expect(service.createUser(mockCreateUserDto)).rejects.toThrow(
        new BadRequestException('Role not found'),
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
        withDeleted: true,
      });
      expect(roleService.getRoleById).toHaveBeenCalledWith(mockCreateUserDto.roleId);
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });

    // Scenario 5: Handle email sending failure
    it('should still create user when email sending fails', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(roleService, 'getRoleById').mockResolvedValueOnce(mockRole);
      jest.spyOn(userRepository, 'save').mockResolvedValueOnce(mockUser);

      // Mock email sending failure
      const emailError = new Error('Failed to send email');
      jest.spyOn(mailerService, 'sendEmail').mockRejectedValueOnce(emailError);

      // Mock the template helper
      const templateSpy = jest.spyOn(TemplateHelper, 'getTemplateNotifyNewUser');
      templateSpy.mockReturnValue('mock email content');

      // Act
      const result = await service.createUser(mockCreateUserDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
        withDeleted: true,
      });
      expect(roleService.getRoleById).toHaveBeenCalledWith(mockCreateUserDto.roleId);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockCreateUserDto,
        role: mockRole,
      });
      expect(mailerService.sendEmail).toHaveBeenCalledWith({
        to: mockUser.email,
        subject: `Welcome to ${SystemConfigUtils.systemName}`,
        content: expect.any(String),
      });

      // Wait for error to be logged (asynchronous)
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(Logger.error).toHaveBeenCalled();

      // User should still be created despite email error
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        phone: mockUser.phone,
        school: mockUser.school,
        department: mockUser.department,
        position: mockUser.position,
        role: mockUser.roleName,
        roleId: mockUser.role.id,
        avatar: null,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        deletedAt: mockUser.deletedAt,
        permissions: expect.any(Array),
      });
    });
  });

  describe('updateUserInfo', () => {
    // Mock dữ liệu cần thiết cho update
    const mockUpdateDto: UpdateUserDto = {
      id: 'user-id-1',
      name: 'Updated Name',
      department: 'Updated Department',
      email: 'test@example.com',
      phone: '0123456789',
      school: 'Test School',
      position: 'Test Position',
      roleId: 'role-id-1',
    };

    const mockUserPayload: UserPayload = {
      email: 'test@example.com',
      role: 'teacher',
    };

    const mockUpdatedUser = {
      ...mockUser,
      name: 'Updated Name',
      department: 'Updated Department',
      roleName: 'teacher',
    };

    // Mock file for testing
    const mockFile = undefined as unknown as Express.Multer.File;

    // Kịch bản 1: Cập nhật thành công dữ liệu người dùng
    it('should successfully update user info when user updates their own info', async () => {
      // Arrange
      jest.spyOn(service, 'createPrincipalAbility').mockResolvedValue({
        can: jest.fn().mockReturnValue(false),
        cannot: jest.fn().mockReturnValue(true),
      } as any);

      jest.spyOn(AbilityHelper, 'canAction').mockReturnValue(false);

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUpdatedUser as UserEntity);

      // Act
      const result = await service.updateUserInfo(mockUpdateDto, mockUserPayload, mockFile);

      // Assert
      expect(service.createPrincipalAbility).toHaveBeenCalledWith(mockUserPayload.email);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUpdateDto.id },
      });
      expect(AbilityHelper.canAction).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockUser,
          ...mockUpdateDto,
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          name: mockUpdateDto.name,
          department: mockUpdateDto.department,
          email: mockUser.email,
        }),
      );
    });

    // Kịch bản 2: Admin cập nhật thông tin người dùng khác
    it('should successfully update user info when admin updates another user', async () => {
      // Arrange
      const adminPayload: UserPayload = {
        email: 'admin@example.com',
        role: 'admin',
      };

      jest.spyOn(service, 'createPrincipalAbility').mockResolvedValue({
        can: jest.fn().mockReturnValue(true),
        cannot: jest.fn().mockReturnValue(false),
      } as any);

      jest.spyOn(AbilityHelper, 'canAction').mockReturnValue(true);

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUpdatedUser as UserEntity);

      // Act
      const result = await service.updateUserInfo(mockUpdateDto, adminPayload, mockFile);

      // Assert
      expect(service.createPrincipalAbility).toHaveBeenCalledWith(adminPayload.email);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUpdateDto.id },
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          name: mockUpdateDto.name,
          department: mockUpdateDto.department,
        }),
      );
    });

    // Kịch bản 3: Lỗi khi người dùng không tồn tại
    it('should throw BadRequestException when user is not found', async () => {
      // Arrange
      jest.spyOn(service, 'createPrincipalAbility').mockResolvedValue({} as any);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateUserInfo(mockUpdateDto, mockUserPayload, mockFile),
      ).rejects.toThrow(new BadRequestException(`User ${mockUpdateDto.id} not found`));
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    // Kịch bản 4: Người dùng không có quyền cập nhật người dùng khác
    it('should throw BadRequestException when user tries to update another user without permission', async () => {
      // Arrange
      const otherUserPayload: UserPayload = {
        email: 'other@example.com',
        role: 'teacher',
      };

      jest.spyOn(service, 'createPrincipalAbility').mockResolvedValue({
        can: jest.fn().mockReturnValue(false),
        cannot: jest.fn().mockReturnValue(true),
      } as any);

      jest.spyOn(AbilityHelper, 'canAction').mockReturnValue(false);

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.updateUserInfo(mockUpdateDto, otherUserPayload, mockFile),
      ).rejects.toThrow(new BadRequestException(`You can't update this user`));
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    // Kịch bản 5: Cập nhật role
    it('should update role when user has permission', async () => {
      // Arrange
      const updateWithRoleDto: UpdateUserDto = {
        ...mockUpdateDto,
        roleId: 'new-role-id',
      };

      const mockNewRole = {
        id: 'new-role-id',
        name: 'student',
        permissions: [],
        description: 'Student role',
        users: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as unknown as RoleEnity;

      const mockUpdatedUserWithRole = {
        ...mockUpdatedUser,
        role: mockNewRole,
        roleName: 'student',
      };

      jest.spyOn(service, 'createPrincipalAbility').mockResolvedValue({} as any);
      jest.spyOn(AbilityHelper, 'canAction').mockReturnValue(true);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(roleService, 'getRoleById').mockResolvedValue(mockNewRole);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUpdatedUserWithRole as UserEntity);

      // Act
      const result = await service.updateUserInfo(updateWithRoleDto, mockUserPayload, mockFile);

      // Assert
      expect(roleService.getRoleById).toHaveBeenCalledWith(updateWithRoleDto.roleId);
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockUser,
          ...updateWithRoleDto,
          role: mockNewRole,
        }),
      );
      expect(result.roleId).toEqual(mockNewRole.id);
    });

    // Kịch bản 6: Không có quyền cập nhật role
    it('should throw BadRequestException when user tries to update role without permission', async () => {
      // Arrange
      const updateWithRoleDto: UpdateUserDto = {
        ...mockUpdateDto,
        roleId: 'new-role-id',
      };

      // Đảm bảo mockUser có role đầy đủ
      const userWithRole = {
        ...mockUser,
        role: { ...mockRole },
        roleName: 'teacher',
      } as UserEntity;

      jest.spyOn(service, 'createPrincipalAbility').mockResolvedValue({} as any);
      jest.spyOn(AbilityHelper, 'canAction').mockImplementation((ability, rule) => {
        if (rule.action === EAction.MANAGE && rule.subject === ESubject.System_Users) {
          return false;
        }
        return true;
      });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithRole);

      // Act & Assert
      await expect(
        service.updateUserInfo(updateWithRoleDto, mockUserPayload, mockFile),
      ).rejects.toThrow(new BadRequestException(`You can't update role`));
      expect(roleService.getRoleById).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    // Kịch bản 7: Cập nhật email
    it('should update email when user has permission', async () => {
      // Arrange
      const updateWithEmailDto: UpdateUserDto = {
        ...mockUpdateDto,
        email: 'newemail@example.com',
        // Đảm bảo không gửi roleId mới để không vướng vào điều kiện kiểm tra role
        roleId: mockRole.id,
      };

      // Mock roleService.getRoleById để tránh lỗi trong trường hợp gặp điều kiện kiểm tra role
      jest.spyOn(roleService, 'getRoleById').mockResolvedValue(mockRole);

      const mockUpdatedUserWithEmail = {
        ...mockUpdatedUser,
        email: 'newemail@example.com',
        roleName: 'teacher',
      };

      jest.spyOn(service, 'createPrincipalAbility').mockResolvedValue({} as any);
      jest.spyOn(AbilityHelper, 'canAction').mockReturnValue(true);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUpdatedUserWithEmail as UserEntity);

      // Act
      const result = await service.updateUserInfo(updateWithEmailDto, mockUserPayload, mockFile);

      // Assert
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockUser,
          ...updateWithEmailDto,
        }),
      );
      expect(result.email).toEqual(updateWithEmailDto.email);
    });

    // Kịch bản 8: Không có quyền cập nhật email
    it('should throw BadRequestException when user tries to update email without permission', async () => {
      // Arrange
      const updateWithEmailDto: UpdateUserDto = {
        id: 'user-id-1',
        name: 'Updated Name',
        department: 'Updated Department',
        email: 'newemail@example.com', // Email mới khác với email hiện tại
        phone: '0123456789',
        school: 'Test School',
        position: 'Test Position',
        roleId: mockRole.id,
      };

      // Sử dụng chính email của user để bypass điều kiện ở dòng 86
      const selfUserPayload: UserPayload = {
        email: mockUser.email, // Email của chính user (test@example.com)
        role: 'teacher',
      };

      // Đảm bảo đủ thuộc tính cho userRepository.findOne
      const userWithCompleteData = {
        ...mockUser,
        email: 'test@example.com', // Đảm bảo email hiện tại khác với email mới
        role: mockRole,
        roleName: 'teacher',
      } as UserEntity;

      jest.spyOn(service, 'createPrincipalAbility').mockResolvedValue({} as any);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithCompleteData);

      // QUAN TRỌNG: Mock AbilityHelper.canAction để trả về true cho lần gọi đầu tiên (dòng 86)
      // và false cho lần gọi thứ hai (dòng 105)
      let callCount = 0;
      jest.spyOn(AbilityHelper, 'canAction').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Quan trọng: Trả về TRUE ở lần gọi đầu tiên để bypass điều kiện ở dòng 86
          // !canAction && updateBy.email !== user.email phải trở thành false để không throw error ở đây
          return true;
        }
        // Trả về FALSE ở lần gọi thứ hai để kích hoạt lỗi "You can't update email" ở dòng 111
        return false;
      });

      // Act & Assert
      await expect(
        service.updateUserInfo(updateWithEmailDto, selfUserPayload, mockFile),
      ).rejects.toThrow(new BadRequestException(`You can't update email`));
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    // Kịch bản 9: Role không tồn tại khi cập nhật
    it('should throw BadRequestException when role is not found', async () => {
      // Arrange
      const updateWithRoleDto: UpdateUserDto = {
        ...mockUpdateDto,
        roleId: 'non-existent-role-id',
      };

      jest.spyOn(service, 'createPrincipalAbility').mockResolvedValue({} as any);
      jest.spyOn(AbilityHelper, 'canAction').mockReturnValue(true);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(roleService, 'getRoleById').mockResolvedValue(null as unknown as RoleEnity);

      // Act & Assert
      await expect(
        service.updateUserInfo(updateWithRoleDto, mockUserPayload, mockFile),
      ).rejects.toThrow(new BadRequestException(`Role ${updateWithRoleDto.roleId} not found`));
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    // Scenario 1: Successfully soft delete user
    it('should successfully soft delete a user that exists and is not already deleted', async () => {
      // Arrange
      const userId = 'user-id-1';
      const mockActiveUser = {
        ...mockUser,
        deletedAt: null,
        roleName: 'teacher',
      } as unknown as UserEntity;

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockActiveUser);
      jest.spyOn(userRepository, 'softDelete').mockResolvedValueOnce({} as any);
      jest.spyOn(userRepository, 'delete').mockResolvedValueOnce({} as any);

      // Act
      const result = await service.deleteUser(userId);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        withDeleted: true,
      });
      expect(userRepository.softDelete).toHaveBeenCalledWith(userId);
      expect(userRepository.delete).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    // Scenario 2: Successfully hard delete user
    it('should successfully hard delete a user that is already soft-deleted', async () => {
      // Arrange
      const userId = 'user-id-1';
      const mockSoftDeletedUser = {
        ...mockUser,
        deletedAt: new Date(), // User is already soft-deleted
        roleName: 'teacher',
      } as unknown as UserEntity;

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockSoftDeletedUser);
      jest.spyOn(userRepository, 'softDelete').mockResolvedValueOnce({} as any);
      jest.spyOn(userRepository, 'delete').mockResolvedValueOnce({} as any);

      // Act
      const result = await service.deleteUser(userId);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        withDeleted: true,
      });
      expect(userRepository.softDelete).not.toHaveBeenCalled();
      expect(userRepository.delete).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    // Scenario 3: User not found
    it('should throw BadRequestException when user is not found', async () => {
      // Arrange
      const userId = 'non-existent-user-id';

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.deleteUser(userId)).rejects.toThrow(
        new BadRequestException(`User ${userId} not found`),
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        withDeleted: true,
      });
      expect(userRepository.softDelete).not.toHaveBeenCalled();
      expect(userRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('createPrincipalAbility', () => {
    // Mock permission data
    const mockPermissions: PermissionEntity[] = [
      {
        id: 'permission-1',
        action: EAction.READ,
        subject: ESubject.System_Users,
        fields: '*',
        conditions: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
        description: 'Read system users',
        roles: [],
      } as unknown as PermissionEntity,
    ];

    const mockRoleWithPermissions = {
      ...mockRole,
      permissions: mockPermissions,
    };

    const mockUserWithPermissions = {
      ...mockUser,
      role: mockRoleWithPermissions,
      roleName: 'teacher',
    } as UserEntity;

    // Scenario 1: Successfully create principal ability
    it('should successfully create principal ability', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUserWithPermissions);

      // Mock the defineAbility method
      const mockAbility = { can: jest.fn(), cannot: jest.fn() };
      jest.spyOn(service as any, 'defineAbility').mockResolvedValueOnce(mockAbility);

      // Act
      const result = await service.createPrincipalAbility(mockUser.email);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(service['defineAbility']).toHaveBeenCalledWith(mockUserWithPermissions);
      expect(result).toBe(mockAbility);
    });

    // Scenario 2: User not found
    it('should throw BadRequestException when user is not found', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.createPrincipalAbility('nonexistent@example.com')).rejects.toThrow(
        new BadRequestException('Principal with email nonexistent@example.com not found.'),
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });

    // Scenario 3: User with no permissions
    it('should create ability with no permissions when user has no permissions', async () => {
      // Arrange
      const userWithNoPermissions = {
        ...mockUser,
        role: {
          ...mockRole,
          permissions: [],
        },
        roleName: 'teacher',
      } as UserEntity;

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(userWithNoPermissions);

      // Mock the defineAbility method to return an empty ability
      const emptyAbility = { can: jest.fn(), cannot: jest.fn() };
      jest.spyOn(service as any, 'defineAbility').mockResolvedValueOnce(emptyAbility);

      // Act
      const result = await service.createPrincipalAbility(mockUser.email);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(service['defineAbility']).toHaveBeenCalledWith(userWithNoPermissions);
      expect(result).toBe(emptyAbility);
    });

    // Scenario 4: User with multiple permissions
    it('should create ability with multiple permissions', async () => {
      // Arrange
      const multiplePermissions: PermissionEntity[] = [
        {
          id: 'permission-1',
          action: EAction.READ,
          subject: ESubject.System_Users,
          fields: '*',
          conditions: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
          description: 'Read system users',
          roles: [],
        } as unknown as PermissionEntity,
        {
          id: 'permission-2',
          action: EAction.CREATE,
          subject: ESubject.System_Users,
          fields: 'name,email',
          conditions: '{"organizationId": "org-1"}',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
          description: 'Create system users',
          roles: [],
        } as unknown as PermissionEntity,
      ];

      const userWithMultiplePermissions = {
        ...mockUser,
        role: {
          ...mockRole,
          permissions: multiplePermissions,
        },
        roleName: 'teacher',
      } as UserEntity;

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(userWithMultiplePermissions);

      // Create a real ability to test the full flow
      const realAbility = await service['defineAbility'](userWithMultiplePermissions);
      jest.spyOn(service as any, 'defineAbility').mockResolvedValueOnce(realAbility);

      // Act
      const result = await service.createPrincipalAbility(mockUser.email);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(service['defineAbility']).toHaveBeenCalledWith(userWithMultiplePermissions);
      expect(result).toBeDefined();
      expect(typeof result.can).toBe('function');
    });
  });
});
