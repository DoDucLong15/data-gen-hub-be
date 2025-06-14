import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TemplateSpecificationEntity } from './entities/template-specification.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { StorageService } from 'src/storage/storage.service';
import { ClassService } from 'src/class/class.service';
import {
  CreateTemplateSpecificationDto,
  DownloadDefaultTemplate,
  UpdateTemplateSpecificationDto,
} from './dtos/template-specification.dto';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { MimeType } from './constants/mime-type.const';
import { getFilePath } from './helpers/file-path.helper';
import { SystemConfigUtils } from 'src/system-configuration/utils/system-config.util';
import { ActionEnum } from './enums/action.enum';
import { DefaultTemplateSpecification } from './constants/default.const';
import { Response } from 'express';

@Injectable()
export class TemplateSpecificationService {
  constructor(
    @InjectRepository(TemplateSpecificationEntity)
    private readonly templateSpecificationRepository: Repository<TemplateSpecificationEntity>,
    private readonly storageService: StorageService,
    @Inject(forwardRef(() => ClassService))
    private readonly classService: ClassService,
  ) {}

  async create(
    request: CreateTemplateSpecificationDto,
    templateFile: Express.Multer.File,
    jsonFile: Express.Multer.File,
    user: UserPayload,
  ): Promise<TemplateSpecificationEntity> {
    if (!jsonFile || (request.action === ActionEnum.EXPORT && !templateFile)) {
      throw new BadRequestException('File is required');
    }
    const _class = await this.classService.getOne({
      where: {
        id: request.classId,
        teacher: {
          email: user.email,
        },
      },
    });
    if (!_class) {
      throw new BadRequestException('Class not found');
    }
    const templateFileUpload = await this.storageService.uploadDataToFile(
      templateFile.buffer,
      templateFile.mimetype,
      getFilePath(
        request.classId,
        request.name,
        request.action,
        'template',
        templateFile.originalname.split('.').pop()!,
      ),
    );
    if (!templateFileUpload) {
      throw new BadRequestException('Failed to upload template file');
    }
    const jsonFileUpload = await this.storageService.uploadDataToFile(
      jsonFile.buffer,
      jsonFile.mimetype,
      getFilePath(
        request.classId,
        request.name,
        request.action,
        'json',
        jsonFile.originalname.split('.').pop()!,
      ),
    );
    if (!jsonFileUpload) {
      throw new BadRequestException('Failed to upload json file');
    }

    return await this.templateSpecificationRepository.save({
      ...request,
      templateFile: templateFileUpload.key,
      jsonFile: jsonFileUpload.key,
      class: _class,
    });
  }

  async getOne(
    options: FindOneOptions<TemplateSpecificationEntity>,
  ): Promise<TemplateSpecificationEntity | null> {
    return await this.templateSpecificationRepository.findOne(options);
  }

  async getMany(
    options: FindOneOptions<TemplateSpecificationEntity>,
  ): Promise<TemplateSpecificationEntity[]> {
    return await this.templateSpecificationRepository.find(options);
  }

  async list(classId: string, user: UserPayload): Promise<TemplateSpecificationEntity[]> {
    return await this.getMany({
      where: {
        class: {
          id: classId,
          teacher: {
            email: user.email,
          },
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async delete(id: string, user: UserPayload): Promise<boolean> {
    const templateSpecification = await this.getOne({
      where: {
        id,
        class: {
          teacher: {
            email: user.email,
          },
        },
      },
    });
    if (!templateSpecification) {
      throw new BadRequestException('Template specification not found');
    }
    if (
      templateSpecification.templateFile &&
      !templateSpecification.templateFile.includes('data-gen-hub/common')
    ) {
      await this.storageService.deleteFile(templateSpecification.templateFile);
    }
    if (
      templateSpecification.jsonFile &&
      !templateSpecification.jsonFile.includes('data-gen-hub/common')
    ) {
      await this.storageService.deleteFile(templateSpecification.jsonFile);
    }
    await this.templateSpecificationRepository.delete(id);
    return true;
  }

  async update(
    request: UpdateTemplateSpecificationDto,
    user: UserPayload,
    templateFile?: Express.Multer.File,
    jsonFile?: Express.Multer.File,
  ): Promise<TemplateSpecificationEntity> {
    const templateSpecification = await this.getOne({
      where: {
        id: request.id,
        class: {
          teacher: {
            email: user.email,
          },
        },
      },
    });
    if (!templateSpecification) {
      throw new BadRequestException('Template specification not found');
    }
    if (templateFile) {
      if (
        templateSpecification.templateFile &&
        !templateSpecification.templateFile.includes('data-gen-hub/common')
      ) {
        await this.storageService.deleteFile(templateSpecification.templateFile);
      }
      const templateFileUpload = await this.storageService.uploadDataToFile(
        templateFile.buffer,
        templateFile.mimetype,
        getFilePath(
          templateSpecification.classId,
          templateSpecification.name,
          templateSpecification.action,
          'template',
          templateFile.originalname.split('.').pop()!,
        ),
      );
      if (!templateFileUpload) {
        throw new BadRequestException('Failed to upload file');
      }
      templateSpecification.templateFile = templateFileUpload.key;
    }
    if (jsonFile) {
      if (
        templateSpecification.jsonFile &&
        !templateSpecification.jsonFile.includes('data-gen-hub/common')
      ) {
        await this.storageService.deleteFile(templateSpecification.jsonFile);
      }
      const jsonFileUpload = await this.storageService.uploadDataToFile(
        jsonFile.buffer,
        jsonFile.mimetype,
        getFilePath(
          templateSpecification.classId,
          templateSpecification.name,
          templateSpecification.action,
          'json',
          jsonFile.originalname.split('.').pop()!,
        ),
      );
      if (!jsonFileUpload) {
        throw new BadRequestException('Failed to upload file');
      }
      templateSpecification.jsonFile = jsonFileUpload.key;
    }
    return await this.templateSpecificationRepository.save(templateSpecification);
  }

  async _save(entities: TemplateSpecificationEntity[]): Promise<boolean> {
    try {
      await Promise.all(
        entities.map(async (entity) => await this.templateSpecificationRepository.save(entity)),
      );
      return true;
    } catch (error) {
      Logger.error(
        `Failed to save template specifications: ${error?.message}`,
        'TemplateSpecificationService._save',
      );
      return false;
    }
  }

  async downloadDefaultTemplate(request: DownloadDefaultTemplate, res: Response): Promise<void> {
    try {
      const templateSpecification = SystemConfigUtils.defaultTemplateSpecification?.find(
        (template) => template.name === request.name && template.action === request.action,
      );
      if (!templateSpecification) {
        throw new BadRequestException('Template specification not found');
      }
      const path =
        request.action === ActionEnum.IMPORT
          ? templateSpecification.jsonFile
          : request.type === 'template'
            ? templateSpecification.templateFile
            : templateSpecification.jsonFile;
      if (!path) {
        throw new BadRequestException('File not found');
      }
      const readable = await this.storageService.downloadFile(path);
      if (readable) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${encodeURIComponent(path.split('/').pop() || `file`)}`,
        );
        readable.pipe(res);
      } else {
        res.status(400).json({
          status: 'error',
          message: 'File not found',
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: `Error download: ${error.message}`,
      });
    }
  }
}
