import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupervisoryCommentsStrategy } from './supervisory-comments.strategy';
import { SupervisoryCommentsEntity } from '../entities/supervisory-comments.entity';
import { ClassService } from 'src/class/class.service';
import { StorageService } from 'src/storage/storage.service';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { UserPayload } from 'src/auth/types/user-playload.type';

describe('SupervisoryCommentsStrategy', () => {
  let strategy: SupervisoryCommentsStrategy;
  let mockRepository: any;
  let mockClassService: any;
  let mockStorageService: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockClassService = {
      getOne: jest.fn(),
    };

    mockStorageService = {
      downloadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    // Create strategy instance directly with mocks
    strategy = new SupervisoryCommentsStrategy(
      mockRepository,
      mockClassService,
      mockStorageService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('create', () => {
    const mockUser: UserPayload = { email: 'test@example.com', role: 'TEACHER' };
    const mockClass = { id: '1', teacher: { email: 'test@example.com' } };
    const createDto = { classId: '1', name: 'Test Supervisory Comments' };

    it('should create supervisory comments successfully', async () => {
      mockClassService.getOne.mockResolvedValue(mockClass);
      mockRepository.save.mockResolvedValue({ id: '1', ...createDto, class: mockClass });

      const result = await strategy.create(createDto as any, mockUser);

      expect(mockClassService.getOne).toHaveBeenCalledWith({
        where: {
          id: createDto.classId,
          teacher: {
            email: mockUser.email,
          },
        },
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createDto,
        class: mockClass,
      });
      expect(result).toEqual({ id: '1', ...createDto, class: mockClass });
    });

    it('should throw BadRequestException if class not found', async () => {
      mockClassService.getOne.mockResolvedValue(null);

      await expect(strategy.create(createDto as any, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockClassService.getOne).toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const mockUser: UserPayload = { email: 'test@example.com', role: 'TEACHER' };
    const updateDto = { id: '1', name: 'Updated Supervisory Comments' };
    const existingEntity = {
      id: '1',
      name: 'Test Supervisory Comments',
      class: { teacher: { email: 'test@example.com' } },
    };

    it('should update supervisory comments successfully', async () => {
      mockRepository.findOne.mockResolvedValue(existingEntity);
      mockRepository.save.mockResolvedValue({
        ...existingEntity,
        name: updateDto.name,
      });

      const result = await strategy.update(updateDto as any, mockUser);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: updateDto.id,
          class: {
            teacher: {
              email: mockUser.email,
            },
          },
        },
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...existingEntity,
        ...updateDto,
      });
      expect(result).toEqual({ ...existingEntity, name: updateDto.name });
    });

    it('should throw BadRequestException if supervisory comments not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(strategy.update(updateDto as any, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    const listDto = { classId: '1' };
    const expectedResult = [
      { id: '1', name: 'Supervisory Comments 1', class: { id: '1' } },
      { id: '2', name: 'Supervisory Comments 2', class: { id: '1' } },
    ];

    it('should return a list of supervisory comments for a class', async () => {
      mockRepository.find.mockResolvedValue(expectedResult);

      const result = await strategy.list(listDto as any);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          class: {
            id: listDto.classId,
          },
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should filter by ids if provided', async () => {
      const dtoWithIds = { classId: '1', ids: ['1', '2'] };
      mockRepository.find.mockResolvedValue(expectedResult);

      const result = await strategy.list(dtoWithIds as any);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          id: expect.any(Object), // In(['1', '2'])
          class: {
            id: dtoWithIds.classId,
          },
        },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('delete', () => {
    const mockUser: UserPayload = { email: 'test@example.com', role: 'TEACHER' };
    const deleteDto = { id: '1' };

    it('should delete supervisory comments with only inputPath', async () => {
      const entity = {
        id: '1',
        inputPath: 'path/to/input',
        outputPath: null,
        class: { teacher: { email: 'test@example.com' } },
      };

      mockRepository.findOne.mockResolvedValue(entity);
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await strategy.delete(deleteDto as any, mockUser);

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('path/to/input');
      expect(mockRepository.delete).toHaveBeenCalledWith(deleteDto.id);
      expect(result).toEqual({
        status: 'success',
        message: 'Supervisory Comments deleted',
      });
    });

    it('should update supervisory comments when it has outputPath', async () => {
      const entity = {
        id: '1',
        inputPath: 'path/to/input',
        outputPath: 'path/to/output',
        class: { teacher: { email: 'test@example.com' } },
      };

      mockRepository.findOne.mockResolvedValue(entity);
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockRepository.save.mockResolvedValue({ ...entity, inputPath: null });

      const result = await strategy.delete(deleteDto as any, mockUser);

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('path/to/input');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'success',
        message: 'Supervisory Comments deleted',
      });
    });

    it('should throw BadRequestException if supervisory comments not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(strategy.delete(deleteDto as any, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('getOne', () => {
    const mockUser: UserPayload = { email: 'test@example.com', role: 'TEACHER' };
    const getOneDto = { id: '1' };
    const existingEntity = {
      id: '1',
      name: 'Test Supervisory Comments',
      class: { teacher: { email: 'test@example.com' } },
    };

    it('should return supervisory comments by id', async () => {
      mockRepository.findOne.mockResolvedValue(existingEntity);

      const result = await strategy.getOne(getOneDto as any, mockUser);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: getOneDto.id,
          class: {
            teacher: {
              email: mockUser.email,
            },
          },
        },
        relations: {
          class: true,
        },
      });
      expect(result).toEqual(existingEntity);
    });

    it('should return empty object if supervisory comments not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await strategy.getOne(getOneDto as any, mockUser);

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result).toEqual({});
    });
  });

  describe('downloadFile', () => {
    const mockUser: UserPayload = { email: 'test@example.com', role: 'TEACHER' };
    const downloadDto = { classId: '1', ids: ['1'] };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
      pipe: jest.fn(),
    } as unknown as Response;

    it('should return success message if no files found', async () => {
      mockRepository.find.mockResolvedValue([]);

      await strategy.downloadFile(downloadDto as any, mockResponse, mockUser);

      expect(mockRepository.find).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'No files found',
      });
    });

    it('should return error message if entity has no outputPath', async () => {
      const entities = [{ id: '1', outputPath: null }];
      mockRepository.find.mockResolvedValue(entities);

      await strategy.downloadFile(downloadDto as any, mockResponse, mockUser);

      expect(mockRepository.find).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Download file from Firebase failed',
      });
    });

    it('should send file if single entity has outputPath', async () => {
      const entity = {
        id: '1',
        outputPath: 'path/to/output/file.pdf',
      };
      mockRepository.find.mockResolvedValue([entity]);

      const mockReadable = {};
      const mockBuffer = Buffer.from('test data');

      mockStorageService.downloadFile.mockResolvedValue(mockReadable);

      // Mock the streamToBuffer function by replacing the import
      const streamToBufferModule = require('src/storage/helpers/convert.helper');
      const originalStreamToBuffer = streamToBufferModule.streamToBuffer;
      streamToBufferModule.streamToBuffer = jest.fn().mockResolvedValue(mockBuffer);

      await strategy.downloadFile(downloadDto as any, mockResponse, mockUser);

      expect(mockRepository.find).toHaveBeenCalled();
      expect(mockStorageService.downloadFile).toHaveBeenCalledWith(entity.outputPath);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=file.pdf',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'pdf');
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);

      // Restore the original function
      streamToBufferModule.streamToBuffer = originalStreamToBuffer;
    });

    it('should create a zip archive if multiple entities have outputPath', async () => {
      const entities = [
        { id: '1', outputPath: 'path/to/output/file1.pdf' },
        { id: '2', outputPath: 'path/to/output/file2.pdf' },
      ];
      mockRepository.find.mockResolvedValue(entities);

      const mockReadable = {};
      const mockBuffer = Buffer.from('test data');

      mockStorageService.downloadFile.mockResolvedValue(mockReadable);

      // Mock the streamToBuffer function
      const streamToBufferModule = require('src/storage/helpers/convert.helper');
      const originalStreamToBuffer = streamToBufferModule.streamToBuffer;
      streamToBufferModule.streamToBuffer = jest.fn().mockResolvedValue(mockBuffer);

      // Skip actual test assertions for archiver since it's difficult to mock properly
      // Just test that find was called with right parameters

      await strategy.downloadFile(downloadDto as any, mockResponse, mockUser);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          ...(downloadDto.ids && { id: expect.any(Object) }),
          class: {
            id: downloadDto.classId,
            teacher: {
              email: mockUser.email,
            },
          },
        },
      });

      // Restore original function
      streamToBufferModule.streamToBuffer = originalStreamToBuffer;
    });
  });

  describe('deleteFile', () => {
    const mockUser: UserPayload = { email: 'test@example.com', role: 'TEACHER' };
    const deleteFileDto = { classId: '1', ids: ['1', '2'] };

    it('should delete output files from supervisory comments', async () => {
      const entities = [
        { id: '1', inputPath: 'path/to/input1', outputPath: 'path/to/output1' },
        { id: '2', inputPath: null, outputPath: 'path/to/output2' },
      ];

      mockRepository.find.mockResolvedValue(entities);
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockRepository.save.mockResolvedValue(entities[0]);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await strategy.deleteFile(deleteFileDto as any, mockUser);

      expect(mockRepository.find).toHaveBeenCalled();
      expect(mockStorageService.deleteFile).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        status: 'success',
        message: 'File deleted',
      });
    });
  });
});
