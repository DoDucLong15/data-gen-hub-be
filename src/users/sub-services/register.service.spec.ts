import { Test, TestingModule } from '@nestjs/testing';
import { RegisterService } from './register.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegisterEntity } from '../entities/register.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users.service';
import { RolesService } from '../../roles/roles.service';
import { MailerService } from '../../mailer/mailer.service';
import { BadRequestException, Logger } from '@nestjs/common';
import { TemplateHelper } from '../../mailer/helpers/template.helper';
import { SystemConfigUtils } from '../../system-configuration/utils/system-config.util';
import { ApproveRegisterDto } from '../dtos/register.dto';
import { RoleEnity } from '../../roles/entities/role.entity';

describe('RegisterService', () => {
  let service: RegisterService;
  let registerRepository: Repository<RegisterEntity>;
  let mailerService: MailerService;
  let usersService: UsersService;
  let rolesService: RolesService;

  // Mock data
  const mockRegister = {
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

  const mockRole = {
    id: 'role-id-1',
    name: 'Test Role',
    description: 'Test Role Description',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    users: [],
    permissions: [],
  } as unknown as RoleEnity;

  const mockApproveRegisterDto: ApproveRegisterDto = {
    id: 'register-id-1',
    roleId: 'role-id-1',
  };

  // Save original values to restore later
  const originalSystemName = SystemConfigUtils.systemName;
  const originalAdminEmails = SystemConfigUtils.adminEmails;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
        {
          provide: getRepositoryToken(RegisterEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
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
      ],
    }).compile();

    service = module.get<RegisterService>(RegisterService);
    registerRepository = module.get<Repository<RegisterEntity>>(getRepositoryToken(RegisterEntity));
    mailerService = module.get<MailerService>(MailerService);
    usersService = module.get<UsersService>(UsersService);
    rolesService = module.get<RolesService>(RolesService);

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);

    // Set system name for testing
    SystemConfigUtils.systemName = 'Test System';
    SystemConfigUtils.adminEmails = ['admin@example.com'];
  });

  afterEach(() => {
    // Restore original values
    SystemConfigUtils.systemName = originalSystemName;
    SystemConfigUtils.adminEmails = originalAdminEmails;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('rejectRegister', () => {
    // Scenario 1: Successfully reject register
    it('should successfully reject a register', async () => {
      // Arrange
      jest.spyOn(registerRepository, 'findOne').mockResolvedValueOnce(mockRegister);
      jest.spyOn(registerRepository, 'delete').mockResolvedValueOnce({ affected: 1, raw: {} });
      jest.spyOn(mailerService, 'sendEmail').mockResolvedValueOnce({} as any);

      // Mock the template helper
      const templateSpy = jest.spyOn(TemplateHelper, 'getTemplateNotifyAdminRejectRegister');
      templateSpy.mockReturnValue('mock email content');

      // Act
      const result = await service.rejectRegister(mockRegister.id);

      // Assert
      expect(registerRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockRegister.id },
      });
      expect(registerRepository.delete).toHaveBeenCalledWith(mockRegister.id);
      expect(mailerService.sendEmail).toHaveBeenCalledWith({
        to: mockRegister.email,
        subject: 'Yêu cầu đăng ký đã bị từ chối',
        content: expect.any(String),
      });
      expect(result).toEqual({
        status: 'success',
        message: 'Register rejected successfully',
      });
    });

    // Scenario 2: Register not found
    it('should throw BadRequestException when register is not found', async () => {
      // Arrange
      jest.spyOn(registerRepository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.rejectRegister('non-existent-id')).rejects.toThrow(
        new BadRequestException('Register not found'),
      );

      expect(registerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
      expect(registerRepository.delete).not.toHaveBeenCalled();
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });

    // Scenario 3: Email sending fails
    it('should still complete rejection when email sending fails', async () => {
      // Arrange
      jest.spyOn(registerRepository, 'findOne').mockResolvedValueOnce(mockRegister);
      jest.spyOn(registerRepository, 'delete').mockResolvedValueOnce({ affected: 1, raw: {} });

      // Mock email sending failure
      const emailError = new Error('Failed to send email');
      jest.spyOn(mailerService, 'sendEmail').mockRejectedValueOnce(emailError);

      // Mock the template helper
      const templateSpy = jest.spyOn(TemplateHelper, 'getTemplateNotifyAdminRejectRegister');
      templateSpy.mockReturnValue('mock email content');

      // Act
      const result = await service.rejectRegister(mockRegister.id);

      // Assert
      expect(registerRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockRegister.id },
      });
      expect(registerRepository.delete).toHaveBeenCalledWith(mockRegister.id);
      expect(mailerService.sendEmail).toHaveBeenCalledWith({
        to: mockRegister.email,
        subject: 'Yêu cầu đăng ký đã bị từ chối',
        content: expect.any(String),
      });

      // Wait for error to be logged (asynchronous)
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(Logger.error).toHaveBeenCalled();

      // Operation should still complete successfully despite email error
      expect(result).toEqual({
        status: 'success',
        message: 'Register rejected successfully',
      });
    });

    // Scenario 4: Repository delete fails
    it('should throw an error when repository delete fails', async () => {
      // Arrange
      jest.spyOn(registerRepository, 'findOne').mockResolvedValueOnce(mockRegister);

      // Mock repository delete failure
      const deleteError = new Error('Database error');
      jest.spyOn(registerRepository, 'delete').mockRejectedValueOnce(deleteError);

      // Act & Assert
      await expect(service.rejectRegister(mockRegister.id)).rejects.toThrow(deleteError);

      expect(registerRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockRegister.id },
      });
      expect(registerRepository.delete).toHaveBeenCalledWith(mockRegister.id);
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('approveRegister', () => {
    // Scenario 1: Successfully approve register
    it('should successfully approve a register', async () => {
      // Arrange
      jest.spyOn(registerRepository, 'findOne').mockResolvedValueOnce(mockRegister);
      jest.spyOn(rolesService, 'getRoleById').mockResolvedValueOnce(mockRole);
      jest.spyOn(registerRepository, 'delete').mockResolvedValueOnce({ affected: 1, raw: {} });
      jest
        .spyOn(usersService, 'createUser')
        .mockResolvedValueOnce({ ...mockRegister, roleId: mockRole.id } as any);
      jest.spyOn(mailerService, 'sendEmail').mockResolvedValueOnce({} as any);

      // Mock the template helper
      const templateSpy = jest.spyOn(TemplateHelper, 'getTemplateNotifyAdminApproveRegister');
      templateSpy.mockReturnValue('mock email content');

      // Act
      const result = await service.approveRegister(mockApproveRegisterDto);

      // Assert
      expect(registerRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockApproveRegisterDto.id },
      });
      expect(rolesService.getRoleById).toHaveBeenCalledWith(mockApproveRegisterDto.roleId);
      expect(registerRepository.delete).toHaveBeenCalledWith(mockApproveRegisterDto.id);
      expect(usersService.createUser).toHaveBeenCalledWith({
        ...mockRegister,
        roleId: mockRole.id,
      });
      expect(mailerService.sendEmail).toHaveBeenCalledWith({
        to: mockRegister.email,
        subject: 'Yêu cầu đăng ký đã được chấp nhận',
        content: expect.any(String),
      });
      expect(result).toEqual({
        status: 'success',
        message: 'Register approved successfully',
      });
    });

    // Scenario 2: Register not found
    it('should throw BadRequestException when register is not found', async () => {
      // Arrange
      jest.spyOn(registerRepository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.approveRegister(mockApproveRegisterDto)).rejects.toThrow(
        new BadRequestException('Register not found'),
      );

      expect(registerRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockApproveRegisterDto.id },
      });
      expect(rolesService.getRoleById).not.toHaveBeenCalled();
      expect(registerRepository.delete).not.toHaveBeenCalled();
      expect(usersService.createUser).not.toHaveBeenCalled();
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });

    // Scenario 3: Role not found
    it('should throw an error when role is not found', async () => {
      // Arrange
      jest.spyOn(registerRepository, 'findOne').mockResolvedValueOnce(mockRegister);

      // Mock role service to throw error
      const roleError = new Error('Role not found');
      jest.spyOn(rolesService, 'getRoleById').mockRejectedValueOnce(roleError);

      // Act & Assert
      await expect(service.approveRegister(mockApproveRegisterDto)).rejects.toThrow(roleError);

      expect(registerRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockApproveRegisterDto.id },
      });
      expect(rolesService.getRoleById).toHaveBeenCalledWith(mockApproveRegisterDto.roleId);
      expect(registerRepository.delete).not.toHaveBeenCalled();
      expect(usersService.createUser).not.toHaveBeenCalled();
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });

    // Scenario 4: Email sending fails
    it('should still complete approval when email sending fails', async () => {
      // Arrange
      jest.spyOn(registerRepository, 'findOne').mockResolvedValueOnce(mockRegister);
      jest.spyOn(rolesService, 'getRoleById').mockResolvedValueOnce(mockRole);
      jest.spyOn(registerRepository, 'delete').mockResolvedValueOnce({ affected: 1, raw: {} });
      jest
        .spyOn(usersService, 'createUser')
        .mockResolvedValueOnce({ ...mockRegister, roleId: mockRole.id } as any);

      // Mock email sending failure
      const emailError = new Error('Failed to send email');
      jest.spyOn(mailerService, 'sendEmail').mockRejectedValueOnce(emailError);

      // Mock the template helper
      const templateSpy = jest.spyOn(TemplateHelper, 'getTemplateNotifyAdminApproveRegister');
      templateSpy.mockReturnValue('mock email content');

      // Act
      const result = await service.approveRegister(mockApproveRegisterDto);

      // Assert
      expect(registerRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockApproveRegisterDto.id },
      });
      expect(rolesService.getRoleById).toHaveBeenCalledWith(mockApproveRegisterDto.roleId);
      expect(registerRepository.delete).toHaveBeenCalledWith(mockApproveRegisterDto.id);
      expect(usersService.createUser).toHaveBeenCalledWith({
        ...mockRegister,
        roleId: mockRole.id,
      });
      expect(mailerService.sendEmail).toHaveBeenCalledWith({
        to: mockRegister.email,
        subject: 'Yêu cầu đăng ký đã được chấp nhận',
        content: expect.any(String),
      });

      // Wait for error to be logged (asynchronous)
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(Logger.error).toHaveBeenCalled();

      // Operation should still complete successfully despite email error
      expect(result).toEqual({
        status: 'success',
        message: 'Register approved successfully',
      });
    });

    // Scenario 5: Repository delete fails
    it('should throw an error when repository delete fails', async () => {
      // Arrange
      jest.spyOn(registerRepository, 'findOne').mockResolvedValueOnce(mockRegister);
      jest.spyOn(rolesService, 'getRoleById').mockResolvedValueOnce(mockRole);

      // Mock repository delete failure
      const deleteError = new Error('Database error');
      jest.spyOn(registerRepository, 'delete').mockRejectedValueOnce(deleteError);

      // Act & Assert
      await expect(service.approveRegister(mockApproveRegisterDto)).rejects.toThrow(deleteError);

      expect(registerRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockApproveRegisterDto.id },
      });
      expect(rolesService.getRoleById).toHaveBeenCalledWith(mockApproveRegisterDto.roleId);
      expect(registerRepository.delete).toHaveBeenCalledWith(mockApproveRegisterDto.id);
      expect(usersService.createUser).not.toHaveBeenCalled();
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });

    // Scenario 6: User creation fails
    it('should throw an error when user creation fails', async () => {
      // Arrange
      jest.spyOn(registerRepository, 'findOne').mockResolvedValueOnce(mockRegister);
      jest.spyOn(rolesService, 'getRoleById').mockResolvedValueOnce(mockRole);
      jest.spyOn(registerRepository, 'delete').mockResolvedValueOnce({ affected: 1, raw: {} });

      // Mock user creation failure
      const userError = new Error('Failed to create user');
      jest.spyOn(usersService, 'createUser').mockRejectedValueOnce(userError);

      // Act & Assert
      await expect(service.approveRegister(mockApproveRegisterDto)).rejects.toThrow(userError);

      expect(registerRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockApproveRegisterDto.id },
      });
      expect(rolesService.getRoleById).toHaveBeenCalledWith(mockApproveRegisterDto.roleId);
      expect(registerRepository.delete).toHaveBeenCalledWith(mockApproveRegisterDto.id);
      expect(usersService.createUser).toHaveBeenCalledWith({
        ...mockRegister,
        roleId: mockRole.id,
      });
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });
  });
});
