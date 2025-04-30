import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassOnedriveInfoEntity } from '../entities/onedrive-info.entity';
import { OnedriveService } from 'src/onedrive/onedrive.service';
import { TClassOneDriveItem } from '../types/class-drive.type';
import {
  TOnedriveChildren,
  TOnedriveHierarchy,
  TOnedriveItem,
} from 'src/onedrive/types/onedrive.type';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { StudentServiceV2 } from 'src/student-v2/student-v2.service';
import { ProgressService } from 'src/progress/progress.service';
import { SyncClassDriveDataRequest } from '../dtos/class.dto';
import { BaseResponse } from 'src/base/types/response.type';
import { EProgressType } from 'src/progress/constant/progress.const';
import { ESyncDriveDataType } from '../enums/sync-data.type';
import { ThesisDocumentEnum } from 'src/thesis-management/enums/thesis-document.enum';
import {
  ImportListStudentRequest,
  ImportStudentFormDataRequestV2,
} from 'src/students/dtos/import-data.dto';

@Injectable()
export class ClassOnedriveInfoService {
  constructor(
    @InjectRepository(ClassOnedriveInfoEntity)
    private readonly classOnedriveInfoRepository: Repository<ClassOnedriveInfoEntity>,
    private readonly onedriveApiService: OnedriveService,
    private readonly studentServiceV2: StudentServiceV2,
    private readonly progressService: ProgressService,
  ) {}

  async create(classId: string, onedriveSharedLink: string): Promise<ClassOnedriveInfoEntity> {
    const existing = await this.classOnedriveInfoRepository.findOne({
      where: {
        class: {
          id: classId,
        },
      },
    });
    const folder = await this.onedriveApiService.getChildrenFromSharedLink(onedriveSharedLink);
    const newEntity = existing
      ? {
          ...existing,
          driveId: folder.parentReference.driveId,
          itemId: folder.id,
          onedriveSharedLink,
        }
      : ({
          driveId: folder.parentReference.driveId,
          itemId: folder.id,
          onedriveSharedLink,
          studentList: {
            folderInput: {},
            folderOutput: {},
          } as TClassOneDriveItem,
          assignmentSheets: {
            folderInput: {},
            folderOutput: {},
          } as TClassOneDriveItem,
          guidanceReviews: {
            folderInput: {},
            folderOutput: {},
          } as TClassOneDriveItem,
          supervisoryComments: {
            folderInput: {},
            folderOutput: {},
          } as TClassOneDriveItem,
          classId,
        } as ClassOnedriveInfoEntity);

    // Tạo cấu trúc thư mục cho từng loại
    await this.createFolderStructure(folder, newEntity.studentList, 'Student List');
    await this.createFolderStructure(folder, newEntity.assignmentSheets, 'Assignment Sheet');
    await this.createFolderStructure(folder, newEntity.guidanceReviews, 'Guidance Review');
    await this.createFolderStructure(folder, newEntity.supervisoryComments, 'Supervisory Comments');

    return await this.classOnedriveInfoRepository.save(newEntity);
  }

  private async createFolderStructure(
    parentFolder: TOnedriveChildren,
    targetItem: TClassOneDriveItem,
    folderName: string,
  ): Promise<void> {
    const mainFolder = await this.onedriveApiService.createFolderInSpecificDrive(
      parentFolder.parentReference.driveId,
      parentFolder.id,
      folderName,
    );

    if (!mainFolder?.id) return;

    targetItem.driveId = mainFolder.parentReference.driveId;
    targetItem.itemId = mainFolder.id;

    await this.createSubFolder(mainFolder, targetItem.folderOutput, 'Generate');
    await this.createSubFolder(mainFolder, targetItem.folderInput, 'Import');
  }

  private async createSubFolder(
    parentFolder: TOnedriveItem,
    targetItem: { driveId: string; itemId: string },
    folderName: string,
  ): Promise<void> {
    const folder = await this.onedriveApiService.createFolderInSpecificDrive(
      parentFolder.parentReference.driveId,
      parentFolder.id,
      folderName,
    );
    if (folder?.id) {
      targetItem.driveId = folder.parentReference.driveId;
      targetItem.itemId = folder.id;
    }
  }

