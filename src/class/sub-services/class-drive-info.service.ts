import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassDriveInfoEntity } from '../entities/drive-info.entity';
import { In, Repository } from 'typeorm';
import {
  DownloadFileFromDriveDto,
  SaveClassDriveInfoDto,
  SyncClassDriveDataRequest,
} from '../dtos/class.dto';
import { BaseResponse } from 'src/base/types/response.type';
import { DriveApisService } from 'src/drive-apis/drive-apis.service';
import { TClassDriveItem } from '../types/class-drive.type';
import { DriveItem, UploadFilesResponse } from 'src/drive-apis/types/drive-config.type';
import e, { Response } from 'express';
import { FOLDER_MIMETYPE } from 'src/drive-apis/constants/drive.constant';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { StudentServiceV2 } from 'src/student-v2/student-v2.service';
import { ESyncDriveDataType } from '../enums/sync-data.type';
import {
  ImportListStudentRequest,
  ImportStudentFormDataRequestV2,
} from 'src/students/dtos/import-data.dto';
import { ThesisDocumentEnum } from 'src/thesis-management/enums/thesis-document.enum';
import { ProgressService } from 'src/progress/progress.service';
import { EProgressType } from 'src/progress/constant/progress.const';
const archiver = require('archiver');

@Injectable()
export class ClassDriveInfoService {
  constructor(
    @InjectRepository(ClassDriveInfoEntity)
    private readonly classDriveInfoRepository: Repository<ClassDriveInfoEntity>,
    private readonly driveApiService: DriveApisService,
    private readonly studentServiceV2: StudentServiceV2,
    private readonly progressService: ProgressService,
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

  // Cron job
  async syncClassDriveData(
    request?: SyncClassDriveDataRequest,
    user?: UserPayload,
    generateProcessId?: string,
  ): Promise<BaseResponse> {
    const processId = generateProcessId ?? ProgressService.generateId('sync-class-drive-data-cron');
    const errorCollector: Record<string, any> = {};
    const config: any = {};
    try {
      Logger.log('Starting sync class drive data', 'ClassDriveInfoService.SyncClassDriveData');

      await this.progressService.createProgress([
        {
          processId,
          type: EProgressType.DRIVE_DATA,
          action: 'sync',
          createBy: user?.email ?? 'system',
          classId: request?.classIds ? request.classIds[0] : undefined,
        },
      ]);

      const existings = await this.classDriveInfoRepository.find({
        where: {
          class: {
            ...(request?.classIds && {
              id: In(request.classIds),
            }),
            ...(user && {
              teacher: {
                email: user.email,
              },
            }),
          },
        },
        relations: {
          class: {
            teacher: true,
          },
        },
      });

      Logger.log(
        `Found ${existings.length} class drive info records`,
        'ClassDriveInfoService.SyncClassDriveData',
      );

      // Process each drive info
      for (const driveInfo of existings) {
        config[driveInfo.classId] = true;
        const lastSync = driveInfo.lastSync;
        const userInfo = user ?? {
          email: driveInfo.class.teacher.email,
          role: driveInfo.class.teacher.roleName,
        };

        Logger.log(
          `Processing class drive info for class ID: ${driveInfo.class.id}`,
          'ClassDriveInfoService.SyncClassDriveData',
        );

        // Process student list
        if (
          (!request?.types || request.types.includes(ESyncDriveDataType.STUDENT_LIST)) &&
          driveInfo.studentList?.driveId
        ) {
          await this.processStudentList(driveInfo, userInfo, lastSync);
        }

        // Process assignment sheets
        if (
          (!request?.types || request.types.includes(ESyncDriveDataType.ASSIGNMENT_SHEET)) &&
          driveInfo.assignmentSheets?.driveId
        ) {
          await this.processFormData(
            driveInfo,
            userInfo,
            'assignmentSheets',
            ThesisDocumentEnum.ASSIGNMENT_SHEET,
            ESyncDriveDataType.ASSIGNMENT_SHEET,
            lastSync,
          );
        }

        // Process guidance reviews
        if (
          (!request?.types || request.types.includes(ESyncDriveDataType.GUIDANCE_REVIEW)) &&
          driveInfo.guidanceReviews?.driveId
        ) {
          await this.processFormData(
            driveInfo,
            userInfo,
            'guidanceReviews',
            ThesisDocumentEnum.GUIDANCE_REVIEW,
            ESyncDriveDataType.GUIDANCE_REVIEW,
            lastSync,
          );
        }

        // Process supervisory comments
        if (
          (!request?.types || request.types.includes(ESyncDriveDataType.SUPERVISORY_COMMENTS)) &&
          driveInfo.supervisoryComments?.driveId
        ) {
          await this.processFormData(
            driveInfo,
            userInfo,
            'supervisoryComments',
            ThesisDocumentEnum.SUPERVISORY_COMMENTS,
            ESyncDriveDataType.SUPERVISORY_COMMENTS,
            lastSync,
          );
        }
        driveInfo.lastSync = new Date().toISOString();
        await this.classDriveInfoRepository.save(driveInfo);
      }

      await this.progressService.makeCompleted({ processId }, { error: errorCollector, config });

      return {
        status: 'success',
        message: existings.length
          ? 'Sync class drive data successfully'
          : 'No class drive info found',
      };
    } catch (error) {
      Logger.error(
        `Error syncing class drive data: ${error.message}`,
        'ClassDriveInfoService.SyncClassDriveData',
      );
      errorCollector['unknown'] = error.message;
      await this.progressService.makeFailed(
        { processId },
        {
          error: errorCollector,
          config,
        },
      );
      return {
        status: 'error',
        message: error.message,
      };
    }
  }

  /**
   * Process student list data
   */
  private async processStudentList(
    driveInfo: any,
    userInfo: UserPayload | any,
    lastSync: string,
  ): Promise<void> {
    try {
      Logger.log(
        `Processing student list for class ID: ${driveInfo.class.id}`,
        'ClassDriveInfoService.processStudentList',
      );

      if (driveInfo.studentList?.folderInputId) {
        // Download input files
        const inputFiles = await this.downloadFilesFromFolder(
          driveInfo.studentList.folderInputId,
          ESyncDriveDataType.STUDENT_LIST,
          lastSync,
          true,
        );

        if (inputFiles.length > 0) {
          // Import student list
          await this.studentServiceV2.importListStudents(
            inputFiles,
            {
              classId: driveInfo.class.id,
            } as ImportListStudentRequest,
            userInfo,
          );

          Logger.log(
            `Successfully imported student list data`,
            'ClassDriveInfoService.processStudentList',
          );

          if (driveInfo.studentList?.folderOutputId) {
            // Generate output files (placeholder for future implementation)
            Logger.log(
              `Output folder exists for student list, but generation not implemented yet`,
              'ClassDriveInfoService.processStudentList',
            );
          }
        }
      }
    } catch (error) {
      Logger.error(
        `Error processing student list for class ID ${driveInfo.class.id}: ${error.message}`,
        'ClassDriveInfoService.processStudentList',
      );
      // Continue with next process instead of failing the entire flow
    }
  }

  /**
   * Process form data (assignment sheets, guidance reviews, supervisory comments)
   */
  private async processFormData(
    driveInfo: any,
    userInfo: UserPayload | any,
    propertyName: string,
    docType: ThesisDocumentEnum,
    syncType: ESyncDriveDataType,
    lastSync: string,
  ): Promise<void> {
    try {
      Logger.log(
        `Processing ${syncType} for class ID: ${driveInfo.class.id}`,
        'ClassDriveInfoService.processFormData',
      );

      if (driveInfo[propertyName]?.folderInputId) {
        // Download input files
        const inputFiles = await this.downloadFilesFromFolder(
          driveInfo[propertyName].folderInputId,
          syncType,
          lastSync,
          true,
        );

        if (inputFiles.length > 0) {
          // Import form data
          await this.studentServiceV2.importStudentFormData(
            inputFiles,
            {
              classId: driveInfo.class.id,
              thesisDocType: docType,
            } as ImportStudentFormDataRequestV2,
            userInfo,
          );

          Logger.log(
            `Successfully imported ${syncType} data`,
            'ClassDriveInfoService.processFormData',
          );

          if (driveInfo[propertyName]?.folderOutputId) {
            // Generate output files (placeholder for future implementation)
            Logger.log(
              `Output folder exists for ${syncType}, but generation not implemented yet`,
              'ClassDriveInfoService.processFormData',
            );
          }
        }
      }
    } catch (error) {
      Logger.error(
        `Error processing ${syncType} for class ID ${driveInfo.class.id}: ${error.message}`,
        'ClassDriveInfoService.processFormData',
      );
      // Continue with next process instead of failing the entire flow
    }
  }

  /**
   * Download files from a folder
   */
  private async downloadFilesFromFolder(
    folderId: string,
    syncType: ESyncDriveDataType,
    lastSync: string,
    fetchNewFiles: boolean = false,
  ): Promise<Express.Multer.File[]> {
    try {
      const inputFileIds = await this.driveApiService.listFiles({
        driveIds: [folderId],
        deps: 0,
      });

      Logger.log(
        `Found ${inputFileIds.length} input files for ${syncType}`,
        'ClassDriveInfoService.downloadFilesFromFolder',
      );

      const filteredFileIds = inputFileIds
        .filter((file) => file.mimeType !== FOLDER_MIMETYPE)
        .filter((file) => {
          if (fetchNewFiles && lastSync) {
            return file.modifiedTime >= lastSync;
          }
          return true;
        })
        .map((file) => file.id);

      if (filteredFileIds.length === 0) {
        Logger.log(
          `No valid files found for ${syncType}`,
          'ClassDriveInfoService.downloadFilesFromFolder',
        );
        return [];
      }

      Logger.log(
        `Downloading ${filteredFileIds.length} files for ${syncType}`,
        'ClassDriveInfoService.downloadFilesFromFolder',
      );

      const inputFiles = await this.driveApiService.downloadFiles(filteredFileIds).then((files) =>
        files.map(
          (file) =>
            ({
              originalname: file.fileName,
              mimetype: file.mimeType,
              buffer: file.buffer,
              size: file.fileSize,
            }) as Express.Multer.File,
        ),
      );

      Logger.log(
        `Successfully downloaded ${inputFiles.length} files for ${syncType}`,
        'ClassDriveInfoService.downloadFilesFromFolder',
      );

      return inputFiles;
    } catch (error) {
      Logger.error(
        `Error downloading files for ${syncType}: ${error.message}`,
        'ClassDriveInfoService.downloadFilesFromFolder',
      );
      return [];
    }
  }
}
