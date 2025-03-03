import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TemplateSpecificationEntity } from './entities/template-specification.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { StorageService } from 'src/storage/storage.service';
import { ClassService } from 'src/class/class.service';
import {
  CreateTemplateSpecificationDto,
  UpdateTemplateSpecificationDto,
} from './dtos/template-specification.dto';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { MimeType } from './constants/mime-type.const';
import { getFilePath } from './helpers/file-path.helper';
import { SystemConfigUtils } from 'src/system-configuration/utils/system-config.util';

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
    file: Express.Multer.File,
    user: UserPayload,
  ): Promise<TemplateSpecificationEntity> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!MimeType[request.fileType].includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }
    const fileUpload = await this.storageService.uploadDataToFile(
      file.buffer,
      file.mimetype,
      getFilePath(file.originalname),
    );
    if (!fileUpload) {
      throw new BadRequestException('Failed to upload file');
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
    return await this.templateSpecificationRepository.save({
      ...request,
      template: {
        key: fileUpload.key,
        url: fileUpload.url,
      },
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
      !SystemConfigUtils.defaultListTemplateFilePaths ||
      !SystemConfigUtils.defaultListTemplateFilePaths.includes(templateSpecification.template.key)
    ) {
      await this.storageService.deleteFile(templateSpecification.template.key);
    }
    await this.templateSpecificationRepository.delete(id);
    return true;
  }

  async update(
    request: UpdateTemplateSpecificationDto,
    user: UserPayload,
    file?: Express.Multer.File,
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
    const newTemplate = {
      ...templateSpecification,
      ...request,
    };
    if (file) {
      if (!MimeType[newTemplate.fileType].includes(file.mimetype)) {
        throw new BadRequestException('Invalid file type');
      }
      if (
        !SystemConfigUtils.defaultListTemplateFilePaths ||
        !SystemConfigUtils.defaultListTemplateFilePaths.includes(templateSpecification.template.key)
      ) {
        await this.storageService.deleteFile(templateSpecification.template.key);
      }
      const fileUpload = await this.storageService.uploadDataToFile(
        file.buffer,
        file.mimetype,
        getFilePath(file.originalname),
      );
      if (!fileUpload) {
        throw new BadRequestException('Failed to upload file');
      }
      newTemplate.template = {
        key: fileUpload.key,
        url: fileUpload.url,
      };
    }
    return await this.templateSpecificationRepository.save(newTemplate);
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
}
