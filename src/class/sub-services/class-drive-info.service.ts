import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassDriveInfoEntity } from '../entities/drive-info.entity';
import { Repository } from 'typeorm';
import { DownloadFileFromDriveDto, SaveClassDriveInfoDto } from '../dtos/class.dto';
import { BaseResponse } from 'src/base/types/response.type';
import { DriveApisService } from 'src/drive-apis/drive-apis.service';
import { TClassDriveItem } from '../types/class-drive.type';
import { DriveItem, UploadFilesResponse } from 'src/drive-apis/types/drive-config.type';
import e, { Response } from 'express';
import { FOLDER_MIMETYPE } from 'src/drive-apis/constants/drive.constant';
import { UserPayload } from 'src/auth/types/user-playload.type';
const archiver = require('archiver');

@Injectable()
export class ClassDriveInfoService {
  constructor(
    @InjectRepository(ClassDriveInfoEntity)
    private readonly classDriveInfoRepository: Repository<ClassDriveInfoEntity>,
    private readonly driveApiService: DriveApisService,
  ) {}

  async create(classId: string, driveId: string): Promise<ClassDriveInfoEntity> {
    const existing = await this.classDriveInfoRepository.findOne({
      where: {
        class: {
          id: classId,
        },
      },
    });
    const folder = await this.driveApiService.getFile(driveId);
    const newEntity = existing
      ? {
          ...existing,
          driveId,
        }
      : ({
          driveId,
          studentList: {} as TClassDriveItem,
          assignmentSheets: {} as TClassDriveItem,
          guidanceReviews: {} as TClassDriveItem,
          supervisoryComments: {} as TClassDriveItem,
          classId,
        } as ClassDriveInfoEntity);

    // Create folder student list
    const studentListFolder = await this.driveApiService.createFolder('Student List', folder.id);
    if (studentListFolder?.id) {
      newEntity.studentList.driveId = studentListFolder.id;
      const studentListOutputFolder = await this.driveApiService.createFolder(
        'Generate',
        studentListFolder.id,
      );
      if (studentListOutputFolder?.id) {
        newEntity.studentList.folderOutputId = studentListOutputFolder.id;
      }
      const studentListInputFolder = await this.driveApiService.createFolder(
        'Import',
        studentListFolder.id,
      );
      if (studentListInputFolder?.id) {
        newEntity.studentList.folderInputId = studentListInputFolder.id;
      }
    }

    // Create folder assignment sheet
    const assignmentSheetFolder = await this.driveApiService.createFolder(
      'Assignment Sheet',
      folder.id,
    );
    if (assignmentSheetFolder?.id) {
      newEntity.assignmentSheets.driveId = assignmentSheetFolder.id;
      const assignmentSheetOutputFolder = await this.driveApiService.createFolder(
        'Generate',
        assignmentSheetFolder.id,
      );
      if (assignmentSheetOutputFolder?.id) {
        newEntity.assignmentSheets.folderOutputId = assignmentSheetOutputFolder.id;
      }
      const assignmentSheetInputFolder = await this.driveApiService.createFolder(
        'Import',
        assignmentSheetFolder.id,
      );
      if (assignmentSheetInputFolder?.id) {
        newEntity.assignmentSheets.folderInputId = assignmentSheetInputFolder.id;
      }
    }

    // Create folder guidance review
    const guidanceReviewFolder = await this.driveApiService.createFolder(
      'Guidance Review',
      folder.id,
    );
    if (guidanceReviewFolder?.id) {
      newEntity.guidanceReviews.driveId = guidanceReviewFolder.id;
      const guidanceReviewOutputFolder = await this.driveApiService.createFolder(
        'Generate',
        guidanceReviewFolder.id,
      );
      if (guidanceReviewOutputFolder?.id) {
        newEntity.guidanceReviews.folderOutputId = guidanceReviewOutputFolder.id;
      }
      const guidanceReviewInputFolder = await this.driveApiService.createFolder(
        'Import',
        guidanceReviewFolder.id,
      );
      if (guidanceReviewInputFolder?.id) {
        newEntity.guidanceReviews.folderInputId = guidanceReviewInputFolder.id;
      }
    }

    // Create folder supervisory comments
    const supervisoryCommentsFolder = await this.driveApiService.createFolder(
      'Supervisory Comments',
      folder.id,
    );
    if (supervisoryCommentsFolder?.id) {
      newEntity.supervisoryComments.driveId = supervisoryCommentsFolder.id;
      const supervisoryCommentsOutputFolder = await this.driveApiService.createFolder(
        'Generate',
        supervisoryCommentsFolder.id,
      );
      if (supervisoryCommentsOutputFolder?.id) {
        newEntity.supervisoryComments.folderOutputId = supervisoryCommentsOutputFolder.id;
      }
      const supervisoryCommentsInputFolder = await this.driveApiService.createFolder(
        'Import',
        supervisoryCommentsFolder.id,
      );
      if (supervisoryCommentsInputFolder?.id) {
        newEntity.supervisoryComments.folderInputId = supervisoryCommentsInputFolder.id;
      }
    }
    return await this.classDriveInfoRepository.save(newEntity);
  }

  async save(request: SaveClassDriveInfoDto): Promise<ClassDriveInfoEntity> {
    const existing = await this.classDriveInfoRepository.findOne({
      where: {
        class: {
          id: request.classId,
        },
      },
    });
    if (existing) {
      return this.classDriveInfoRepository.save({
        ...existing,
        ...request,
      });
    } else {
      return this.classDriveInfoRepository.save(request);
    }
  }

