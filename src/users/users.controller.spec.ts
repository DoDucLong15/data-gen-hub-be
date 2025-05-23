import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RegisterService } from './sub-services/register.service';
import { CreateUserDto, UpdateUserDto } from './dtos/user.dto';
import { UserResponse } from './types/user-response.type';
import { BadRequestException } from '@nestjs/common';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { ApproveRegisterDto } from './dtos/register.dto';
import { RegisterEntity } from './entities/register.entity';
import { BaseResponse } from 'src/base/types/response.type';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;
  let registerService: RegisterService;

  // Mock response data
  const mockUserResponse: UserResponse = {
    id: 'user-id-1',
    email: 'test@hust.edu.vn',
    name: 'Test User',
    phone: '0123456789',
    school: 'School of Information and Communication Technology',
    department: 'Computer Science',
    position: 'Lecturer',
    role: 'Lecturer',
    roleId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as unknown as Date, // Handle null case for deleted users
    avatar: null,
    permissions: [
      {
        action: 'read',
        subject: 'System_Users',
      },
    ],
  };

  // Mock updated user response
  const mockUpdatedUserResponse: UserResponse = {
    ...mockUserResponse,
    name: 'Updated User',
    department: 'Software Engineering',
  };

  // Mock register entity
  const mockRegister: RegisterEntity = {
    id: 'register-id-1',
    email: 'test@example.com',
    name: 'Test User',
    phone: '0123456789',
    school: 'Test School',
    department: 'Test Department',
    position: 'Test Position',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as RegisterEntity;

  // Mock approve register DTO
  const mockApproveRegisterDto: ApproveRegisterDto = {
    id: 'register-id-1',
    roleId: 'role-id-1',
  };

  // Mock base response
  const mockBaseResponse: BaseResponse = {
    status: 'success',
    message: 'Register approved successfully',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
            updateUserInfo: jest.fn(),
            getUserInfo: jest.fn(),
            getUserById: jest.fn(),
            getUsers: jest.fn(),
            deleteUser: jest.fn(),
          },
        },
        {
          provide: RegisterService,
          useValue: {
            getRegisters: jest.fn(),
            approveRegister: jest.fn(),
            rejectRegister: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    registerService = module.get<RegisterService>(RegisterService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    // Mock CreateUserDto
    const mockCreateUserDto: CreateUserDto = {
      email: 'test@hust.edu.vn',
      name: 'Test User',
      phone: '0123456789',
      school: 'School of Information and Communication Technology',
      department: 'Computer Science',
      position: 'Lecturer',
      roleId: '1',
    };

    // Scenario 1: Successfully create user
    it('should successfully create a user', async () => {
      // Arrange
      jest.spyOn(usersService, 'createUser').mockResolvedValueOnce(mockUserResponse);

      // Act
      const result = await controller.createUser(mockCreateUserDto);

      // Assert
      expect(usersService.createUser).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(mockUserResponse);
    });

    // Scenario 2: Handle existing user error
    it('should propagate BadRequestException when user already exists', async () => {
      // Arrange
      const errorMessage = `User ${mockCreateUserDto.email} already exists`;
      const badRequestException = new BadRequestException(errorMessage);

      jest.spyOn(usersService, 'createUser').mockRejectedValue(badRequestException);

      // Act & Assert
      await expect(controller.createUser(mockCreateUserDto)).rejects.toThrow(BadRequestException);
      expect(usersService.createUser).toHaveBeenCalledWith(mockCreateUserDto);
    });

    // Scenario 3: Handle deleted user error
    it('should propagate BadRequestException when user exists but is deleted', async () => {
      // Arrange
      const errorMessage = `User ${mockCreateUserDto.email} already exists, please restore it.`;
      const badRequestException = new BadRequestException(errorMessage);

      jest.spyOn(usersService, 'createUser').mockRejectedValue(badRequestException);

      // Act & Assert
      await expect(controller.createUser(mockCreateUserDto)).rejects.toThrow(BadRequestException);
      expect(usersService.createUser).toHaveBeenCalledWith(mockCreateUserDto);
    });

    // Scenario 4: Propagate other exceptions
    it('should propagate other exceptions from service', async () => {
      // Arrange
      const error = new Error('Unexpected error');
      jest.spyOn(usersService, 'createUser').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.createUser(mockCreateUserDto)).rejects.toThrow(error);
      expect(usersService.createUser).toHaveBeenCalledWith(mockCreateUserDto);
    });
  });

  describe('updateUser', () => {
    // Mock UpdateUserDto
    const mockUpdateUserDto: UpdateUserDto = {
      id: 'user-id-1',
      name: 'Updated User',
      email: 'test@hust.edu.vn',
      phone: '0123456789',
      school: 'School of Information and Communication Technology',
      department: 'Software Engineering',
      position: 'Lecturer',
      roleId: '1',
    };

    // Mock user payload
    const mockUserPayload: UserPayload = {
      email: 'test@hust.edu.vn',
      role: 'Lecturer',
    };

    // Mock admin payload
    const mockAdminPayload: UserPayload = {
      email: 'admin@hust.edu.vn',
      role: 'Admin',
    };

    // Mock file for testing
    const mockFile = undefined as unknown as Express.Multer.File;

    // Scenario 1: Successfully update user info
    it('should successfully update user info', async () => {
      // Arrange
      jest.spyOn(usersService, 'updateUserInfo').mockResolvedValueOnce(mockUpdatedUserResponse);

      // Act
      const result = await controller.updateUser(mockUpdateUserDto, mockAdminPayload, mockFile);

      // Assert
      expect(usersService.updateUserInfo).toHaveBeenCalledWith(
        mockUpdateUserDto,
        mockAdminPayload,
        mockFile,
      );
      expect(result).toEqual(mockUpdatedUserResponse);
    });

    // Scenario 2: Update user with invalid ID
    it('should propagate BadRequestException when user ID is invalid', async () => {
      // Arrange
      const errorMessage = `User ${mockUpdateUserDto.id} not found`;
      const badRequestException = new BadRequestException(errorMessage);

      jest.spyOn(usersService, 'updateUserInfo').mockRejectedValue(badRequestException);

      // Act & Assert
      await expect(
        controller.updateUser(mockUpdateUserDto, mockAdminPayload, mockFile),
      ).rejects.toThrow(BadRequestException);
      expect(usersService.updateUserInfo).toHaveBeenCalledWith(
        mockUpdateUserDto,
        mockAdminPayload,
        mockFile,
      );
    });

    // Scenario 3: User updates own profile
    it('should allow user to update their own profile', async () => {
      // Arrange
      jest.spyOn(usersService, 'updateUserInfo').mockResolvedValueOnce(mockUpdatedUserResponse);

      // Act
      const result = await controller.updateUser(mockUpdateUserDto, mockUserPayload, mockFile);

      // Assert
      expect(usersService.updateUserInfo).toHaveBeenCalledWith(
        mockUpdateUserDto,
        mockUserPayload,
        mockFile,
      );
      expect(result).toEqual(mockUpdatedUserResponse);
    });

    // Scenario 4: User attempts unauthorized update
    it('should propagate BadRequestException when user attempts unauthorized update', async () => {
      // Arrange
      const unauthorizedUserPayload: UserPayload = {
        email: 'another@hust.edu.vn',
        role: 'Lecturer',
      };

      const errorMessage = `You can't update this user`;
      const badRequestException = new BadRequestException(errorMessage);

      jest.spyOn(usersService, 'updateUserInfo').mockRejectedValue(badRequestException);

      // Act & Assert
      await expect(
        controller.updateUser(mockUpdateUserDto, unauthorizedUserPayload, mockFile),
      ).rejects.toThrow(BadRequestException);
      expect(usersService.updateUserInfo).toHaveBeenCalledWith(
        mockUpdateUserDto,
        unauthorizedUserPayload,
        mockFile,
      );
    });

    // Scenario 5: Admin updates user role
    it('should allow admin to update user role', async () => {
      // Arrange
      const updateWithRoleDto: UpdateUserDto = {
        ...mockUpdateUserDto,
        roleId: '2',
      };

      const updatedWithRoleResponse: UserResponse = {
        ...mockUpdatedUserResponse,
        roleId: '2',
        role: 'Student',
      };

      jest.spyOn(usersService, 'updateUserInfo').mockResolvedValueOnce(updatedWithRoleResponse);

      // Act
      const result = await controller.updateUser(updateWithRoleDto, mockAdminPayload, mockFile);

      // Assert
      expect(usersService.updateUserInfo).toHaveBeenCalledWith(
        updateWithRoleDto,
        mockAdminPayload,
        mockFile,
      );
      expect(result).toEqual(updatedWithRoleResponse);
    });

    // Scenario 6: Admin updates user email
    it('should allow admin to update user email', async () => {
      // Arrange
      const updateWithEmailDto: UpdateUserDto = {
        ...mockUpdateUserDto,
        email: 'newemail@hust.edu.vn',
      };

      const updatedWithEmailResponse: UserResponse = {
        ...mockUpdatedUserResponse,
        email: 'newemail@hust.edu.vn',
      };

      jest.spyOn(usersService, 'updateUserInfo').mockResolvedValueOnce(updatedWithEmailResponse);

      // Act
      const result = await controller.updateUser(updateWithEmailDto, mockAdminPayload, mockFile);

      // Assert
      expect(usersService.updateUserInfo).toHaveBeenCalledWith(
        updateWithEmailDto,
        mockAdminPayload,
        mockFile,
      );
      expect(result).toEqual(updatedWithEmailResponse);
    });
  });

  describe('deleteUser', () => {
    const userId = 'user-id-1';

    // Scenario 1: Successfully delete existing user
    it('should successfully delete an existing user', async () => {
      // Arrange
      jest.spyOn(usersService, 'deleteUser').mockResolvedValueOnce(true);

      // Act
      const result = await controller.deleteUser(userId);

      // Assert
      expect(usersService.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    // Scenario 2: Delete non-existent user
    it('should propagate BadRequestException when user does not exist', async () => {
      // Arrange
      const errorMessage = `User ${userId} not found`;
      const badRequestException = new BadRequestException(errorMessage);

      jest.spyOn(usersService, 'deleteUser').mockRejectedValueOnce(badRequestException);

      // Act & Assert
      await expect(controller.deleteUser(userId)).rejects.toThrow(BadRequestException);
      expect(usersService.deleteUser).toHaveBeenCalledWith(userId);
    });

    // Scenario 3: Delete already soft-deleted user
    it('should permanently delete a soft-deleted user', async () => {
      // Arrange
      jest.spyOn(usersService, 'deleteUser').mockResolvedValueOnce(true);

      // Act
      const result = await controller.deleteUser(userId);

      // Assert
      expect(usersService.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    // Scenario 4: Service throws unexpected error
    it('should propagate unexpected errors from service', async () => {
      // Arrange
      const error = new Error('Database connection error');
      jest.spyOn(usersService, 'deleteUser').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.deleteUser(userId)).rejects.toThrow(error);
      expect(usersService.deleteUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('approveRegister', () => {
    // Scenario 1: Successfully approve register
    it('should successfully approve a register', async () => {
      // Arrange
      jest.spyOn(registerService, 'approveRegister').mockResolvedValueOnce(mockBaseResponse);

      // Act
      const result = await controller.approveRegister(mockApproveRegisterDto);

      // Assert
      expect(registerService.approveRegister).toHaveBeenCalledWith(mockApproveRegisterDto);
      expect(result).toEqual(mockBaseResponse);
    });

    // Scenario 2: Handle register not found
    it('should propagate BadRequestException when register is not found', async () => {
      // Arrange
      const errorMessage = 'Register not found';
      const badRequestException = new BadRequestException(errorMessage);

      jest.spyOn(registerService, 'approveRegister').mockRejectedValueOnce(badRequestException);

      // Act & Assert
      await expect(controller.approveRegister(mockApproveRegisterDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(registerService.approveRegister).toHaveBeenCalledWith(mockApproveRegisterDto);
    });

    // Scenario 3: Handle role not found
    it('should propagate BadRequestException when role is not found', async () => {
      // Arrange
      const errorMessage = 'Role not found';
      const badRequestException = new BadRequestException(errorMessage);

      jest.spyOn(registerService, 'approveRegister').mockRejectedValueOnce(badRequestException);

      // Act & Assert
      await expect(controller.approveRegister(mockApproveRegisterDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(registerService.approveRegister).toHaveBeenCalledWith(mockApproveRegisterDto);
    });

    // Scenario 4: Handle database error
    it('should propagate database errors from service', async () => {
      // Arrange
      const error = new Error('Database connection error');
      jest.spyOn(registerService, 'approveRegister').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.approveRegister(mockApproveRegisterDto)).rejects.toThrow(error);
      expect(registerService.approveRegister).toHaveBeenCalledWith(mockApproveRegisterDto);
    });
  });

  describe('rejectRegister', () => {
    const registerId = 'register-id-1';

    // Scenario 1: Successfully reject register
    it('should successfully reject a register', async () => {
      // Arrange
      jest.spyOn(registerService, 'rejectRegister').mockResolvedValueOnce(mockBaseResponse);

      // Act
      const result = await controller.rejectRegister(registerId);

      // Assert
      expect(registerService.rejectRegister).toHaveBeenCalledWith(registerId);
      expect(result).toEqual(mockBaseResponse);
    });

    // Scenario 2: Handle register not found
    it('should propagate BadRequestException when register is not found', async () => {
      // Arrange
      const errorMessage = 'Register not found';
      const badRequestException = new BadRequestException(errorMessage);

      jest.spyOn(registerService, 'rejectRegister').mockRejectedValueOnce(badRequestException);

      // Act & Assert
      await expect(controller.rejectRegister(registerId)).rejects.toThrow(BadRequestException);
      expect(registerService.rejectRegister).toHaveBeenCalledWith(registerId);
    });

    // Scenario 3: Handle database error
    it('should propagate database errors from service', async () => {
      // Arrange
      const error = new Error('Database connection error');
      jest.spyOn(registerService, 'rejectRegister').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.rejectRegister(registerId)).rejects.toThrow(error);
      expect(registerService.rejectRegister).toHaveBeenCalledWith(registerId);
    });

    // Scenario 4: Handle email sending failure
    it('should complete successfully even when email sending fails', async () => {
      // Arrange
      // The service handles email failures internally and still returns success
      jest.spyOn(registerService, 'rejectRegister').mockResolvedValueOnce(mockBaseResponse);

      // Act
      const result = await controller.rejectRegister(registerId);

      // Assert
      expect(registerService.rejectRegister).toHaveBeenCalledWith(registerId);
      expect(result).toEqual(mockBaseResponse);
    });
  });
});
