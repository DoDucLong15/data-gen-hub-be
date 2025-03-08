import { In, Repository } from 'typeorm';
import { GuidanceReviewEntity } from '../entities/guidance-review.entity';
import { ClassService } from 'src/class/class.service';
import { StorageService } from 'src/storage/storage.service';
import { ThesisDocumentInterface } from '../interfaces/thesis-document.interface';
import {
  CreateGuidanceReviewDto,
  DeleteFileGuidanceReviewDto,
  DeleteGuidanceReviewDto,
  DownloadFileGuidanceReviewDto,
  GetListGuidanceReviewDto,
  GetOneGuidanceReviewDto,
  UpdateGuidanceReviewDto,
} from '../dtos/guidance-review.dto';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { BadRequestException } from '@nestjs/common';
import { BaseResponse } from 'src/base/types/response.type';
import { Response } from 'express';
import { streamToBuffer } from 'src/storage/helpers/convert.helper';
const archiver = require('archiver');

export class GuidanceReviewStrategy implements ThesisDocumentInterface {
  constructor(
    private readonly repository: Repository<GuidanceReviewEntity>,
    private readonly classService: ClassService,
    private readonly storageService: StorageService,
  ) {}

  async create(request: CreateGuidanceReviewDto, user: UserPayload): Promise<GuidanceReviewEntity> {
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
    return await this.repository.save({
      ...request,
      class: _class,
    });
  }

  async update(request: UpdateGuidanceReviewDto, user: UserPayload): Promise<GuidanceReviewEntity> {
    const entity = await this.repository.findOne({
      where: {
        id: request.id,
        class: {
          teacher: {
            email: user.email,
          },
        },
      },
    });
    if (!entity) {
      throw new BadRequestException('Guidance Review not found');
    }
    return await this.repository.save({
      ...entity,
      ...request,
    });
  }

  async list(request: GetListGuidanceReviewDto): Promise<GuidanceReviewEntity[]> {
    return await this.repository.find({
      where: {
        ...(request.ids && { id: In(request.ids) }),
        class: {
          id: request.classId,
        },
      },
    });
  }

  async delete(request: DeleteGuidanceReviewDto, user: UserPayload): Promise<BaseResponse> {
    const entity = await this.repository.findOne({
      where: {
        id: request.id,
        class: {
          teacher: {
            email: user.email,
          },
        },
      },
    });
    if (!entity) {
      throw new BadRequestException('Guidance Review not found');
    }
    if (entity.inputPath) {
      await this.storageService.deleteFile(entity.inputPath);
    }
    if (entity.outputPath) {
      await this.storageService.deleteFile(entity.outputPath);
    }
    await this.repository.delete(request.id);
    return {
      status: 'success',
      message: 'Guidance Review deleted',
    };
  }

  async getOne(request: GetOneGuidanceReviewDto, user: UserPayload): Promise<GuidanceReviewEntity> {
    return (
      (await this.repository.findOne({
        where: {
          id: request.id,
          class: {
            teacher: {
              email: user.email,
            },
          },
        },
      })) || ({} as GuidanceReviewEntity)
    );
  }

  async downloadFile(
    request: DownloadFileGuidanceReviewDto,
    res: Response,
    user: UserPayload,
  ): Promise<any> {
    try {
      const entities = await this.repository.find({
        where: {
          ...(request.ids && { id: In(request.ids) }),
          class: {
            id: request.classId,
            teacher: {
              email: user.email,
            },
          },
        },
      });
      if (entities.length === 0) {
        res.status(200).json({
          status: 'success',
          message: 'No files found',
        });
      } else if (entities.length === 1) {
        const entity = entities[0];
        if (entity.outputPath) {
          const readable = await this.storageService.downloadFile(entity.outputPath);
          if (readable) {
            const buffer = await streamToBuffer(readable);
            res.setHeader(
              'Content-Disposition',
              `attachment; filename=${entity.outputPath.split('/').pop()}`,
            );
            res.setHeader(
              'Content-Type',
              `${entity.outputPath.split('/').pop()?.split('.').pop()}`,
            );
            res.send(buffer);
          } else {
            res.status(400).json({
              status: 'error',
              message: 'Have not file to download',
            });
          }
        } else {
          res.status(400).json({
            status: 'error',
            message: 'Download file from Firebase failed',
          });
        }
      } else {
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${Date.now()}.zip`);

        for (const entity of entities) {
          if (entity.outputPath) {
            const readable = await this.storageService.downloadFile(entity.outputPath);
            if (readable) {
              const buffer = await streamToBuffer(readable);
              archive.append(buffer, { name: entity.outputPath.split('/').pop() });
            }
          }
        }
        archive.finalize();
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: `Error download: ${error.message}`,
      });
    }
  }

  async deleteFile(request: DeleteFileGuidanceReviewDto, user: UserPayload): Promise<any> {
    const entities = await this.repository.find({
      where: {
        ...(request.ids && { id: In(request.ids) }),
        class: {
          id: request.classId,
          teacher: {
            email: user.email,
          },
        },
      },
    });
    await Promise.all(
      entities.map(async (entity) => {
        if (entity.outputPath) {
          await this.storageService.deleteFile(entity.outputPath);
          entity.outputPath = null;
        }
        return await this.repository.save(entity);
      }),
    );
    return {
      status: 'success',
      message: 'File deleted',
    };
  }
}