  async delete(classId: string): Promise<BaseResponse> {
    await this.classDriveInfoRepository.delete({
      class: {
        id: classId,
      },
    });
    return {
      status: 'success',
      message: 'Delete class drive info successfully',
    };
  }

  async getByClassId(classId: string, user: UserPayload): Promise<DriveItem> {
    const existings = await this.classDriveInfoRepository.findOne({
      where: {
        class: {
          id: classId,
          teacher: {
            email: user.email,
          },
        },
      },
    });
    if (!existings) {
      return {} as DriveItem;
    }
    const root = await this.driveApiService.getFile(existings.driveId);
    return {
      ...root,
      children: await this.driveApiService.listFiles({
        driveIds: [existings.driveId],
        deps: 2,
      }),
    };
  }

  private async getFileIdsHasPermission(
    driveId: string,
    excludeFolder: boolean = true,
  ): Promise<string[]> {
    try {
      const files = await this.driveApiService.listFiles({
        driveIds: [driveId],
        deps: 2,
      });
      const getAllFileIds = (file: DriveItem): string[] => {
        const ids = !excludeFolder ? [file.id] : file.mimeType !== FOLDER_MIMETYPE ? [file.id] : [];
        if (file.children && file.children.length > 0) {
          file.children.forEach((child) => {
            ids.push(...getAllFileIds(child));
          });
        }
        return ids;
      };

      const allIds = files.reduce((acc: string[], file) => {
        return [...acc, ...getAllFileIds(file)];
      }, []);

      return allIds;
    } catch (error) {
      Logger.error(
        `Error getting file IDs with permission: ${error.message}`,
        'ClassDriveInfoService.getFileIdsHasPermission',
      );
      return [];
    }
  }

  async downloadFile(
    classId: string,
    request: DownloadFileFromDriveDto,
    res: Response,
    user: UserPayload,
  ) {
    try {
      const existing = await this.classDriveInfoRepository.findOne({
        where: {
          class: {
            id: classId,
            teacher: {
              email: user.email,
            },
          },
        },
      });
      if (!existing) {
        return res.status(400).json({
          status: 'error',
          message: 'Class drive info not found',
        });
      }
      const fileIdsHasPermission = await this.getFileIdsHasPermission(existing.driveId);
      // Filter fileIds
      const fileIds = request.fileIds.filter((fileId) => {
        return fileIdsHasPermission.includes(fileId);
      });
      if (fileIds.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Not files valid',
        });
      }
      const downloadFiles = await this.driveApiService.downloadFiles(fileIds);
      // Zip files
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=${Date.now()}.zip`);

      const archive = archiver('zip', { zlib: { level: 9 } });
      downloadFiles.forEach((file) => {
        archive.append(file.buffer, { name: file.fileName });
      });
      archive.finalize();
      archive.pipe(res);
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  async uploadFiles(
    classId: string,
    files: Express.Multer.File[],
    folderId: string,
    user: UserPayload,
  ): Promise<UploadFilesResponse> {
    try {
      const existing = await this.classDriveInfoRepository.findOne({
        where: {
          class: {
            id: classId,
            teacher: {
              email: user.email,
            },
          },
        },
      });
      if (!existing) {
        throw new BadRequestException('Class drive info not found');
      }
      const fileIdsHasPermission = await this.getFileIdsHasPermission(existing.driveId, false);
      if (!fileIdsHasPermission.includes(folderId)) {
        throw new BadRequestException('You do not have permission to upload files to this folder');
      }
      return await this.driveApiService.uploadFiles(files, folderId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteFile(classId: string, fileId: string, user: UserPayload): Promise<boolean> {
    try {
      const existing = await this.classDriveInfoRepository.findOne({
        where: {
          class: {
            id: classId,
            teacher: {
              email: user.email,
            },
          },
        },
      });
      if (!existing) {
        throw new BadRequestException('Class drive info not found');
      }
      const fileIdsHasPermission = await this.getFileIdsHasPermission(existing.driveId, false);
      if (!fileIdsHasPermission.includes(fileId)) {
        throw new BadRequestException('You do not have permission to delete this file');
      }
      return await this.driveApiService.deleteFile(fileId);
    } catch (error) {
      Logger.error(`Error deleting file: ${error.message}`, 'ClassDriveInfoService.deleteFile');
      throw new BadRequestException(error.message);
    }
  }

  async createFolder(
    classId: string,
    folderName: string,
    parenFolderId: string,
    user: UserPayload,
  ) {
    try {
      const existing = await this.classDriveInfoRepository.findOne({
        where: {
          class: {
            id: classId,
            teacher: {
              email: user.email,
            },
          },
        },
      });
      if (!existing) {
        throw new BadRequestException('Class drive info not found');
      }
      const fileIdsHasPermission = await this.getFileIdsHasPermission(existing.driveId, false);
      if (!fileIdsHasPermission.includes(parenFolderId)) {
        throw new BadRequestException('You do not have permission to create folder in this folder');
      }
      return await this.driveApiService.createFolder(folderName, parenFolderId);
    } catch (error) {
      Logger.error(`Error creating folder: ${error.message}`, 'ClassDriveInfoService.createFolder');
      throw new BadRequestException(error.message);
    }
  }
}
