import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenRequest, SignInDto } from './dtos/sign-in.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dtos/user.dto';
import { BaseResponse } from 'src/base/types/response.type';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  // Mock response data
  const mockSignInResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  // Mock register response
  const mockRegisterResponse: BaseResponse = {
    status: 'success',
    message: 'User registered successfully',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signIn: jest.fn(),
            refreshTokens: jest.fn(),
            register: jest.fn(),
            getOnedriveAuthUrl: jest.fn(),
            processOnedriveCallback: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    // Scenario 1: Successfully sign in with valid credentials
    it('should successfully sign in with valid credentials', async () => {
      // Arrange
      const signInDto: SignInDto = {
        email: 'test@hust.edu.vn',
        password: 'password123',
      };

      jest.spyOn(authService, 'signIn').mockResolvedValueOnce(mockSignInResponse);

      // Act
      const result = await controller.signIn(signInDto);

      // Assert
      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
      expect(result).toEqual(mockSignInResponse);
    });

    // Scenario 2: Handle service throwing UnauthorizedException
    it('should propagate UnauthorizedException from service', async () => {
      // Arrange
      const signInDto: SignInDto = {
        email: 'test@hust.edu.vn',
        password: 'wrong-password',
      };

      jest
        .spyOn(authService, 'signIn')
        .mockRejectedValueOnce(new UnauthorizedException('Invalid credentials'));

      // Act & Assert
      await expect(controller.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
    });

    // Scenario 3: Handle service throwing other exceptions
    it('should propagate other exceptions from service', async () => {
      // Arrange
      const signInDto: SignInDto = {
        email: 'test@hust.edu.vn',
        password: 'password123',
      };

      const error = new Error('Unexpected error');
      jest.spyOn(authService, 'signIn').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.signIn(signInDto)).rejects.toThrow(error);
      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
    });
  });

  describe('refreshToken', () => {
    // Scenario 1: Successfully refresh tokens with valid token
    it('should successfully refresh tokens with valid refresh token', async () => {
      // Arrange
      const refreshTokenRequest: RefreshTokenRequest = {
        refreshToken: 'valid-refresh-token',
      };

      jest.spyOn(authService, 'refreshTokens').mockResolvedValueOnce(mockSignInResponse);

      // Act
      const result = await controller.refreshToken(refreshTokenRequest);

      // Assert
      expect(authService.refreshTokens).toHaveBeenCalledWith(refreshTokenRequest);
      expect(result).toEqual(mockSignInResponse);
    });

    // Scenario 2: Handle service throwing UnauthorizedException
    it('should propagate UnauthorizedException from service', async () => {
      // Arrange
      const refreshTokenRequest: RefreshTokenRequest = {
        refreshToken: 'invalid-refresh-token',
      };

      jest
        .spyOn(authService, 'refreshTokens')
        .mockRejectedValueOnce(new UnauthorizedException('Invalid refresh token'));

      // Act & Assert
      await expect(controller.refreshToken(refreshTokenRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.refreshTokens).toHaveBeenCalledWith(refreshTokenRequest);
    });

    // Scenario 3: Handle service throwing other exceptions
    it('should propagate other exceptions from service', async () => {
      // Arrange
      const refreshTokenRequest: RefreshTokenRequest = {
        refreshToken: 'valid-refresh-token',
      };

      const error = new Error('Unexpected error');
      jest.spyOn(authService, 'refreshTokens').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.refreshToken(refreshTokenRequest)).rejects.toThrow(error);
      expect(authService.refreshTokens).toHaveBeenCalledWith(refreshTokenRequest);
    });
  });

  describe('register', () => {
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

    // Scenario 1: Successfully register a user
    it('should successfully register a user', async () => {
      // Arrange
      jest.spyOn(authService, 'register').mockResolvedValueOnce(mockRegisterResponse);

      // Act
      const result = await controller.register(mockCreateUserDto);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(mockRegisterResponse);
    });

    // Scenario 2: Propagate success response from service
    it('should propagate success response from service', async () => {
      // Arrange
      const customResponse: BaseResponse = {
        status: 'success',
        message: 'Custom success message',
      };

      jest.spyOn(authService, 'register').mockResolvedValueOnce(customResponse);

      // Act
      const result = await controller.register(mockCreateUserDto);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(customResponse);
    });

    // Scenario 3: Propagate UnauthorizedException from service
    it('should propagate UnauthorizedException from service', async () => {
      // Arrange
      const unauthorizedException = new UnauthorizedException('Only HUST email is allowed');
      jest.spyOn(authService, 'register').mockRejectedValueOnce(unauthorizedException);

      // Act & Assert
      await expect(controller.register(mockCreateUserDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.register).toHaveBeenCalledWith(mockCreateUserDto);
    });

    // Scenario 4: Propagate BadRequestException from service
    it('should propagate BadRequestException from service', async () => {
      // Arrange
      const badRequestException = new BadRequestException('User already exists');
      jest.spyOn(authService, 'register').mockRejectedValueOnce(badRequestException);

      // Act & Assert
      await expect(controller.register(mockCreateUserDto)).rejects.toThrow(BadRequestException);
      expect(authService.register).toHaveBeenCalledWith(mockCreateUserDto);
    });

    // Scenario 5: Propagate other exceptions from service
    it('should propagate other exceptions from service', async () => {
      // Arrange
      const error = new Error('Unexpected error');
      jest.spyOn(authService, 'register').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.register(mockCreateUserDto)).rejects.toThrow(error);
      expect(authService.register).toHaveBeenCalledWith(mockCreateUserDto);
    });
  });
});
