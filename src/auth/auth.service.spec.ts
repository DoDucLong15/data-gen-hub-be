import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../mailer/mailer.service';
import { RegisterService } from '../users/sub-services/register.service';
import { OnedriveService } from '../onedrive/onedrive.service';
import { RefreshTokenRequest, SignInDto } from './dtos/sign-in.dto';
import { BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { SystemConfigUtils } from '../system-configuration/utils/system-config.util';
import axios from 'axios';
import { UserEntity } from '../users/entities/user.entity';
import { UserPayload } from './types/user-playload.type';
import { CreateUserDto } from 'src/users/dtos/user.dto';
import { RegisterEntity } from 'src/users/entities/register.entity';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let registerService: RegisterService;
  let mailerService: MailerService;

  // Mock user data
  const mockUser = {
    id: '1',
    email: 'test@hust.edu.vn',
    roleName: 'teacher',
    role: { id: '1', name: 'teacher' },
  } as UserEntity;

  // Mock tokens
  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  // Mock user payload
  const mockUserPayload: UserPayload = {
    email: 'test@hust.edu.vn',
    role: 'teacher',
  };

  // Mock data
  const mockCreateUserDto: CreateUserDto = {
    email: 'test@hust.edu.vn',
    name: 'Test User',
    phone: '0123456789',
    school: 'School of Information and Communication Technology',
    department: 'Computer Science',
    position: 'Lecturer',
    roleId: '1',
  };

  const mockRegisterEntity: RegisterEntity = {
    id: '1',
    email: 'test@hust.edu.vn',
    name: 'Test User',
    phone: '0123456789',
    school: 'School of Information and Communication Technology',
    department: 'Computer Science',
    position: 'Lecturer',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as RegisterEntity;

  // Save original values to restore later
  const originalAdminEmails = SystemConfigUtils.adminEmails;

  // Save original values to restore later
  const originalEnableTeacherEmailCheck = SystemConfigUtils.enableTeacherEmailCheck;
  const originalTesterEmail = process.env.TESTER_EMAIL;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            getUser: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'auth.jwtAccessSecret') return 'test-access-secret';
              if (key === 'auth.jwtRefreshSecret') return 'test-refresh-secret';
              return null;
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockImplementation(() => 'token'),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: RegisterService,
          useValue: {
            getRegister: jest.fn(),
            createRegister: jest.fn(),
          },
        },
        {
          provide: OnedriveService,
          useValue: {
            updateOnedriveAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    registerService = module.get<RegisterService>(RegisterService);
    mailerService = module.get<MailerService>(MailerService);

    // Setup default admin emails
    SystemConfigUtils.adminEmails = ['admin@example.com'];

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);

    // Setup JwtService mock to return tokens
    jest.spyOn(service, 'getTokens').mockResolvedValue(mockTokens);
  });

  // Cleanup after tests
  afterEach(() => {
    SystemConfigUtils.enableTeacherEmailCheck = originalEnableTeacherEmailCheck;
    process.env.TESTER_EMAIL = originalTesterEmail;
    SystemConfigUtils.adminEmails = originalAdminEmails;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    // Scenario 1: Successful sign-in with valid credentials
    it('should successfully sign in with valid credentials', async () => {
      // Arrange
      const signInDto: SignInDto = {
        email: 'test@hust.edu.vn',
        password: 'password123',
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: '1',
      });

      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(mockUser);

      // Act
      const result = await service.signIn(signInDto);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.any(String), {
        params: {
          taikhoan: signInDto.email,
          matkhau: signInDto.password,
        },
      });
      expect(usersService.getUser).toHaveBeenCalledWith({
        where: { email: signInDto.email },
      });
      expect(result).toEqual(mockTokens);
    });

    // Scenario 2: Reject non-HUST email when enabled
    it('should reject non-HUST email when teacher email check is enabled', async () => {
      // Arrange
      SystemConfigUtils.enableTeacherEmailCheck = true;
      const signInDto: SignInDto = {
        email: 'test@gmail.com',
        password: 'password123',
      };

      // Act & Assert
      await expect(service.signIn(signInDto)).rejects.toThrow(
        new UnauthorizedException('Only HUST teacher email is allowed'),
      );
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    // Scenario 3: Handle API authentication failure
    it('should throw UnauthorizedException when API authentication fails', async () => {
      // Arrange
      const signInDto: SignInDto = {
        email: 'test@hust.edu.vn',
        password: 'wrong-password',
      };

      mockedAxios.get.mockRejectedValueOnce(new Error('Invalid credentials'));

      // Act & Assert
      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    // Scenario 4: Allow tester email bypass
    it('should bypass API authentication for tester email', async () => {
      // Arrange
      process.env.TESTER_EMAIL = 'tester@example.com';
      SystemConfigUtils.enableTeacherEmailCheck = false; // Disable HUST email check for this test
      const signInDto: SignInDto = {
        email: 'tester@example.com',
        password: 'any-password',
      };

      mockedAxios.get.mockRejectedValueOnce(new Error('Invalid credentials'));
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(mockUser);

      // Act
      const result = await service.signIn(signInDto);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalled(); // API call is still made
      expect(usersService.getUser).toHaveBeenCalledWith({
        where: { email: signInDto.email },
      });
      expect(result).toEqual(mockTokens);
    });

    // Scenario 5: Reject non-existent user
    it('should throw UnauthorizedException when user does not exist', async () => {
      // Arrange
      const signInDto: SignInDto = {
        email: 'nonexistent@hust.edu.vn',
        password: 'password123',
      };

      // API authentication succeeds
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: '1',
      });

      // But user doesn't exist in database
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);

      // Verify that both API and getUser were called
      expect(mockedAxios.get).toHaveBeenCalled();
      expect(usersService.getUser).toHaveBeenCalledWith({
        where: { email: signInDto.email },
      });
    });

    // Scenario 6: Disable teacher email check
    it('should allow non-HUST email when teacher email check is disabled', async () => {
      // Arrange
      SystemConfigUtils.enableTeacherEmailCheck = false;
      const signInDto: SignInDto = {
        email: 'test@gmail.com',
        password: 'password123',
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: '1',
      });

      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce({
        ...mockUser,
        email: 'test@gmail.com',
      } as UserEntity);

      // Act
      const result = await service.signIn(signInDto);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalled();
      expect(usersService.getUser).toHaveBeenCalledWith({
        where: { email: signInDto.email },
      });
      expect(result).toEqual(mockTokens);
    });
  });

  describe('refreshTokens', () => {
    // Scenario 1: Successfully refresh tokens with valid token
    it('should successfully refresh tokens with valid refresh token', async () => {
      // Arrange
      const refreshTokenRequest: RefreshTokenRequest = {
        refreshToken: 'valid-refresh-token',
      };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValueOnce(mockUserPayload);

      // Act
      const result = await service.refreshTokens(refreshTokenRequest);

      // Assert
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshTokenRequest.refreshToken, {
        secret: 'test-refresh-secret',
      });
      expect(service.getTokens).toHaveBeenCalledWith(mockUserPayload.email, mockUserPayload.role);
      expect(result).toEqual(mockTokens);
    });

    // Scenario 2: Throw error with invalid token
    it('should throw UnauthorizedException with invalid refresh token', async () => {
      // Arrange
      const refreshTokenRequest: RefreshTokenRequest = {
        refreshToken: 'invalid-refresh-token',
      };

      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValueOnce(new Error('Invalid token'));

      // Act & Assert
      await expect(service.refreshTokens(refreshTokenRequest)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshTokenRequest.refreshToken, {
        secret: 'test-refresh-secret',
      });
      expect(service.getTokens).not.toHaveBeenCalled();
    });

    // Scenario 3: Throw error with expired token
    it('should throw UnauthorizedException with expired refresh token', async () => {
      // Arrange
      const refreshTokenRequest: RefreshTokenRequest = {
        refreshToken: 'expired-refresh-token',
      };

      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValueOnce(new Error('jwt expired'));

      // Act & Assert
      await expect(service.refreshTokens(refreshTokenRequest)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshTokenRequest.refreshToken, {
        secret: 'test-refresh-secret',
      });
      expect(service.getTokens).not.toHaveBeenCalled();
    });

    // Scenario 4: Verify payload structure from token
    it('should verify payload structure and use correct values for token generation', async () => {
      // Arrange
      const refreshTokenRequest: RefreshTokenRequest = {
        refreshToken: 'valid-refresh-token',
      };

      const customPayload: UserPayload = {
        email: 'custom@example.com',
        role: 'admin',
      };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValueOnce(customPayload);

      // Act
      await service.refreshTokens(refreshTokenRequest);

      // Assert
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshTokenRequest.refreshToken, {
        secret: 'test-refresh-secret',
      });
      expect(service.getTokens).toHaveBeenCalledWith(customPayload.email, customPayload.role);
    });
  });

  describe('register', () => {
    // Scenario 1: Register with valid HUST email
    it('should successfully register a user with valid HUST email', async () => {
      // Arrange
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(null);
      jest.spyOn(registerService, 'getRegister').mockResolvedValueOnce(null);
      jest.spyOn(registerService, 'createRegister').mockResolvedValueOnce(mockRegisterEntity);

      // Act
      const result = await service.register(mockCreateUserDto);

      // Assert
      expect(usersService.getUser).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
        withDeleted: true,
      });
      expect(registerService.getRegister).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
      });
      expect(registerService.createRegister).toHaveBeenCalledWith(mockCreateUserDto);
      expect(mailerService.sendEmail).toHaveBeenCalledWith({
        to: SystemConfigUtils.adminEmails.join(','),
        subject: 'New user registered',
        content: expect.any(String),
      });
      expect(result).toEqual({
        status: 'success',
        message: 'User registered successfully',
      });
    });

    // Scenario 2: Reject non-HUST email
    it('should reject registration with non-HUST email', async () => {
      // Arrange
      const invalidEmailDto: CreateUserDto = {
        ...mockCreateUserDto,
        email: 'test@gmail.com',
      };

      // Act & Assert
      await expect(service.register(invalidEmailDto)).rejects.toThrow(
        new UnauthorizedException('Only HUST email is allowed'),
      );

      expect(usersService.getUser).not.toHaveBeenCalled();
      expect(registerService.getRegister).not.toHaveBeenCalled();
      expect(registerService.createRegister).not.toHaveBeenCalled();
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });

    // Scenario 3: Reject existing user
    it('should reject registration if user already exists', async () => {
      // Arrange
      jest
        .spyOn(usersService, 'getUser')
        .mockResolvedValueOnce({ id: '1', email: mockCreateUserDto.email } as any);

      // Act & Assert
      await expect(service.register(mockCreateUserDto)).rejects.toThrow(
        new BadRequestException('User already exists'),
      );

      expect(usersService.getUser).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
        withDeleted: true,
      });
      expect(registerService.getRegister).not.toHaveBeenCalled();
      expect(registerService.createRegister).not.toHaveBeenCalled();
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });

    // Scenario 4: Reject existing registration
    it('should reject registration if registration already exists', async () => {
      // Arrange
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(null);
      jest.spyOn(registerService, 'getRegister').mockResolvedValueOnce(mockRegisterEntity);

      // Act & Assert
      await expect(service.register(mockCreateUserDto)).rejects.toThrow(
        new BadRequestException('Register already exists'),
      );

      expect(usersService.getUser).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
        withDeleted: true,
      });
      expect(registerService.getRegister).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
      });
      expect(registerService.createRegister).not.toHaveBeenCalled();
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
    });

    // Scenario 5: Send admin notification email
    it('should send notification email to admin emails', async () => {
      // Arrange
      SystemConfigUtils.adminEmails = ['admin1@example.com', 'admin2@example.com'];
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(null);
      jest.spyOn(registerService, 'getRegister').mockResolvedValueOnce(null);
      jest.spyOn(registerService, 'createRegister').mockResolvedValueOnce(mockRegisterEntity);

      // Act
      await service.register(mockCreateUserDto);

      // Assert
      expect(mailerService.sendEmail).toHaveBeenCalledWith({
        to: 'admin1@example.com,admin2@example.com',
        subject: 'New user registered',
        content: expect.any(String),
      });
    });

    // Scenario 6: Handle missing admin emails
    it('should handle missing admin emails gracefully', async () => {
      // Arrange
      SystemConfigUtils.adminEmails = [];
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(null);
      jest.spyOn(registerService, 'getRegister').mockResolvedValueOnce(null);
      jest.spyOn(registerService, 'createRegister').mockResolvedValueOnce(mockRegisterEntity);

      // Act
      const result = await service.register(mockCreateUserDto);

      // Assert
      expect(Logger.warn).toHaveBeenCalledWith('No admin emails found', 'AuthService');
      expect(mailerService.sendEmail).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: 'success',
        message: 'User registered successfully',
      });
    });

    // Scenario 7: Handle email sending failure
    it('should handle email sending failure gracefully', async () => {
      // Arrange
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(null);
      jest.spyOn(registerService, 'getRegister').mockResolvedValueOnce(null);
      jest.spyOn(registerService, 'createRegister').mockResolvedValueOnce(mockRegisterEntity);
      jest
        .spyOn(mailerService, 'sendEmail')
        .mockRejectedValueOnce(new Error('Failed to send email'));

      // Act
      const result = await service.register(mockCreateUserDto);

      // Assert
      expect(mailerService.sendEmail).toHaveBeenCalled();
      expect(Logger.error).toHaveBeenCalledWith(expect.any(Error), 'AuthService.register');
      expect(result).toEqual({
        status: 'success',
        message: 'User registered successfully',
      });
    });
  });
});
