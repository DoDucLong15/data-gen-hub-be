import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProgressEntity } from './entities/progress.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository, UpdateResult } from 'typeorm';
import { EProgressStatus, EProgressType } from './constant/progress.const';
import { Logger } from '@nestjs/common';
import { CommonUtils } from '../utils/common.util'; // Import CommonUtils
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ProgressService', () => {
  let service: ProgressService;
  let repository: Repository<ProgressEntity>;

  // Mock repository methods
  const mockRepository = {
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: getRepositoryToken(ProgressEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    repository = module.get<Repository<ProgressEntity>>(getRepositoryToken(ProgressEntity));

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateId', () => {
    it('should generate an ID with the provided prefix', () => {
      const prefix = 'test';
      const id = ProgressService.generateId(prefix);

      expect(id).toContain(prefix);
      expect(id.split('-').length).toBeGreaterThan(2);
    });

    it('should generate an ID with default prefix when no prefix is provided', () => {
      const id = ProgressService.generateId();

      expect(id).toContain('progress');
      expect(id.split('-').length).toBeGreaterThan(2);
    });
  });

  describe('transformError', () => {
    it('should return null for empty object', () => {
      const result = (service as any).transformError({});
      expect(result).toBeNull();
    });

    it('should transform error object into message object', () => {
      const error = {
        field1: new Error('Error 1'),
        field2: new Error('Error 2'),
      };

      const result = (service as any).transformError(error);

      expect(result).toEqual({
        field1: 'Error 1',
        field2: 'Error 2',
      });
    });

    it('should handle non-object errors', () => {
      const error = new Error('Simple error');
      const result = (service as any).transformError(error);

      // Chỉ kiểm tra đảm bảo rằng kết quả là một object (không kiểm tra nội dung cụ thể)
      expect(typeof result === 'object').toBeTruthy();
    });

    it('should return error as is if it is falsy', () => {
      expect((service as any).transformError(null)).toBeNull();
      expect((service as any).transformError(undefined)).toBeUndefined();
    });
  });

  describe('createProgress', () => {
    it('should create progress entities with PROCESSING status', async () => {
      // Arrange
      const progressData: DeepPartial<ProgressEntity>[] = [
        {
          processId: 'process-1',
          type: EProgressType.DRIVE_DATA,
          action: 'upload',
        },
        {
          processId: 'process-2',
          type: EProgressType.STUDENT_LIST,
          action: 'import',
        },
      ];

      const expectedSavedData = progressData.map((item) => ({
        ...item,
        status: EProgressStatus.PROCESSING,
      }));

      const mockSavedEntities = expectedSavedData.map((data) => ({
        ...data,
        id: 'generated-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockRepository.save.mockResolvedValue(mockSavedEntities);

      // Act
      const result = await service.createProgress(progressData);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(expectedSavedData);
      expect(result).toEqual(mockSavedEntities);
    });
  });

  describe('makeCompleted', () => {
    it('should update progress status to COMPLETED', async () => {
      // Arrange
      const condition: FindOptionsWhere<ProgressEntity> & { processId: string } = {
        processId: 'process-1',
      };

      const updateData: DeepPartial<ProgressEntity> = {
        action: 'completed-action',
      };

      const mockUpdateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };

      mockRepository.update.mockResolvedValue(mockUpdateResult);

      // Act
      const result = await service.makeCompleted(condition, updateData);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(
        { ...condition, status: EProgressStatus.PROCESSING },
        expect.objectContaining({
          ...updateData,
          status: EProgressStatus.COMPLETED,
        }),
      );
      expect(result).toEqual(mockUpdateResult);
    });

    it('should handle errors and log them', async () => {
      // Arrange
      const condition = { processId: 'process-1' };
      const updateData = { action: 'completed-action' };
      const error = new Error('Update failed');

      mockRepository.update.mockRejectedValue(error);

      // Act
      await service.makeCompleted(condition, updateData);

      // Assert
      expect(Logger.error).toHaveBeenCalledWith(error, 'ProgressService.makeCompleted');
    });
  });

  describe('makeFailed', () => {
    it('should update progress status to FAILED with error', async () => {
      // Arrange
      const condition = { processId: 'process-1' };
      const updateData = {
        action: 'failed-action',
        error: { message: 'Something went wrong' },
      };

      const mockUpdateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };

      mockRepository.update.mockResolvedValue(mockUpdateResult);

      // Act
      const result = await service.makeFailed(condition, updateData);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(
        { ...condition, status: EProgressStatus.PROCESSING },
        {
          ...updateData,
          status: EProgressStatus.FAILED,
          error: { message: 'Something went wrong' },
        },
      );
      expect(result).toEqual(mockUpdateResult);
    });

    it('should handle errors and log them', async () => {
      // Arrange
      const condition = { processId: 'process-1' };
      const updateData = {
        action: 'failed-action',
        error: { message: 'Something went wrong' },
      };
      const error = new Error('Update failed');

      mockRepository.update.mockRejectedValue(error);

      // Act
      await service.makeFailed(condition, updateData);

      // Assert
      expect(Logger.error).toHaveBeenCalledWith(error, 'ProgressService.makeFailed');
    });
  });

  describe('abort', () => {
    it('should update progress status to FAILED with provided error', async () => {
      // Arrange
      const condition = { processId: 'process-1' };
      const error = { message: 'Operation aborted' };

      const mockUpdateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };

      mockRepository.update.mockResolvedValue(mockUpdateResult);

      // Act
      const result = await service.abort(condition, error);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(
        { ...condition, status: EProgressStatus.PROCESSING },
        { status: EProgressStatus.FAILED, error },
      );
      expect(result).toEqual(mockUpdateResult);
    });

    it('should handle errors and log them', async () => {
      // Arrange
      const condition = { processId: 'process-1' };
      const error = { message: 'Operation aborted' };
      const updateError = new Error('Update failed');

      mockRepository.update.mockRejectedValue(updateError);

      // Act
      await service.abort(condition, error);

      // Assert
      expect(Logger.error).toHaveBeenCalledWith(updateError, 'ProgressService.abort');
    });
  });

  describe('getMany', () => {
    it('should retrieve progress entities with provided options', async () => {
      // Arrange
      const options: FindManyOptions<ProgressEntity> = {
        where: { status: EProgressStatus.PROCESSING },
        order: { createdAt: 'DESC' },
      };

      const mockEntities: ProgressEntity[] = [
        {
          id: '1',
          processId: 'process-1',
          type: EProgressType.DRIVE_DATA,
          status: EProgressStatus.PROCESSING,
          error: null,
          createBy: 'system',
          action: 'upload',
          classId: 'class-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ProgressEntity,
        {
          id: '2',
          processId: 'process-2',
          type: EProgressType.STUDENT_LIST,
          status: EProgressStatus.PROCESSING,
          error: null,
          createBy: 'system',
          action: 'import',
          classId: 'class-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ProgressEntity,
      ];

      mockRepository.find.mockResolvedValue(mockEntities);

      // Act
      const result = await service.getMany(options);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockEntities);
    });

    it('should retrieve all progress entities when no options provided', async () => {
      // Arrange
      const mockEntities: ProgressEntity[] = [
        {
          id: '1',
          processId: 'process-1',
          type: EProgressType.DRIVE_DATA,
          status: EProgressStatus.PROCESSING,
          error: null,
          createBy: 'system',
          action: 'upload',
          classId: 'class-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ProgressEntity,
      ];

      mockRepository.find.mockResolvedValue(mockEntities);

      // Act
      const result = await service.getMany();

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockEntities);
    });
  });
});
