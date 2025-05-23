import { Test, TestingModule } from '@nestjs/testing';
import { DriveApisService } from './drive-apis.service';
import { MailerService } from 'src/mailer/mailer.service';
import { BadRequestException, Logger } from '@nestjs/common';
import { drive_v3, google } from 'googleapis';
import { GoogleAuth } from 'googleapis-common';
import { ListDriveItemsDto } from './dtos/drive.dto';
import { DriveItem, UploadFilesResponse } from './types/drive-config.type';
import { FOLDER_MIMETYPE } from './constants/drive.constant';
import { Readable } from 'stream';

// Mock the google drive API
jest.mock('googleapis', () => {
  const mockDrive = {
    files: {
      list: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    about: {
      get: jest.fn(),
    },
  };

  return {
    drive_v3: {},
    google: {
      drive: jest.fn().mockReturnValue(mockDrive),
      auth: {
        GoogleAuth: jest.fn().mockImplementation(() => ({
          getClient: jest.fn().mockResolvedValue({}),
        })),
      },
    },
  };
});

// Mock the drive.config.json
jest.mock('../../drive.config.json', () => ({
  client_email: 'test@example.com',
  private_key: 'test-private-key',
}));

describe('DriveApisService', () => {
  let service: DriveApisService;
  let mockDrive: any;
  let mockMailerService: any;

  // Mock data
  const mockFolderId1 = 'folder-id-1';
  const mockFolderId2 = 'folder-id-2';
  const mockNestedFolderId = 'nested-folder-id';

  // Mock file data for upload tests
  const mockFile1: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-file-1.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('test file content 1'),
    size: 100,
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  const mockFile2: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-file-2.docx',
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from('test file content 2'),
    size: 200,
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  const mockCreatedFile1: drive_v3.Schema$File = {
    id: 'created-file-id-1',
    name: 'test-file-1.pdf',
    mimeType: 'application/pdf',
  };

  const mockCreatedFile2: drive_v3.Schema$File = {
    id: 'created-file-id-2',
    name: 'test-file-2.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  const mockFileItem1: drive_v3.Schema$File = {
    id: 'file-id-1',
    name: 'Test File 1',
    mimeType: 'application/pdf',
    webViewLink: 'https://drive.google.com/file/d/test-file-1',
    createdTime: '2023-01-01T00:00:00.000Z',
    modifiedTime: '2023-01-01T00:00:00.000Z',
    trashed: false,
    owners: [
      {
        displayName: 'Test User',
        emailAddress: 'test@example.com',
        photoLink: 'https://example.com/photo.jpg',
      },
    ],
    hasThumbnail: false,
    size: '1000',
    imageMediaMetadata: null,
    videoMediaMetadata: null,
    thumbnailLink: '',
    originalFilename: 'original-file-1.pdf',
  };

  const mockFileItem2: drive_v3.Schema$File = {
    id: 'file-id-2',
    name: 'Test File 2',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    webViewLink: 'https://drive.google.com/file/d/test-file-2',
    createdTime: '2023-01-01T00:00:00.000Z',
    modifiedTime: '2023-01-01T00:00:00.000Z',
    trashed: false,
    owners: [
      {
        displayName: 'Test User',
        emailAddress: 'test@example.com',
        photoLink: 'https://example.com/photo.jpg',
      },
    ],
    hasThumbnail: false,
    size: '2000',
    imageMediaMetadata: null,
    videoMediaMetadata: null,
    thumbnailLink: '',
    originalFilename: 'original-file-2.docx',
  };

  const mockFolderItem: drive_v3.Schema$File = {
    id: mockNestedFolderId,
    name: 'Test Folder',
    mimeType: FOLDER_MIMETYPE,
    webViewLink: 'https://drive.google.com/file/d/test-folder',
    createdTime: '2023-01-01T00:00:00.000Z',
    modifiedTime: '2023-01-01T00:00:00.000Z',
    trashed: false,
    owners: [
      {
        displayName: 'Test User',
        emailAddress: 'test@example.com',
        photoLink: 'https://example.com/photo.jpg',
      },
    ],
    hasThumbnail: false,
    size: '0',
    imageMediaMetadata: null,
    videoMediaMetadata: null,
    thumbnailLink: '',
    originalFilename: '',
  };

  const mockNestedFileItem: drive_v3.Schema$File = {
    id: 'nested-file-id',
    name: 'Nested Test File',
    mimeType: 'application/pdf',
    webViewLink: 'https://drive.google.com/file/d/nested-test-file',
    createdTime: '2023-01-01T00:00:00.000Z',
    modifiedTime: '2023-01-01T00:00:00.000Z',
    trashed: false,
    owners: [
      {
        displayName: 'Test User',
        emailAddress: 'test@example.com',
        photoLink: 'https://example.com/photo.jpg',
      },
    ],
    hasThumbnail: false,
    size: '3000',
    imageMediaMetadata: null,
    videoMediaMetadata: null,
    thumbnailLink: '',
    originalFilename: 'nested-file.pdf',
  };

  beforeEach(async () => {
    mockMailerService = {
      sendEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriveApisService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DriveApisService>(DriveApisService);
    mockDrive = google.drive('v3');

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger, 'verbose').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteFile', () => {
    // Scenario 1: Delete file successfully
    it('should delete a file successfully', async () => {
      // Arrange
      const fileId = 'test-file-id';
      mockDrive.files.delete.mockResolvedValueOnce({});

      // Act
      const result = await service.deleteFile(fileId);

      // Assert
      expect(result).toBe(true);
      expect(mockDrive.files.delete).toHaveBeenCalledWith({
        auth: expect.any(Object),
        fileId: fileId,
      });
      expect(Logger.log).toHaveBeenCalledWith(
        expect.stringContaining(`Starting to delete file with ID ${fileId}`),
        'DriveService',
      );
      expect(Logger.log).toHaveBeenCalledWith(
        expect.stringContaining(`Successfully deleted file with ID ${fileId}`),
        'DriveService',
      );
    });

    // Scenario 2: Handle API error
    it('should throw an error when the Drive API fails', async () => {
      // Arrange
      const fileId = 'test-file-id';
      const apiError = new Error('Drive API error');
      mockDrive.files.delete.mockRejectedValueOnce(apiError);

      // Act & Assert
      await expect(service.deleteFile(fileId)).rejects.toThrow('Drive API error');
      expect(mockDrive.files.delete).toHaveBeenCalledWith({
        auth: expect.any(Object),
        fileId: fileId,
      });
      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error delete file: Drive API error'),
        'DriveService',
      );
    });

    // Scenario 3: Delete non-existent file
    it('should throw an error when deleting a non-existent file', async () => {
      // Arrange
      const fileId = 'non-existent-file-id';
      const notFoundError = new Error('File not found');
      (notFoundError as any)['status'] = 404;
      mockDrive.files.delete.mockRejectedValueOnce(notFoundError);

      // Act & Assert
      await expect(service.deleteFile(fileId)).rejects.toThrow('File not found');
      expect(mockDrive.files.delete).toHaveBeenCalledWith({
        auth: expect.any(Object),
        fileId: fileId,
      });
    });

    // Scenario 4: Delete with invalid fileId
    it('should throw an error when fileId is invalid', async () => {
      // Arrange
      const fileId = 'invalid-file-id';
      const invalidIdError = new Error('Invalid file ID');
      (invalidIdError as any)['status'] = 400;
      mockDrive.files.delete.mockRejectedValueOnce(invalidIdError);

      // Act & Assert
      await expect(service.deleteFile(fileId)).rejects.toThrow('Invalid file ID');
      expect(mockDrive.files.delete).toHaveBeenCalledWith({
        auth: expect.any(Object),
        fileId: fileId,
      });
    });
  });

  describe('listFiles', () => {
    // Scenario 1: Return empty array for empty folderIds
    it('should return empty array when folderIds is empty', async () => {
      // Arrange
      const query: ListDriveItemsDto = {
        deps: 0,
        driveIds: [],
      };

      // Act
      const result = await service.listFiles(query);

      // Assert
      expect(result).toEqual([]);
      expect(mockDrive.files.list).not.toHaveBeenCalled();
    });

    // Scenario 2: Return files from single folder
    it('should return files from a single folder', async () => {
      // Arrange
      const query: ListDriveItemsDto = {
        deps: 0,
        driveIds: [mockFolderId1],
      };

      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [mockFileItem1, mockFileItem2],
          nextPageToken: null,
        },
      });

      // Act
      const result = await service.listFiles(query);

      // Assert
      expect(result).toHaveLength(2);
      expect(mockDrive.files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: `'${mockFolderId1}' in parents`,
        }),
      );
      expect(result[0].id).toBe(mockFileItem1.id);
      expect(result[1].id).toBe(mockFileItem2.id);
    });

    // Scenario 3: Return files from multiple folders
    it('should return files from multiple folders', async () => {
      // Arrange
      const query: ListDriveItemsDto = {
        deps: 0,
        driveIds: [mockFolderId1, mockFolderId2],
      };

      mockDrive.files.list
        .mockResolvedValueOnce({
          data: {
            files: [mockFileItem1],
            nextPageToken: null,
          },
        })
        .mockResolvedValueOnce({
          data: {
            files: [mockFileItem2],
            nextPageToken: null,
          },
        });

      // Act
      const result = await service.listFiles(query);

      // Assert
      expect(result).toHaveLength(2);
      expect(mockDrive.files.list).toHaveBeenCalledTimes(2);
      expect(mockDrive.files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: `'${mockFolderId1}' in parents`,
        }),
      );
      expect(mockDrive.files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: `'${mockFolderId2}' in parents`,
        }),
      );
      expect(result[0].id).toBe(mockFileItem1.id);
      expect(result[1].id).toBe(mockFileItem2.id);
    });

    // Scenario 4: Handle recursive folder listing
    it('should recursively list files in nested folders when deps > 0', async () => {
      // Arrange
      const query: ListDriveItemsDto = {
        deps: 1,
        driveIds: [mockFolderId1],
      };

      // First call returns a file and a folder
      mockDrive.files.list
        .mockResolvedValueOnce({
          data: {
            files: [mockFileItem1, mockFolderItem],
            nextPageToken: null,
          },
        })
        // Second call (for nested folder) returns a nested file
        .mockResolvedValueOnce({
          data: {
            files: [mockNestedFileItem],
            nextPageToken: null,
          },
        });

      // Act
      const result = await service.listFiles(query);

      // Assert
      expect(result).toHaveLength(2);
      expect(mockDrive.files.list).toHaveBeenCalledTimes(2);

      // Check first level items
      expect(result[0].id).toBe(mockFileItem1.id);
      expect(result[1].id).toBe(mockFolderItem.id);

      // Check nested items
      expect(result[1].children).toBeDefined();
      expect(result[1].children).toHaveLength(1);
      expect(result[1].children?.[0]?.id).toBe(mockNestedFileItem.id);
    });

    // Scenario 5: Handle API errors gracefully
    it('should throw an error when the Drive API fails', async () => {
      // Arrange
      const query: ListDriveItemsDto = {
        deps: 0,
        driveIds: [mockFolderId1],
      };

      const apiError = new Error('Drive API error');
      mockDrive.files.list.mockRejectedValueOnce(apiError);

      // Act & Assert
      await expect(service.listFiles(query)).rejects.toThrow();
    });

    // Scenario 6: Handle invalid folder IDs
    it('should handle invalid folder IDs by returning empty results for those folders', async () => {
      // Arrange
      const query: ListDriveItemsDto = {
        deps: 0,
        driveIds: [mockFolderId1, 'invalid-folder-id'],
      };

      mockDrive.files.list
        .mockResolvedValueOnce({
          data: {
            files: [mockFileItem1],
            nextPageToken: null,
          },
        })
        .mockResolvedValueOnce({
          data: {
            files: [], // Empty result for invalid folder
            nextPageToken: null,
          },
        });

      // Act
      const result = await service.listFiles(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockDrive.files.list).toHaveBeenCalledTimes(2);
      expect(result[0].id).toBe(mockFileItem1.id);
    });
  });

  describe('uploadFiles', () => {
    // Scenario 1: Upload files successfully
    it('should upload a file successfully', async () => {
      // Arrange
      const files = [mockFile1];
      const folderId = mockFolderId1;

      // Mock the list call to return no existing files
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [],
        },
      });

      // Mock the create call to return a successful response
      mockDrive.files.create.mockResolvedValueOnce({
        data: mockCreatedFile1,
      });

      // Act
      const result = await service.uploadFiles(files, folderId);

      // Assert
      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
      expect(result.success[0]).toEqual(mockCreatedFile1);

      // Verify the create call was made with correct parameters
      expect(mockDrive.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: {
            name: 'test-file-1.pdf',
            mimeType: 'application/pdf',
            parents: [folderId],
          },
          media: expect.objectContaining({
            mimeType: 'application/pdf',
            body: expect.any(Readable),
          }),
          fields: '*',
        }),
      );
    });

    // Scenario 2: Handle duplicate filenames
    it('should handle duplicate filenames', async () => {
      // Arrange
      const files = [mockFile1];
      const folderId = mockFolderId1;

      // Mock the list call to return an existing file with the same name
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [{ name: 'test-file-1.pdf' }],
        },
      });

      // Act
      const result = await service.uploadFiles(files, folderId);

      // Assert
      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].name).toBe('test-file-1.pdf');
      expect(result.failed[0].error).toContain('already exists');

      // Verify the create call was not made
      expect(mockDrive.files.create).not.toHaveBeenCalled();
    });

    // Scenario 3: Handle API errors
    it('should handle API errors during file upload', async () => {
      // Arrange
      const files = [mockFile1];
      const folderId = mockFolderId1;
      const apiError = new Error('Drive API error');

      // Mock the list call to return no existing files
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [],
        },
      });

      // Mock the create call to throw an error
      mockDrive.files.create.mockRejectedValueOnce(apiError);

      // Act
      const result = await service.uploadFiles(files, folderId);

      // Assert
      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].name).toBe('test-file-1.pdf');
      expect(result.failed[0].error).toBe('Drive API error');
      expect(mockDrive.files.create).toHaveBeenCalledTimes(1);
    });

    // Scenario 4: Upload multiple files
    it('should upload multiple files successfully', async () => {
      // Arrange
      const files = [mockFile1, mockFile2];
      const folderId = mockFolderId1;

      // Mock the list call to return no existing files
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [],
        },
      });

      // Mock the create calls to return successful responses
      mockDrive.files.create
        .mockResolvedValueOnce({
          data: mockCreatedFile1,
        })
        .mockResolvedValueOnce({
          data: mockCreatedFile2,
        });

      // Act
      const result = await service.uploadFiles(files, folderId);

      // Assert
      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.success[0]).toEqual(mockCreatedFile1);
      expect(result.success[1]).toEqual(mockCreatedFile2);

      // Verify the create calls were made with correct parameters
      expect(mockDrive.files.create).toHaveBeenCalledTimes(2);
      expect(mockDrive.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: {
            name: 'test-file-1.pdf',
            mimeType: 'application/pdf',
            parents: [folderId],
          },
        }),
      );
      expect(mockDrive.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: {
            name: 'test-file-2.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            parents: [folderId],
          },
        }),
      );
    });

    // Scenario 5: Handle empty files array
    it('should handle empty files array', async () => {
      // Arrange
      const files: Express.Multer.File[] = [];
      const folderId = mockFolderId1;

      // Mock the list call
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [],
        },
      });

      // Act
      const result = await service.uploadFiles(files, folderId);

      // Assert
      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
      expect(mockDrive.files.create).not.toHaveBeenCalled();
    });

    // Scenario 6: Handle error in the initial list call
    it('should throw an error when the initial list call fails', async () => {
      // Arrange
      const files = [mockFile1];
      const folderId = mockFolderId1;
      const apiError = new Error('Drive API error in list');

      // Mock the list call to throw an error
      mockDrive.files.list.mockRejectedValueOnce(apiError);

      // Act & Assert
      await expect(service.uploadFiles(files, folderId)).rejects.toThrow('Drive API error in list');
      expect(mockDrive.files.create).not.toHaveBeenCalled();
    });

    // Scenario 7: Partial success with some failures
    it('should handle partial success with some failures', async () => {
      // Arrange
      const files = [mockFile1, mockFile2];
      const folderId = mockFolderId1;

      // Mock the list call to return an existing file with the same name as mockFile2
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [{ name: 'test-file-2.docx' }],
        },
      });

      // Mock the create call for the first file to succeed
      mockDrive.files.create.mockResolvedValueOnce({
        data: mockCreatedFile1,
      });

      // Act
      const result = await service.uploadFiles(files, folderId);

      // Assert
      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.success[0]).toEqual(mockCreatedFile1);
      expect(result.failed[0].name).toBe('test-file-2.docx');
      expect(result.failed[0].error).toContain('already exists');

      // Verify only one create call was made
      expect(mockDrive.files.create).toHaveBeenCalledTimes(1);
      expect(mockDrive.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: {
            name: 'test-file-1.pdf',
            mimeType: 'application/pdf',
            parents: [folderId],
          },
        }),
      );
    });
  });

  describe('downloadFile', () => {
    const mockFileId = 'test-file-id';
    const mockFileName = 'test-file.pdf';
    const mockMimeType = 'application/pdf';
    const mockFileSize = 1024;
    const mockFileContent = Buffer.from('test file content');

    // Scenario 1: Download file successfully
    it('should download a file successfully', async () => {
      // Arrange
      mockDrive.files.get
        // First call for metadata
        .mockResolvedValueOnce({
          data: {
            id: mockFileId,
            name: mockFileName,
            mimeType: mockMimeType,
            size: mockFileSize.toString(),
          },
        })
        // Second call for content
        .mockResolvedValueOnce({
          data: mockFileContent,
        });

      // Act
      const result = await service.downloadFile(mockFileId);

      // Assert
      expect(result).toBeDefined();
      expect(result.fileName).toBe(mockFileName);
      expect(result.mimeType).toBe(mockMimeType);
      expect(result.fileSize).toBe(mockFileContent.length);
      expect(result.buffer).toEqual(mockFileContent);

      // Verify the get calls were made with correct parameters
      expect(mockDrive.files.get).toHaveBeenCalledTimes(2);
      expect(mockDrive.files.get).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          fileId: mockFileId,
          fields: 'name,mimeType,size',
        }),
      );
      expect(mockDrive.files.get).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          fileId: mockFileId,
          alt: 'media',
        }),
        expect.objectContaining({
          responseType: 'arraybuffer',
        }),
      );
    });

    // Scenario 2: Handle file not found
    it('should throw an error when file is not found', async () => {
      // Arrange
      const notFoundError = new Error('File not found');
      (notFoundError as any).response = { status: 404 };
      mockDrive.files.get.mockRejectedValueOnce(notFoundError);

      // Act & Assert
      await expect(service.downloadFile(mockFileId)).rejects.toThrow();
      expect(mockDrive.files.get).toHaveBeenCalledTimes(1);
      expect(Logger.error).toHaveBeenCalled();
    });

    // Scenario 3: Handle API errors
    it('should throw an error when the Drive API fails', async () => {
      // Arrange
      const apiError = new Error('Drive API error');
      mockDrive.files.get.mockRejectedValueOnce(apiError);

      // Act & Assert
      await expect(service.downloadFile(mockFileId)).rejects.toThrow();
      expect(mockDrive.files.get).toHaveBeenCalledTimes(1);
      expect(Logger.error).toHaveBeenCalled();
    });

    // Scenario 4: Verify file metadata extraction
    it('should correctly extract and return file metadata', async () => {
      // Arrange
      const customMetadata = {
        id: mockFileId,
        name: 'custom-file.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: '2048',
      };

      mockDrive.files.get
        // First call for metadata
        .mockResolvedValueOnce({
          data: customMetadata,
        })
        // Second call for content
        .mockResolvedValueOnce({
          data: mockFileContent,
        });

      // Act
      const result = await service.downloadFile(mockFileId);

      // Assert
      expect(result).toBeDefined();
      expect(result.fileName).toBe(customMetadata.name);
      expect(result.mimeType).toBe(customMetadata.mimeType);
      expect(result.fileSize).toBe(mockFileContent.length);
      expect(result.buffer).toEqual(mockFileContent);
    });

    // Scenario 5: Handle empty file content
    it('should handle empty file content', async () => {
      // Arrange
      const emptyContent = Buffer.from('');

      mockDrive.files.get
        // First call for metadata
        .mockResolvedValueOnce({
          data: {
            id: mockFileId,
            name: mockFileName,
            mimeType: mockMimeType,
            size: '0',
          },
        })
        // Second call for content
        .mockResolvedValueOnce({
          data: emptyContent,
        });

      // Act
      const result = await service.downloadFile(mockFileId);

      // Assert
      expect(result).toBeDefined();
      expect(result.fileName).toBe(mockFileName);
      expect(result.mimeType).toBe(mockMimeType);
      expect(result.fileSize).toBe(0);
      expect(result.buffer).toEqual(emptyContent);
    });
  });
});