  async getByClassId(classId: string, user: UserPayload): Promise<TOnedriveHierarchy> {
    const existings = await this.classOnedriveInfoRepository.findOne({
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
      return {} as TOnedriveHierarchy;
    }
    return this.onedriveApiService.listFileSharedLinkWithHierarchy(
      existings.onedriveSharedLink,
      true,
      3,
    );
  }

  private async getFileIdsHasPermission(
    onedriveSharedLink: string,
    excludeFolder: boolean = true,
  ): Promise<string[]> {
    try {
      const files = await this.onedriveApiService.listFileSharedLinkWithHierarchy(
        onedriveSharedLink,
        true,
        3,
      );
      const getAllFileIds = (file: TOnedriveHierarchy): string[] => {
        const ids = !excludeFolder ? [file.id] : !file.folder ? [file.id] : [];
        if (file.children && file.children.length > 0) {
          file.children.forEach((child) => {
            ids.push(...getAllFileIds(child));
          });
        }
        return ids;
      };

      const allIds =
        files.children?.reduce((acc: string[], file) => {
          return [...acc, ...getAllFileIds(file)];
        }, []) ?? [];

      return allIds;
    } catch (error) {
      Logger.error(
        `Error getting file IDs with permission: ${error.message}`,
        'ClassOnedriveInfoService.getFileIdsHasPermission',
      );
      return [];
    }
  }

  async uploadFiles(
    classId: string,
    files: Express.Multer.File[],
    driveId: string,
    folderId: string,
    user: UserPayload,
  ): Promise<any> {
    try {
      const existing = await this.classOnedriveInfoRepository.findOne({
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
      const fileIdsHasPermission = await this.getFileIdsHasPermission(
        existing.onedriveSharedLink,
        false,
      );
      if (!fileIdsHasPermission.includes(folderId)) {
        throw new BadRequestException('You do not have permission to upload files to this folder');
      }
      return await this.onedriveApiService.uploadMultipleFilesToSpecificDrive(
        driveId,
        folderId,
        files.map((file) => ({
          buffer: file.buffer,
          fileName: file.originalname,
        })),
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteFile(
    classId: string,
    driveId: string,
    fileId: string,
    user: UserPayload,
  ): Promise<boolean> {
    try {
      const existing = await this.classOnedriveInfoRepository.findOne({
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
      const fileIdsHasPermission = await this.getFileIdsHasPermission(
        existing.onedriveSharedLink,
        false,
      );
      if (!fileIdsHasPermission.includes(fileId)) {
        throw new BadRequestException('You do not have permission to delete this file');
      }
      await this.onedriveApiService.deleteItemInSpecificDrive(driveId, fileId);
      return true;
    } catch (error) {
      Logger.error(`Error deleting file: ${error.message}`, 'ClassDriveInfoService.deleteFile');
      throw new BadRequestException(error.message);
    }
  }

  // Cron job
  async syncClassDriveData(
    request?: SyncClassDriveDataRequest,
    user?: UserPayload,
    generateProcessId?: string,
  ): Promise<BaseResponse> {
    const processId =
      generateProcessId ?? ProgressService.generateId('sync-class-onedrive-data-cron');
    const errorCollector: Record<string, any> = {};
    try {
      Logger.log(
        'Starting sync class onedrive data',
        'ClassOnedriveInfoService.SyncClassOnedriveData',
      );

      await this.progressService.createProgress([
        {
          processId,
          type: EProgressType.ONEDRIVE_DATA,
          action: 'sync',
          createBy: user?.email ?? 'system',
          classId: request?.classIds ? request.classIds[0] : undefined,
        },
      ]);

      const existings = await this.classOnedriveInfoRepository.find({
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
        `Found ${existings.length} class onedrive info records`,
        'ClassOnedriveInfoService.SyncClassOnedriveData',
      );

      // Process each drive info
      for (const driveInfo of existings) {
        const lastSync = driveInfo.lastSync;
        const userInfo = user ?? {
          email: driveInfo.class.teacher.email,
          role: driveInfo.class.teacher.roleName,
        };

        Logger.log(
          `Processing class onedrive info for class ID: ${driveInfo.class.id}`,
          'ClassOnedriveInfoService.SyncClassOnedriveData',
        );

        // Process student list
        if (
          (!request?.types || request.types.includes(ESyncDriveDataType.STUDENT_LIST)) &&
          driveInfo.studentList?.driveId &&
          driveInfo.studentList?.itemId
        ) {
          await this.processStudentList(driveInfo, userInfo, lastSync);
        }

        // Process assignment sheets
        if (
          (!request?.types || request.types.includes(ESyncDriveDataType.ASSIGNMENT_SHEET)) &&
          driveInfo.assignmentSheets?.driveId &&
          driveInfo.assignmentSheets?.itemId
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
          driveInfo.guidanceReviews?.driveId &&
          driveInfo.guidanceReviews?.itemId
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
          driveInfo.supervisoryComments?.driveId &&
          driveInfo.supervisoryComments?.itemId
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
        await this.classOnedriveInfoRepository.save(driveInfo);
      }

      await this.progressService.makeCompleted({ processId }, { error: errorCollector });

      return {
        status: 'success',
        message: existings.length
          ? 'Sync class onedrive data successfully'
          : 'No class onedrive info found',
      };
    } catch (error) {
      Logger.error(
        `Error syncing class onedrive data: ${error.message}`,
        'ClassOnedriveInfoService.SyncClassOnedriveData',
      );
      errorCollector['unknown'] = error.message;
      await this.progressService.makeFailed(
        { processId },
        {
          error: errorCollector,
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
    driveInfo: ClassOnedriveInfoEntity,
    userInfo: UserPayload | any,
    lastSync: string,
  ): Promise<void> {
    try {
      Logger.log(
        `Processing student list for class ID: ${driveInfo.class.id}`,
        'ClassOnedriveInfoService.processStudentList',
      );

      if (
        driveInfo.studentList?.folderInput?.itemId &&
        driveInfo.studentList?.folderInput?.driveId
      ) {
        // Download input files
        const inputFiles = await this.downloadFilesFromFolder(
          driveInfo.studentList.folderInput.driveId,
          driveInfo.studentList.folderInput.itemId,
          ESyncDriveDataType.STUDENT_LIST,
          lastSync,
          true,
        );

        if (inputFiles.length > 0) {
          // Import student list
          await this.studentServiceV2.importListStudents(
            inputFiles as Express.Multer.File[],
            {
              classId: driveInfo.class.id,
            } as ImportListStudentRequest,
            userInfo,
          );

          Logger.log(
            `Successfully imported student list data`,
            'ClassOnedriveInfoService.processStudentList',
          );

          if (
            driveInfo.studentList?.folderOutput?.itemId &&
            driveInfo.studentList?.folderOutput?.driveId
          ) {
            // Generate output files (placeholder for future implementation)
            Logger.log(
              `Output folder exists for student list, but generation not implemented yet`,
              'ClassOnedriveInfoService.processStudentList',
            );
          }
        }
      }
    } catch (error) {
      Logger.error(
        `Error processing student list for class ID ${driveInfo.class.id}: ${error.message}`,
        'ClassOnedriveInfoService.processStudentList',
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
        'ClassOnedriveInfoService.processFormData',
      );

      if (
        driveInfo[propertyName]?.folderInput?.itemId &&
        driveInfo[propertyName]?.folderInput?.driveId
      ) {
        // Download input files
        const inputFiles = await this.downloadFilesFromFolder(
          driveInfo[propertyName].folderInput.driveId,
          driveInfo[propertyName].folderInput.itemId,
          syncType,
          lastSync,
          true,
        );

        if (inputFiles.length > 0) {
          // Import form data
          await this.studentServiceV2.importStudentFormData(
            inputFiles as Express.Multer.File[],
            {
              classId: driveInfo.class.id,
              thesisDocType: docType,
            } as ImportStudentFormDataRequestV2,
            userInfo,
          );

          Logger.log(
            `Successfully imported ${syncType} data`,
            'ClassOnedriveInfoService.processFormData',
          );

          if (driveInfo[propertyName]?.folderOutputId) {
            // Generate output files (placeholder for future implementation)
            Logger.log(
              `Output folder exists for ${syncType}, but generation not implemented yet`,
              'ClassOnedriveInfoService.processFormData',
            );
          }
        }
      }
    } catch (error) {
      Logger.error(
        `Error processing ${syncType} for class ID ${driveInfo.class.id}: ${error.message}`,
        'ClassOnedriveInfoService.processFormData',
      );
      // Continue with next process instead of failing the entire flow
    }
  }

  /**
   * Download files from a folder
   */
  private async downloadFilesFromFolder(
    driveId: string,
    folderId: string,
    syncType: ESyncDriveDataType,
    lastSync: string,
    fetchNewFiles: boolean = false,
  ): Promise<Partial<Express.Multer.File>[]> {
    try {
      const inputFileIds = await this.onedriveApiService.listChildrenFromSpecificDrive(
        driveId,
        folderId,
      );

      Logger.log(
        `Found ${inputFileIds.length} input files for ${syncType}`,
        'ClassOnedriveInfoService.downloadFilesFromFolder',
      );

      const filteredFileIds = inputFileIds
        .filter((file) => !file.folder)
        .filter((file) => {
          if (fetchNewFiles && lastSync) {
            return file.lastModifiedDateTime >= lastSync;
          }
          return true;
        })
        .map((file) => file.id);

      if (filteredFileIds.length === 0) {
        Logger.log(
          `No valid files found for ${syncType}`,
          'ClassOnedriveInfoService.downloadFilesFromFolder',
        );
        return [];
      }

      Logger.log(
        `Downloading ${filteredFileIds.length} files for ${syncType}`,
        'ClassOnedriveInfoService.downloadFilesFromFolder',
      );

      const inputFiles = await Promise.all(
        filteredFileIds.map((fileId) =>
          this.onedriveApiService.downloadFileFromSpecificDrive(driveId, fileId),
        ),
      );

      Logger.log(
        `Successfully downloaded ${inputFiles.length} files for ${syncType}`,
        'ClassOnedriveInfoService.downloadFilesFromFolder',
      );

      return inputFiles;
    } catch (error) {
      Logger.error(
        `Error downloading files for ${syncType}: ${error.message}`,
        'ClassOnedriveInfoService.downloadFilesFromFolder',
      );
      return [];
    }
  }
}
