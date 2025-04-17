import { Test, TestingModule } from '@nestjs/testing';
import { TemplateSpecificationService } from './template-specification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TemplateSpecificationEntity } from './entities/template-specification.entity';
import { StorageService } from '../storage/storage.service';
import { ClassService } from '../class/class.service';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { UserPayload } from '../auth/types/user-playload.type';
import { ActionEnum } from './enums/action.enum';
import { UpdateTemplateSpecificationDto } from './dtos/template-specification.dto';

describe('TemplateSpecificationService', () => {
  let service: TemplateSpecificationService;
  let repository: Repository<TemplateSpecificationEntity>;
  let storageService: StorageService;
  let classService: ClassService;

  const mockUserPayload: UserPayload = {
    email: 'test@example.com',
    role: 'teacher',
  };

  const mockTemplateSpecification = {
    id: '1',
    name: 'Test Template',
    action: ActionEnum.EXPORT,
    templateFile: 'data-gen-hub/class-123/Test Template/EXPORT/template_EXPORT.docx',
    jsonFile: 'data-gen-hub/class-123/Test Template/EXPORT/json_EXPORT.json',
    classId: 'class-123',
    class: { id: 'class-123', teacher: { email: 'test@example.com' } },
  } as TemplateSpecificationEntity;

  const mockUpdateDto = {
    id: '1',
  } as UpdateTemplateSpecificationDto;

  const mockTemplateFile = {
    buffer: Buffer.from('test template content'),
    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    originalname: 'template.docx',
  } as Express.Multer.File;

  const mockJsonFile = {
    buffer: Buffer.from('{"test": "content"}'),
    mimetype: 'application/json',
    originalname: 'config.json',
  } as Express.Multer.File;

  const mockStorageUploadResult = {
    key: 'new-file-path',
    url: 'https://storage.example.com/new-file-path',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateSpecificationService,
        {
          provide: getRepositoryToken(TemplateSpecificationEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            uploadDataToFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
        {
          provide: ClassService,
          useValue: {
            getOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TemplateSpecificationService>(TemplateSpecificationService);
    repository = module.get<Repository<TemplateSpecificationEntity>>(
      getRepositoryToken(TemplateSpecificationEntity),
    );
    storageService = module.get<StorageService>(StorageService);
    classService = module.get<ClassService>(ClassService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    // Scenario 1: Successfully update with both files
    it('should successfully update with both template and JSON files', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockTemplateSpecification);
      jest.spyOn(storageService, 'deleteFile').mockResolvedValue(true);
      jest.spyOn(storageService, 'uploadDataToFile').mockResolvedValue(mockStorageUploadResult);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockTemplateSpecification,
        templateFile: mockStorageUploadResult.key,
        jsonFile: mockStorageUploadResult.key,
      });

      // Act
      const result = await service.update(
        mockUpdateDto,
        mockUserPayload,
        mockTemplateFile,
        mockJsonFile,
      );

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockUpdateDto.id,
          class: {
            teacher: {
              email: mockUserPayload.email,
            },
          },
        },
      });
      expect(storageService.deleteFile).toHaveBeenCalledTimes(2);
      expect(storageService.uploadDataToFile).toHaveBeenCalledTimes(2);
      expect(repository.save).toHaveBeenCalledWith({
        ...mockTemplateSpecification,
        templateFile: mockStorageUploadResult.key,
        jsonFile: mockStorageUploadResult.key,
      });
      expect(result).toEqual({
        ...mockTemplateSpecification,
        templateFile: mockStorageUploadResult.key,
        jsonFile: mockStorageUploadResult.key,
      });
    });

    // Scenario 2: Successfully update with template file only
    it('should successfully update with only template file', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockTemplateSpecification);
      jest.spyOn(storageService, 'deleteFile').mockResolvedValue(true);
      jest.spyOn(storageService, 'uploadDataToFile').mockResolvedValue(mockStorageUploadResult);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockTemplateSpecification,
        templateFile: mockStorageUploadResult.key,
      });

      // Act
      const result = await service.update(mockUpdateDto, mockUserPayload, mockTemplateFile);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockUpdateDto.id,
          class: {
            teacher: {
              email: mockUserPayload.email,
            },
          },
        },
      });
      expect(storageService.deleteFile).toHaveBeenCalledTimes(1);
      expect(storageService.uploadDataToFile).toHaveBeenCalledTimes(1);
      expect(storageService.uploadDataToFile).toHaveBeenCalledWith(
        mockTemplateFile.buffer,
        mockTemplateFile.mimetype,
        expect.stringContaining(mockTemplateSpecification.classId),
      );
      expect(repository.save).toHaveBeenCalledWith({
        ...mockTemplateSpecification,
        templateFile: mockStorageUploadResult.key,
      });
      expect(result).toEqual({
        ...mockTemplateSpecification,
        templateFile: mockStorageUploadResult.key,
      });
    });

    // Scenario 3: Successfully update with JSON file only
    it('should successfully update with only JSON file', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockTemplateSpecification);
      jest.spyOn(storageService, 'deleteFile').mockResolvedValue(true);
      jest.spyOn(storageService, 'uploadDataToFile').mockResolvedValue(mockStorageUploadResult);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockTemplateSpecification,
        jsonFile: mockStorageUploadResult.key,
      });

      // Act
      const result = await service.update(mockUpdateDto, mockUserPayload, undefined, mockJsonFile);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockUpdateDto.id,
          class: {
            teacher: {
              email: mockUserPayload.email,
            },
          },
        },
      });
      expect(storageService.deleteFile).toHaveBeenCalledTimes(1);
      expect(storageService.uploadDataToFile).toHaveBeenCalledTimes(1);
      expect(storageService.uploadDataToFile).toHaveBeenCalledWith(
        mockJsonFile.buffer,
        mockJsonFile.mimetype,
        expect.stringContaining(mockTemplateSpecification.classId),
      );
      expect(repository.save).toHaveBeenCalledWith({
        ...mockTemplateSpecification,
        jsonFile: mockStorageUploadResult.key,
      });
      expect(result).toEqual({
        ...mockTemplateSpecification,
        jsonFile: mockStorageUploadResult.key,
      });
    });

    // Scenario 4: Successfully update without files
    it('should successfully update without any files', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockTemplateSpecification);
      jest.spyOn(repository, 'save').mockResolvedValue(mockTemplateSpecification);

      // Act
      const result = await service.update(mockUpdateDto, mockUserPayload);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockUpdateDto.id,
          class: {
            teacher: {
              email: mockUserPayload.email,
            },
          },
        },
      });
      expect(storageService.deleteFile).not.toHaveBeenCalled();
      expect(storageService.uploadDataToFile).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(mockTemplateSpecification);
      expect(result).toEqual(mockTemplateSpecification);
    });

    // Scenario 5: Throw error when specification not found
    it('should throw BadRequestException when template specification not found', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(mockUpdateDto, mockUserPayload)).rejects.toThrow(
        new BadRequestException('Template specification not found'),
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockUpdateDto.id,
          class: {
            teacher: {
              email: mockUserPayload.email,
            },
          },
        },
      });
      expect(storageService.deleteFile).not.toHaveBeenCalled();
      expect(storageService.uploadDataToFile).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    // Scenario 6: Handle common file deletion
    it('should not delete files that include "data-gen-hub/common"', async () => {
      // Arrange
      const commonPathSpec = {
        ...mockTemplateSpecification,
        templateFile: 'data-gen-hub/common/templates/template.docx',
        jsonFile: 'data-gen-hub/common/json/config.json',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(commonPathSpec);
      jest.spyOn(storageService, 'uploadDataToFile').mockResolvedValue(mockStorageUploadResult);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...commonPathSpec,
        templateFile: mockStorageUploadResult.key,
        jsonFile: mockStorageUploadResult.key,
      });

      // Act
      await service.update(mockUpdateDto, mockUserPayload, mockTemplateFile, mockJsonFile);

      // Assert
      expect(repository.findOne).toHaveBeenCalled();
      expect(storageService.deleteFile).not.toHaveBeenCalled();
      expect(storageService.uploadDataToFile).toHaveBeenCalledTimes(2);
      expect(repository.save).toHaveBeenCalled();
    });

    // Scenario 7: Handle upload failure
    it('should throw BadRequestException when file upload fails', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockTemplateSpecification);
      jest.spyOn(storageService, 'deleteFile').mockResolvedValue(true);
      jest.spyOn(storageService, 'uploadDataToFile').mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        service.update(mockUpdateDto, mockUserPayload, mockTemplateFile),
      ).rejects.toThrow(new BadRequestException('Failed to upload file'));

      expect(repository.findOne).toHaveBeenCalled();
      expect(storageService.deleteFile).toHaveBeenCalled();
      expect(storageService.uploadDataToFile).toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
