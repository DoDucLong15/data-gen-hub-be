import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigurationController } from './system-configuration.controller';
import { SystemConfigurationService } from './system-configuration.service';
import {
  CreateSystemConfigDto,
  GetSystemConfigQueryDto,
  UpdateSystemConfigDto,
} from './dtos/system-config.dto';
import { SystemConfigEntity } from './entities/system-config.entity';
import { BaseResponse } from '../base/types/response.type';
import { BadRequestException } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { PoliciesGuard } from '../authorization/guards/policies.guard';

describe('SystemConfigurationController', () => {
  let controller: SystemConfigurationController;
  let service: SystemConfigurationService;

  // Mock data
  const mockSystemConfig: SystemConfigEntity = {
    key: 'TEST_KEY',
    stringValue: 'Test Value',
    numberValue: undefined,
    booleanValue: undefined,
    jsonValue: undefined,
  } as unknown as SystemConfigEntity;

  const mockCreateDto: CreateSystemConfigDto = {
    key: 'TEST_KEY',
    stringValue: 'Test Value',
  };

  const mockUpdateDto: UpdateSystemConfigDto = {
    key: 'TEST_KEY',
    stringValue: 'Updated Value',
  };

  const mockQueryDto: GetSystemConfigQueryDto = {
    keys: ['TEST_KEY'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemConfigurationController],
      providers: [
        {
          provide: SystemConfigurationService,
          useValue: {
            list: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SystemConfigurationController>(SystemConfigurationController);
    service = module.get<SystemConfigurationService>(SystemConfigurationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSystemConfigurations', () => {
    it('should return an array of system configurations', async () => {
      // Arrange
      const mockConfigs = [mockSystemConfig];
      jest.spyOn(service, 'list').mockResolvedValueOnce(mockConfigs);

      // Act
      const result = await controller.getSystemConfigurations(mockQueryDto);

      // Assert
      expect(service.list).toHaveBeenCalledWith(mockQueryDto);
      expect(result).toEqual(mockConfigs);
    });

    it('should return empty array when no configurations found', async () => {
      // Arrange
      jest.spyOn(service, 'list').mockResolvedValueOnce([]);

      // Act
      const result = await controller.getSystemConfigurations(mockQueryDto);

      // Assert
      expect(service.list).toHaveBeenCalledWith(mockQueryDto);
      expect(result).toEqual([]);
    });
  });

  describe('createSystemConfiguration', () => {
    it('should create a new system configuration', async () => {
      // Arrange
      jest.spyOn(service, 'create').mockResolvedValueOnce(mockSystemConfig);

      // Act
      const result = await controller.createSystemConfiguration(mockCreateDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockSystemConfig);
    });

    it('should propagate service errors', async () => {
      // Arrange
      const error = new BadRequestException('Test Error');
      jest.spyOn(service, 'create').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.createSystemConfiguration(mockCreateDto)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    });
  });

  describe('updateSystemConfiguration', () => {
    it('should update an existing system configuration', async () => {
      // Arrange
      const updatedConfig = { ...mockSystemConfig, stringValue: 'Updated Value' };
      jest.spyOn(service, 'update').mockResolvedValueOnce(updatedConfig);

      // Act
      const result = await controller.updateSystemConfiguration(mockUpdateDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(mockUpdateDto);
      expect(result).toEqual(updatedConfig);
    });

    it('should propagate service errors', async () => {
      // Arrange
      const error = new BadRequestException('Test Error');
      jest.spyOn(service, 'update').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.updateSystemConfiguration(mockUpdateDto)).rejects.toThrow(error);
      expect(service.update).toHaveBeenCalledWith(mockUpdateDto);
    });
  });

  describe('deleteSystemConfiguration', () => {
    it('should delete an existing system configuration', async () => {
      // Arrange
      jest.spyOn(service, 'delete').mockResolvedValueOnce(undefined);

      // Act
      const result = await controller.deleteSystemConfiguration('TEST_KEY');

      // Assert
      expect(service.delete).toHaveBeenCalledWith('TEST_KEY');
      expect(result).toEqual({
        status: 'success',
        message: 'System configuration deleted successfully',
      } as BaseResponse);
    });

    it('should propagate service errors', async () => {
      // Arrange
      const error = new BadRequestException('Test Error');
      jest.spyOn(service, 'delete').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.deleteSystemConfiguration('TEST_KEY')).rejects.toThrow(error);
      expect(service.delete).toHaveBeenCalledWith('TEST_KEY');
    });
  });
});
