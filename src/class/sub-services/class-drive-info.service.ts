import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassDriveInfoEntity } from '../entities/drive-info.entity';
import { Repository } from 'typeorm';
import { DownloadFileFromDriveDto, SaveClassDriveInfoDto } from '../dtos/class.dto';
import { BaseResponse } from 'src/base/types/response.type';
import { DriveApisService } from 'src/drive-apis/drive-apis.service';
import { TClassDriveItem } from '../types/class-drive.type';
import { DriveItem } from 'src/drive-apis/types/drive-config.type';
import { Response } from 'express';
import { FOLDER_MIMETYPE } from 'src/drive-apis/constants/drive.constant';
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
    if (existing) {
      throw new BadRequestException('Class drive info already exists');
    }
    const folder = await this.driveApiService.getFile(driveId);
    const newEntity = {
      driveId,
      studentList: {} as TClassDriveItem,
      assignmentSheets: {} as TClassDriveItem,
      guidanceReviews: {} as TClassDriveItem,
      supervisoryComments: {} as TClassDriveItem,
      classId,
    } as ClassDriveInfoEntity;

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

  async getByClassId(classId: string): Promise<DriveItem[]> {
    const existings = await this.classDriveInfoRepository.findOne({
      where: {
        class: {
          id: classId,
        },
      },
    });
    if (!existings) {
      return [];
    }
    return await this.driveApiService.listFiles({
      driveIds: [existings.driveId],
      deps: 2,
    });
  }

  async downloadFile(classId: string, request: DownloadFileFromDriveDto, res: Response) {
    try {
      const existing = await this.classDriveInfoRepository.findOne({
        where: {
          class: {
            id: classId,
          },
        },
      });
      if (!existing) {
        return res.status(400).json({
          status: 'error',
          message: 'Class drive info not found',
        });
      }
      const fileIdsHasPermission = await this.driveApiService
        .listFiles({
          driveIds: [existing.driveId],
          deps: 2,
        })
        .then((files) => {
          const getAllFileIds = (file: DriveItem): string[] => {
            const ids = file.mimeType !== FOLDER_MIMETYPE ? [file.id] : [];
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
        });
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
}
