import { Test, TestingModule } from '@nestjs/testing';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { Readable } from 'stream';
import { Response } from 'express';
import { DownloadFilesDto } from './dtos/storage.dto';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';

jest.mock('./helpers/convert.helper', () => ({
  streamToBuffer: jest.fn().mockResolvedValue(Buffer.from('test data')),
}));

const archiverMock = {
  pipe: jest.fn().mockReturnThis(),
  append: jest.fn().mockReturnThis(),
  finalize: jest.fn(),
};

jest.mock('archiver', () => jest.fn().mockImplementation(() => archiverMock));

describe('StorageController', () => {
  let controller: StorageController;
  let service: StorageService;

  const mockReadStream = new Readable({
    read() {
      this.push('test data');
      this.push(null);
    },
  });

  // Create mock response object with functionalities needed for testing
  const createMockResponse = () => {
    const res: any = {};
    res.header = jest.fn().mockImplementation(() => res);
    res.setHeader = jest.fn().mockImplementation(() => res);
    res.status = jest.fn().mockImplementation(() => res);
    res.json = jest.fn().mockImplementation(() => res);
    res.pipe = jest.fn();
    return res as Response;
  };

  let mockResponse: Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageService,
          useValue: {
            downloadFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
        {
          provide: AccessTokenGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        {
          provide: PoliciesGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<StorageController>(StorageController);
    service = module.get<StorageService>(StorageService);
    mockResponse = createMockResponse();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('downloadFiles', () => {
    it('should download multiple files as a zip archive', async () => {
      // Arrange
      const dto: DownloadFilesDto = { paths: ['file1.txt', 'file2.txt'] };
      jest.spyOn(service, 'downloadFile').mockResolvedValue(mockReadStream);

      // Act
      await controller.downloadFiles(dto, mockResponse);

      // Assert
      expect(mockResponse.header).toHaveBeenCalledWith('Content-Type', 'application/zip');
      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename='),
      );
      expect(service.downloadFile).toHaveBeenCalledTimes(dto.paths.length);
      expect(archiverMock.pipe).toHaveBeenCalledWith(mockResponse);
      expect(archiverMock.append).toHaveBeenCalledTimes(dto.paths.length);
      expect(archiverMock.finalize).toHaveBeenCalled();
    });
  });

  describe('deleteFiles', () => {
    it('should delete multiple files and return success', async () => {
      // Arrange
      const dto: DownloadFilesDto = { paths: ['file1.txt', 'file2.txt'] };
      jest.spyOn(service, 'deleteFile').mockResolvedValue(true);

      // Act
      const result = await controller.deleteFiles(dto);

      // Assert
      expect(service.deleteFile).toHaveBeenCalledTimes(dto.paths.length);
      expect(result).toEqual({
        status: 'success',
        message: 'Delete files successfully',
      });
    });
  });

  describe('downloadFile', () => {
    it('should download a single file', async () => {
      // Arrange
      const path = 'test/file.txt';
      jest.spyOn(service, 'downloadFile').mockResolvedValue(mockReadStream);
      mockReadStream.pipe = jest.fn();

      // Act
      await controller.downloadFile(path, mockResponse);

      // Assert
      expect(service.downloadFile).toHaveBeenCalledWith(path);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/octet-stream',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename='),
      );
      expect(mockReadStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('should return error when file not found', async () => {
      // Arrange
      const path = 'nonexistent/file.txt';
      jest.spyOn(service, 'downloadFile').mockResolvedValue(undefined);

      // Act
      await controller.downloadFile(path, mockResponse);

      // Assert
      expect(service.downloadFile).toHaveBeenCalledWith(path);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'File not found',
      });
    });

    it('should handle download errors', async () => {
      // Arrange
      const path = 'error/file.txt';
      const error = new Error('Download error');
      jest.spyOn(service, 'downloadFile').mockRejectedValue(error);

      // Act
      await controller.downloadFile(path, mockResponse);

      // Assert
      expect(service.downloadFile).toHaveBeenCalledWith(path);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: `Error download: ${error.message}`,
      });
    });
  });
});
