import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import * as admin from 'firebase-admin';
import { Readable } from 'stream';
import { Logger } from '@nestjs/common';
import { FileMetadata } from '@google-cloud/storage';
import { getDownloadURL } from 'firebase-admin/storage';

// Mocks
jest.mock('firebase-admin/storage', () => ({
  getDownloadURL: jest.fn().mockResolvedValue('https://example.com/test.txt'),
}));

jest.mock('firebase-admin', () => {
  const mockBucket = {
    file: jest.fn().mockReturnThis(),
  };

  const storageMock = {
    bucket: jest.fn().mockReturnValue(mockBucket),
  };

  return {
    storage: jest.fn().mockReturnValue(storageMock),
  };
});

describe('StorageService', () => {
  let service: StorageService;

  // Mock data
  const mockFilePath = 'test/file.txt';
  const mockFile = {
    save: jest.fn(),
    createReadStream: jest.fn(),
    delete: jest.fn(),
    getMetadata: jest.fn(),
  };
  const mockReadStream = new Readable({
    read() {
      this.push('test data');
      this.push(null);
    },
  });
  const mockMetadata = { size: 1024, contentType: 'text/plain' } as FileMetadata;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);

    // Setup mocks
    const mockBucket = admin.storage().bucket();
    (mockBucket.file as jest.Mock).mockReturnValue(mockFile);
    mockFile.createReadStream.mockReturnValue(mockReadStream);

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadDataToFile', () => {
    it('should upload data and return result with URL', async () => {
      // Arrange
      const mockData = 'test file content';
      const mockContentType = 'text/plain';

      mockFile.save.mockResolvedValue(undefined);

      // Act
      const result = await service.uploadDataToFile(mockData, mockContentType, mockFilePath);

      // Assert
      expect(result).toEqual({
        key: mockFilePath,
        url: 'https://example.com/test.txt',
      });
    });

    it('should return undefined on error', async () => {
      // Arrange
      const mockData = 'test file content';
      const mockContentType = 'text/plain';

      mockFile.save.mockRejectedValue(new Error('Upload failed'));

      // Act
      const result = await service.uploadDataToFile(mockData, mockContentType, mockFilePath);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('downloadFile', () => {
    it('should return readable stream for the file', async () => {
      // Act
      const result = await service.downloadFile(mockFilePath);

      // Assert
      expect(result).toBe(mockReadStream);
    });

    it('should return undefined on error', async () => {
      // Arrange
      mockFile.createReadStream.mockImplementation(() => {
        throw new Error('Download failed');
      });

      // Act
      const result = await service.downloadFile(mockFilePath);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('deleteFile', () => {
    it('should delete file and return true on success', async () => {
      // Arrange
      mockFile.delete.mockResolvedValue(undefined);

      // Act
      const result = await service.deleteFile(mockFilePath);

      // Assert
      expect(mockFile.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should log error and return false on failure', async () => {
      // Arrange
      const error = new Error('Delete failed');
      mockFile.delete.mockRejectedValue(error);

      // Act
      const result = await service.deleteFile(mockFilePath);

      // Assert
      expect(Logger.error).toHaveBeenCalledWith(error, 'StorageService');
      expect(result).toBe(false);
    });
  });

  describe('getPublicURL', () => {
    it('should return public URL for the file', async () => {
      // Act
      const result = await service.getPublicURL(mockFilePath);

      // Assert
      expect(getDownloadURL).toHaveBeenCalled();
      expect(result).toBe('https://example.com/test.txt');
    });
  });

  describe('getMetadata', () => {
    it('should return file metadata on success', async () => {
      // Arrange
      mockFile.getMetadata.mockResolvedValue([mockMetadata]);

      // Act
      const result = await service.getMetadata(mockFilePath);

      // Assert
      expect(mockFile.getMetadata).toHaveBeenCalled();
      expect(result).toBe(mockMetadata);
    });

    it('should log error and return undefined on failure', async () => {
      // Arrange
      const error = new Error('Metadata fetch failed');
      mockFile.getMetadata.mockRejectedValue(error);

      // Act
      const result = await service.getMetadata(mockFilePath);

      // Assert
      expect(Logger.error).toHaveBeenCalledWith(error, 'StorageService.getMetadata');
      expect(result).toBeUndefined();
    });
  });
});
