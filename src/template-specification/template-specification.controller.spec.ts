import { Test, TestingModule } from '@nestjs/testing';
import { TemplateSpecificationController } from './template-specification.controller';
import { TemplateSpecificationService } from './template-specification.service';
import { UpdateTemplateSpecificationDto } from './dtos/template-specification.dto';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { TemplateSpecificationEntity } from './entities/template-specification.entity';
import { BadRequestException } from '@nestjs/common';
import { ActionEnum } from './enums/action.enum';
import { ClassEntity } from 'src/class/entities/class.entity';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';

describe('TemplateSpecificationController', () => {
  let controller: TemplateSpecificationController;
  let service: TemplateSpecificationService;

  // Mock data
  const mockUserPayload: UserPayload = {
    email: 'teacher@example.com',
    role: 'Teacher',
  };

  const mockClass: ClassEntity = {
    id: 'class-id-1',
    name: 'Test Class',
  } as ClassEntity;

  const mockTemplateSpecification = {
    id: 'template-spec-id-1',
    name: 'Test Template',
    action: ActionEnum.EXPORT,
    templateFile: 'path/to/template-file.docx',
    jsonFile: 'path/to/json-file.json',
    classId: 'class-id-1',
    class: mockClass,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as unknown as Date,
  } as TemplateSpecificationEntity;

  const mockUpdateDto: UpdateTemplateSpecificationDto = {
    id: 'template-spec-id-1',
    templateFile: undefined,
    jsonFile: undefined,
  };

  const mockTemplateFile: Express.Multer.File = {
    fieldname: 'templateFile',
    originalname: 'template.docx',
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from('mock template file content'),
    size: 1024,
  } as Express.Multer.File;

  const mockJsonFile: Express.Multer.File = {
    fieldname: 'jsonFile',
    originalname: 'schema.json',
    encoding: '7bit',
    mimetype: 'application/json',
    buffer: Buffer.from('{"mock": "json content"}'),
    size: 512,
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateSpecificationController],
      providers: [
        {
          provide: TemplateSpecificationService,
          useValue: {
            update: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TemplateSpecificationController>(TemplateSpecificationController);
    service = module.get<TemplateSpecificationService>(TemplateSpecificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('update', () => {
    // Scenario 1: Successfully update template specification
    it('should successfully update a template specification without files', async () => {
      // Arrange
      jest.spyOn(service, 'update').mockResolvedValueOnce(mockTemplateSpecification);
      const files = {
        jsonFile: [] as Express.Multer.File[],
        templateFile: [] as Express.Multer.File[],
      };

      // Act
      const result = await controller.update(mockUpdateDto, files, mockUserPayload);

      // Assert
      expect(service.update).toHaveBeenCalledWith(
        mockUpdateDto,
        mockUserPayload,
        undefined,
        undefined,
      );
      expect(result).toEqual(mockTemplateSpecification);
    });

    // Scenario 2: Update with new template file
    it('should successfully update a template specification with a new template file', async () => {
      // Arrange
      jest.spyOn(service, 'update').mockResolvedValueOnce({
        ...mockTemplateSpecification,
        templateFile: 'path/to/new-template-file.docx',
      } as TemplateSpecificationEntity);

      const files = {
        jsonFile: [] as Express.Multer.File[],
        templateFile: [mockTemplateFile],
      };

      // Act
      const result = await controller.update(mockUpdateDto, files, mockUserPayload);

      // Assert
      expect(service.update).toHaveBeenCalledWith(
        mockUpdateDto,
        mockUserPayload,
        mockTemplateFile,
        undefined,
      );
      expect(result.templateFile).toEqual('path/to/new-template-file.docx');
    });

    // Scenario 3: Update with new JSON file
    it('should successfully update a template specification with a new JSON file', async () => {
      // Arrange
      jest.spyOn(service, 'update').mockResolvedValueOnce({
        ...mockTemplateSpecification,
        jsonFile: 'path/to/new-json-file.json',
      } as TemplateSpecificationEntity);

      const files = {
        jsonFile: [mockJsonFile],
        templateFile: [] as Express.Multer.File[],
      };

      // Act
      const result = await controller.update(mockUpdateDto, files, mockUserPayload);

      // Assert
      expect(service.update).toHaveBeenCalledWith(
        mockUpdateDto,
        mockUserPayload,
        undefined,
        mockJsonFile,
      );
      expect(result.jsonFile).toEqual('path/to/new-json-file.json');
    });

    // Scenario 4: Update with both new files
    it('should successfully update a template specification with both new files', async () => {
      // Arrange
      jest.spyOn(service, 'update').mockResolvedValueOnce({
        ...mockTemplateSpecification,
        templateFile: 'path/to/new-template-file.docx',
        jsonFile: 'path/to/new-json-file.json',
      } as TemplateSpecificationEntity);

      const files = {
        jsonFile: [mockJsonFile],
        templateFile: [mockTemplateFile],
      };

      // Act
      const result = await controller.update(mockUpdateDto, files, mockUserPayload);

      // Assert
      expect(service.update).toHaveBeenCalledWith(
        mockUpdateDto,
        mockUserPayload,
        mockTemplateFile,
        mockJsonFile,
      );
      expect(result.templateFile).toEqual('path/to/new-template-file.docx');
      expect(result.jsonFile).toEqual('path/to/new-json-file.json');
    });

    // Scenario 5: Template specification not found
    it('should propagate BadRequestException when template specification is not found', async () => {
      // Arrange
      const errorMessage = 'Template specification not found';
      const badRequestException = new BadRequestException(errorMessage);
      jest.spyOn(service, 'update').mockRejectedValueOnce(badRequestException);

      const files = {
        jsonFile: [] as Express.Multer.File[],
        templateFile: [] as Express.Multer.File[],
      };

      // Act & Assert
      await expect(controller.update(mockUpdateDto, files, mockUserPayload)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.update).toHaveBeenCalledWith(
        mockUpdateDto,
        mockUserPayload,
        undefined,
        undefined,
      );
    });

    // Scenario 6: Failed to upload template file
    it('should propagate BadRequestException when template file upload fails', async () => {
      // Arrange
      const errorMessage = 'Failed to upload file';
      const badRequestException = new BadRequestException(errorMessage);
      jest.spyOn(service, 'update').mockRejectedValueOnce(badRequestException);

      const files = {
        jsonFile: [] as Express.Multer.File[],
        templateFile: [mockTemplateFile],
      };

      // Act & Assert
      await expect(controller.update(mockUpdateDto, files, mockUserPayload)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.update).toHaveBeenCalledWith(
        mockUpdateDto,
        mockUserPayload,
        mockTemplateFile,
        undefined,
      );
    });

    // Scenario 7: Failed to upload JSON file
    it('should propagate BadRequestException when JSON file upload fails', async () => {
      // Arrange
      const errorMessage = 'Failed to upload file';
      const badRequestException = new BadRequestException(errorMessage);
      jest.spyOn(service, 'update').mockRejectedValueOnce(badRequestException);

      const files = {
        jsonFile: [mockJsonFile],
        templateFile: [] as Express.Multer.File[],
      };

      // Act & Assert
      await expect(controller.update(mockUpdateDto, files, mockUserPayload)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.update).toHaveBeenCalledWith(
        mockUpdateDto,
        mockUserPayload,
        undefined,
        mockJsonFile,
      );
    });

    // Scenario 8: Unauthorized user update attempt
    it('should propagate BadRequestException when unauthorized user attempts to update', async () => {
      // Arrange
      const unauthorizedUserPayload: UserPayload = {
        email: 'unauthorized@example.com',
        role: 'Teacher',
      };

      const errorMessage = 'Template specification not found';
      const badRequestException = new BadRequestException(errorMessage);
      jest.spyOn(service, 'update').mockRejectedValueOnce(badRequestException);

      const files = {
        jsonFile: [] as Express.Multer.File[],
        templateFile: [] as Express.Multer.File[],
      };

      // Act & Assert
      await expect(
        controller.update(mockUpdateDto, files, unauthorizedUserPayload),
      ).rejects.toThrow(BadRequestException);
      expect(service.update).toHaveBeenCalledWith(
        mockUpdateDto,
        unauthorizedUserPayload,
        undefined,
        undefined,
      );
    });
  });
});
