import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigurationService } from './system-configuration.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SystemConfigEntity } from './entities/system-config.entity';
import { BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { SystemConfigUtils } from './utils/system-config.util';
import { Keys } from './constants/key.const';
import { CreateSystemConfigDto, UpdateSystemConfigDto } from './dtos/system-config.dto';

describe('SystemConfigurationService', () => {
  let service: SystemConfigurationService;
  let repository: Repository<SystemConfigEntity>;
  let eventEmitter: EventEmitter2;

  // Mock data
  const mockSystemConfig = {
    id: 'config-id-1',
    key: Keys.SYSTEM_NAME,
    stringValue: 'Test System',
    numberValue: undefined,
    booleanValue: undefined,
    jsonValue: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as SystemConfigEntity;

  const mockCreateDto: CreateSystemConfigDto = {
    key: Keys.SYSTEM_NAME,
    stringValue: 'Test System',
  };

  const mockUpdateDto: UpdateSystemConfigDto = {
    key: Keys.SYSTEM_NAME,
    stringValue: 'Updated System Name',
  };

  // Save original values to restore later
  const originalSystemName = SystemConfigUtils.systemName;
  const originalLogoUrl = SystemConfigUtils.logoUrl;
  const originalLoginUrl = SystemConfigUtils.loginUrl;
  const originalAdminEmails = SystemConfigUtils.adminEmails;
  const originalEnableTeacherEmailCheck = SystemConfigUtils.enableTeacherEmailCheck;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigurationService,
        {
          provide: getRepositoryToken(SystemConfigEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SystemConfigurationService>(SystemConfigurationService);
    repository = module.get<Repository<SystemConfigEntity>>(getRepositoryToken(SystemConfigEntity));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger, 'verbose').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    // Restore original values
    SystemConfigUtils.systemName = originalSystemName;
    SystemConfigUtils.logoUrl = originalLogoUrl;
    SystemConfigUtils.loginUrl = originalLoginUrl;
    SystemConfigUtils.adminEmails = originalAdminEmails;
    SystemConfigUtils.enableTeacherEmailCheck = originalEnableTeacherEmailCheck;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return a single configuration by key', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockSystemConfig);

      // Act
      const result = await service.get(Keys.SYSTEM_NAME);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({ where: { key: Keys.SYSTEM_NAME } });
      expect(result).toEqual(mockSystemConfig);
    });

    it('should return null when configuration does not exist', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      // Act
      const result = await service.get('non-existent-key');

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({ where: { key: 'non-existent-key' } });
      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should return all configurations when no keys are provided', async () => {
      // Arrange
      const mockConfigs = [mockSystemConfig];
      jest.spyOn(repository, 'find').mockResolvedValueOnce(mockConfigs);

      // Act
      const result = await service.list({});

      // Assert
      expect(repository.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockConfigs);
    });

    it('should return configurations filtered by keys', async () => {
      // Arrange
      const mockConfigs = [mockSystemConfig];
      jest.spyOn(repository, 'find').mockResolvedValueOnce(mockConfigs);
      const keys = [Keys.SYSTEM_NAME];

      // Act
      const result = await service.list({ keys });

      // Assert
      expect(repository.find).toHaveBeenCalledWith({ where: { key: expect.anything() } });
      expect(result).toEqual(mockConfigs);
    });
  });

  describe('create', () => {
    it('should create a new configuration and emit event', async () => {
      // Arrange
      jest.spyOn(repository, 'save').mockResolvedValueOnce(mockSystemConfig);
      jest.spyOn(eventEmitter, 'emit').mockImplementation(() => true);

      // Act
      const result = await service.create(mockCreateDto);

      // Assert
      expect(repository.save).toHaveBeenCalledWith({
        stringValue: null,
        numberValue: null,
        booleanValue: null,
        jsonValue: null,
        ...mockCreateDto,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('system.config.created', [mockSystemConfig]);
      expect(result).toEqual(mockSystemConfig);
    });
  });

  describe('update', () => {
    it('should update an existing configuration and emit event', async () => {
      // Arrange
      const updatedConfig = { ...mockSystemConfig, stringValue: 'Updated System Name' };
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockSystemConfig);
      jest.spyOn(repository, 'save').mockResolvedValueOnce(updatedConfig);
      jest.spyOn(eventEmitter, 'emit').mockImplementation(() => true);

      // Act
      const result = await service.update(mockUpdateDto);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({ where: { key: mockUpdateDto.key } });
      expect(repository.save).toHaveBeenCalledWith({
        stringValue: null,
        numberValue: null,
        booleanValue: null,
        jsonValue: null,
        ...mockUpdateDto,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('system.config.updated', [updatedConfig]);
      expect(result).toEqual(updatedConfig);
    });

    it('should throw BadRequestException when configuration does not exist', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.update(mockUpdateDto)).rejects.toThrow(
        new BadRequestException(`System configuration with key ${mockUpdateDto.key} not found`),
      );
      expect(repository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete an existing configuration', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockSystemConfig);
      jest.spyOn(repository, 'delete').mockResolvedValueOnce({ affected: 1, raw: {} });

      // Act
      await service.delete(Keys.SYSTEM_NAME);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({ where: { key: Keys.SYSTEM_NAME } });
      expect(repository.delete).toHaveBeenCalledWith({ key: Keys.SYSTEM_NAME });
    });

    it('should throw BadRequestException when configuration does not exist', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.delete('non-existent-key')).rejects.toThrow(
        new BadRequestException(`System configuration with key non-existent-key not found`),
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('onSystemConfigChange', () => {
    it('should update SYSTEM_NAME in SystemConfigUtils', () => {
      // Arrange
      const config = {
        key: Keys.SYSTEM_NAME,
        stringValue: 'New System Name',
        numberValue: undefined,
        booleanValue: undefined,
        jsonValue: undefined,
      } as unknown as SystemConfigEntity;

      // Mock SCU.getString to return the string value
      jest.spyOn(SystemConfigUtils, 'getString').mockReturnValueOnce('New System Name');

      // Act
      service['onSystemConfigChange']([config]);

      // Assert
      expect(SystemConfigUtils.systemName).toEqual('New System Name');
    });

    it('should update LOGO_URL in SystemConfigUtils', () => {
      // Arrange
      const config = {
        key: Keys.LOGO_URL,
        stringValue: 'https://example.com/logo.png',
        numberValue: undefined,
        booleanValue: undefined,
        jsonValue: undefined,
      } as unknown as SystemConfigEntity;

      // Mock SCU.getString to return the string value
      jest
        .spyOn(SystemConfigUtils, 'getString')
        .mockReturnValueOnce('https://example.com/logo.png');

      // Act
      service['onSystemConfigChange']([config]);

      // Assert
      expect(SystemConfigUtils.logoUrl).toEqual('https://example.com/logo.png');
    });

    it('should update LOGIN_URL in SystemConfigUtils', () => {
      // Arrange
      const config = {
        key: Keys.LOGIN_URL,
        stringValue: 'https://example.com/login',
        numberValue: undefined,
        booleanValue: undefined,
        jsonValue: undefined,
      } as unknown as SystemConfigEntity;

      // Mock SCU.getString to return the string value
      jest.spyOn(SystemConfigUtils, 'getString').mockReturnValueOnce('https://example.com/login');

      // Act
      service['onSystemConfigChange']([config]);

      // Assert
      expect(SystemConfigUtils.loginUrl).toEqual('https://example.com/login');
    });

    it('should update ADMIN_EMAILS in SystemConfigUtils', () => {
      // Arrange
      const adminEmails = ['admin1@example.com', 'admin2@example.com'];
      const config = {
        key: Keys.ADMIN_EMAILS,
        stringValue: undefined,
        numberValue: undefined,
        booleanValue: undefined,
        jsonValue: JSON.stringify(adminEmails),
      } as unknown as SystemConfigEntity;

      // Mock SCU.getJson to return parsed JSON
      jest.spyOn(SystemConfigUtils, 'getJson').mockReturnValueOnce(adminEmails);

      // Act
      service['onSystemConfigChange']([config]);

      // Assert
      expect(SystemConfigUtils.adminEmails).toEqual(adminEmails);
    });

    it('should update ENABLE_TEACHER_EMAIL_CHECK in SystemConfigUtils', () => {
      // Arrange
      const config = {
        key: Keys.ENABLE_TEACHER_EMAIL_CHECK,
        stringValue: undefined,
        numberValue: undefined,
        booleanValue: true,
        jsonValue: undefined,
      } as unknown as SystemConfigEntity;

      // Mock SCU.getBoolean to return the boolean value
      jest.spyOn(SystemConfigUtils, 'getBoolean').mockReturnValueOnce(true);

      // Act
      service['onSystemConfigChange']([config]);

      // Assert
      expect(SystemConfigUtils.enableTeacherEmailCheck).toEqual(true);
    });

    it('should handle errors during config update', () => {
      // Arrange
      jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
      jest.spyOn(SystemConfigUtils, 'getString').mockImplementation(() => {
        throw new Error('Test error');
      });

      const config = {
        key: Keys.SYSTEM_NAME,
        stringValue: 'New System Name',
      } as unknown as SystemConfigEntity;

      // Act
      service['onSystemConfigChange']([config]);

      // Assert
      expect(Logger.error).toHaveBeenCalled();
    });
  });

  describe('emitInitialConfigurations', () => {
    it('should emit initial configurations on startup', async () => {
      // Arrange
      const configs = [mockSystemConfig];
      jest.spyOn(repository, 'find').mockResolvedValueOnce(configs);
      jest.spyOn(eventEmitter, 'emit').mockImplementation(() => true);

      // Act
      await service['emitInitialConfigurations']();

      // Assert
      expect(repository.find).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('system.config.initialize', configs);
    });

    it('should handle errors during initialization', async () => {
      // Arrange
      jest.spyOn(repository, 'find').mockRejectedValueOnce(new Error('Test error'));
      jest.spyOn(Logger, 'error').mockImplementation(() => undefined);

      // Act
      await service['emitInitialConfigurations']();

      // Assert
      expect(repository.find).toHaveBeenCalled();
      expect(Logger.error).toHaveBeenCalled();
    });
  });
});
