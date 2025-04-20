import { In, Repository } from 'typeorm';
import { AssignmentSheetsEntity } from '../entities/assignment-sheet.entity';
import { ThesisDocumentInterface } from '../interfaces/thesis-document.interface';
import {
  CreateAssignmentSheetDto,
  DeleteAssignmentSheetDto,
  DeleteFileAssignmentSheetDto,
  DownloadFileAssignmentSheetDto,
  GetListAssignmentSheetDto,
  GetOneAssignmentSheetDto,
  UpdateAssignmentSheetDto,
} from '../dtos/assignment-sheet.dto';
import { ClassService } from 'src/class/class.service';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { BadRequestException } from '@nestjs/common';
import { BaseResponse } from 'src/base/types/response.type';
import { StorageService } from 'src/storage/storage.service';
import { Response } from 'express';
import { streamToBuffer } from 'src/storage/helpers/convert.helper';
const archiver = require('archiver');

export class AssignmentSheetStrategy implements ThesisDocumentInterface {
  constructor(
    private readonly repository: Repository<AssignmentSheetsEntity>,
    private readonly classService: ClassService,
    private readonly storageService: StorageService,
  ) {}

  async create(
    request: CreateAssignmentSheetDto,
    user: UserPayload,
  ): Promise<AssignmentSheetsEntity> {
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

  async update(
    request: UpdateAssignmentSheetDto,
    user: UserPayload,
  ): Promise<AssignmentSheetsEntity> {
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
      throw new BadRequestException('Assignment sheet not found');
    }
    return await this.repository.save({
      ...entity,
      ...request,
    });
  }

  async list(request: GetListAssignmentSheetDto): Promise<AssignmentSheetsEntity[]> {
    return await this.repository.find({
      where: {
        ...(request.ids && { id: In(request.ids) }),
        class: {
          id: request.classId,
        },
      },
    });
  }

  async delete(request: DeleteAssignmentSheetDto, user: UserPayload): Promise<BaseResponse> {
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
      throw new BadRequestException('Assignment sheet not found');
    }
    if (entity.inputPath) {
      await this.storageService.deleteFile(entity.inputPath);
      entity.inputPath = null;
    }
    if (!entity.outputPath) {
      await this.repository.delete(request.id);
    } else {
      await this.repository.save(entity);
    }
    return {
      status: 'success',
      message: 'Assignment sheet deleted',
    };
  }

  async getOne(
    request: GetOneAssignmentSheetDto,
    user: UserPayload,
  ): Promise<AssignmentSheetsEntity> {
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
        relations: {
          class: true,
        },
      })) || ({} as AssignmentSheetsEntity)
    );
  }

  async downloadFile(
    request: DownloadFileAssignmentSheetDto,
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

  async deleteFile(request: DeleteFileAssignmentSheetDto, user: UserPayload): Promise<any> {
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
        if (entity.inputPath) {
          return await this.repository.save(entity);
        } else {
          return await this.repository.delete(entity.id);
        }
      }),
    );

    return {
      status: 'success',
      message: 'File deleted',
    };
  }
}
