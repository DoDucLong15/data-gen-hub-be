import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { drive_v3, google } from 'googleapis';
import { DRIVE_SCOPES, DRIVE_VERSION, FOLDER_MIMETYPE } from './constants/drive.constant';
import * as driveConfig from '../../drive.config.json';
import { GaxiosPromise, GoogleAuth } from 'googleapis-common';
import { DriveItem, TDriveConnectorConfig, UploadFilesResponse } from './types/drive-config.type';
import { ListDriveItemsDto } from './dtos/drive.dto';
import { MailerService } from 'src/mailer/mailer.service';
import { SystemConfigUtils } from 'src/system-configuration/utils/system-config.util';
import { Readable } from 'stream';

@Injectable()
export class DriveApisService {
  private drive: drive_v3.Drive;
  constructor(private readonly mailerService: MailerService) {
    this.drive = google.drive(DRIVE_VERSION);
  }

  private getDriveConnector(): TDriveConnectorConfig {
    if (!driveConfig.client_email || !driveConfig.private_key) {
      throw new Error('Drive configuration not found');
    }
    return driveConfig as TDriveConnectorConfig;
  }

  private getAuth(): GoogleAuth {
    const { client_email, private_key } = this.getDriveConnector();
    return new google.auth.GoogleAuth({
      credentials: { client_email, private_key },
      scopes: DRIVE_SCOPES,
    });
  }

  async healthCheck() {
    try {
      Logger.verbose('Start health check drive', 'DriveApisService.healthCheck');
      const auth = this.getAuth();
      return await this.drive.about.get({ auth, fields: '*' });
    } catch (error) {
      Logger.error(error, 'DriveApisService.healthCheck');
      if (SystemConfigUtils.adminEmails?.length) {
        await this.mailerService.sendEmail({
          to: SystemConfigUtils.adminEmails.join(','),
          subject: 'Health check drive failed',
          content: `Health check drive failed: ${error.message}`,
        });
      }
      throw error;
    } finally {
      Logger.verbose('End health check drive', 'DriveApisService.healthCheck');
    }
  }

  private transformDriveItem(item: drive_v3.Schema$File): DriveItem {
    return {
      id: item.id,
      mimeType: item.mimeType,
      name: item.name,
      owners: item.owners?.map((owner) => ({
        displayName: owner.displayName,
        emailAddress: owner.emailAddress,
        photoLink: owner.photoLink,
      })),
      originalFilename: item.originalFilename,
      hasThumbnail: item.hasThumbnail,
      thumbnailLink: item.thumbnailLink,
      webViewLink: item.webViewLink,
      createdTime: item.createdTime,
      modifiedTime: item.modifiedTime,
      size: item.size,
      imageMediaMetadata: item.imageMediaMetadata,
      videoMediaMetadata: this.convertVideoMediaMetadata(
        item.mimeType as string,
        item.name as string,
        item.videoMediaMetadata,
      ),
      trashed: item.trashed ?? false,
    } as DriveItem;
  }

  private convertVideoMediaMetadata(
    mineType: string,
    videoName: string,
    originalMetadata: drive_v3.Schema$File['videoMediaMetadata'],
  ): DriveItem['videoMediaMetadata'] {
    if (originalMetadata && mineType.startsWith('video/')) {
      if (videoName.toLowerCase().includes('doc')) {
        return {
          ...originalMetadata,
          width: originalMetadata.height,
          height: originalMetadata.width,
        };
      } else if (/_\d+x\d+_/.test(videoName.toLowerCase())) {
        const match = videoName.toLowerCase().match(/_(\d+)x(\d+)_/); // eg: _1920x1080_
        if (match && match.length >= 3) {
          return { ...originalMetadata, width: +match[1], height: +match[2] };
        }
      }
    }
    return originalMetadata;
  }

  private async listFilesFromDriveAsync(
    deps: number,
    _folderId?: string,
    _auth?: GoogleAuth,
  ): Promise<DriveItem[]> {
    if (deps < -1) return [];

    let auth = _auth;
    const folderId = _folderId;

    if (!auth || !folderId) {
      const googleAuth = this.getAuth();
      auth = googleAuth;
    }

    const files: drive_v3.Schema$File[] = [];
    let pageToken = null;
    do {
      const fileListSchema: any = await this.drive.files.list({
        auth,
        q: `'${folderId}' in parents`,
        fields:
          'files(id, mimeType, name, originalFilename, owners, hasThumbnail, thumbnailLink, webViewLink, createdTime, modifiedTime, imageMediaMetadata, videoMediaMetadata, size)',
        orderBy: 'modifiedTime desc',
        pageToken,
      });
      if (!fileListSchema.data.files) {
        throw new InternalServerErrorException('Cannot list files in drive');
      }
      fileListSchema.data.files.forEach((file: any) => files.push(file));
      pageToken = fileListSchema.data.nextPageToken;
    } while (pageToken);

    const resultPromises = files.map(async (item: any) => {
      const driveItem: DriveItem = {
        ...this.transformDriveItem(item),
        children:
          deps !== 0 && item.mimeType === FOLDER_MIMETYPE
            ? await this.listFilesFromDriveAsync(deps === -1 ? -1 : deps - 1, item.id, auth)
            : undefined,
      };
      return driveItem;
    });

    return Promise.all(resultPromises);
  }

  async listFiles(query: ListDriveItemsDto): Promise<DriveItem[]> {
    const { deps, driveIds: folderIds } = query;
    if (!folderIds || folderIds.length === 0) return [];
    const listFiles: (deps: number, folderId?: string, _auth?: GoogleAuth) => Promise<DriveItem[]> =
      this.listFilesFromDriveAsync.bind(this);

    if (folderIds.length === 0) {
      return listFiles(deps);
    }
    const responses = await Promise.all(folderIds.map((id) => listFiles(deps, id)));
    return responses.flat();
  }

  async getFile(fileId: string, _auth?: GoogleAuth): Promise<DriveItem> {
    try {
      Logger.verbose(`Start get file ${fileId}`, 'DriveApisService.getFile');
      const auth = _auth ?? this.getAuth();
      const res = await this.drive.files.get({ auth, fileId, fields: '*' });
      return this.transformDriveItem(res.data) as DriveItem;
    } catch (e) {
      Logger.error(`${JSON.stringify(e.errors)}`, `DriveApisService.getFile`);
      throw e;
    } finally {
      Logger.verbose(`End get file ${fileId}`, 'DriveApisService.getFile');
    }
  }

  async uploadFiles(files: Express.Multer.File[], folderId: string): Promise<UploadFilesResponse> {
    try {
      Logger.verbose('Start upload files', 'DriveApisService.uploadFiles');
      const auth = this.getAuth();
      const {
        data: { files: existingFiles },
      } = await this.drive.files.list({
        auth,
        q: `'${folderId}' in parents and mimeType != '${FOLDER_MIMETYPE}'`,
        fields: 'files(name)',
      });

      const filenameSet = new Set(existingFiles?.map((f) => f.name));
      const result: UploadFilesResponse = { success: [], failed: [] };

      const promises = files.map(async (file) => {
        // Create stream data to upload
        const stream = new Readable();
        stream.push(file.buffer);
        stream.push(null);

        const fileName = file.originalname.replace(/\s/g, '_');
        try {
          // Check duplicate filename
          if (filenameSet.has(fileName)) {
            throw new BadRequestException(`File name "${fileName}" already exists.`);
          }

          // Handle upload file
          const res = await this.drive.files.create({
            auth,
            requestBody: { name: fileName, mimeType: file.mimetype, parents: [folderId] },
            media: { mimeType: file.mimetype, body: stream },
            fields: '*',
          });
          result.success.push(res.data);
        } catch (error) {
          Logger.error(JSON.stringify(error), 'DriveApisService.uploadFiles');
          result.failed.push({ name: fileName, mineType: file.mimetype, error: error?.message });
        }
      });
      await Promise.all(promises);
      return result;
    } catch (error) {
      Logger.error(JSON.stringify(error), 'DriveApisService.uploadFiles');
      throw error;
    } finally {
      Logger.verbose('End upload files', 'DriveApisService.uploadFiles');
    }
  }

  async downloadFile(fileId: string): Promise<{
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      Logger.log(`Starting to download file with ID ${fileId}`, 'DriveApisService.downloadFile');
      const auth = this.getAuth();
      // Lấy thông tin file từ Google Drive
      const fileMetadata = await this.drive.files.get({
        auth,
        fileId,
        fields: 'name,mimeType,size',
      });
      if (!fileMetadata.data || !fileMetadata.data.name) {
        throw new Error(`File with ID ${fileId} not found or metadata is incomplete`);
      }

      const fileName = fileMetadata.data.name;
      const mimeType = fileMetadata.data.mimeType || 'application/octet-stream';
      const fileSize = parseInt(fileMetadata.data.size || '0', 10);

      Logger.log(`Getting file: ${fileName}, Size: ${fileSize} bytes, MIME Type: ${mimeType}`);

      // Tải nội dung file
      const response = await this.drive.files.get(
        {
          auth,
          fileId,
          alt: 'media',
        },
        {
          responseType: 'arraybuffer',
        },
      );

      // Chuyển đổi ArrayBuffer thành Buffer
      const buffer = Buffer.from(response.data as ArrayBuffer);

      Logger.log(`Successfully downloaded file: ${fileName}, Size: ${buffer.length} bytes`);

      return {
        buffer,
        fileName,
        mimeType,
        fileSize: buffer.length, // Sử dụng buffer.length thay vì metadata.size vì chính xác hơn
      };
    } catch (error) {
      Logger.error(`Error downloading file with ID ${fileId}: ${error.message}`, error.stack);
      throw error;
    } finally {
      Logger.log(`Finished downloading file with ID ${fileId}`, 'DriveApisService.downloadFile');
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      Logger.log(`Starting to delete file with ID ${fileId}`, 'DriveService');
      const auth = this.getAuth();
      await this.drive.files.delete({
        auth,
        fileId: fileId,
      });
      Logger.log(`Successfully deleted file with ID ${fileId}`, 'DriveService');
      return true;
    } catch (error) {
      Logger.error(`Error delete file: ${error.message}`, 'DriveService');
      throw error;
    } finally {
      Logger.log(`Finished delete file with ID ${fileId}`, 'DriveService');
    }
  }

  async createFolder(folderName: string, parenFolderId: string): Promise<drive_v3.Schema$File> {
    try {
      Logger.log(`Starting to create folder with name ${folderName}`, 'DriveService.createFolder');
      const auth = this.getAuth();
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parenFolderId], // Thư mục gốc để tạo thư mục mới
      };

      const response = await this.drive.files.create({
        auth,
        requestBody: fileMetadata,
        fields: 'id, name, mimeType, createdTime',
      });
      Logger.verbose(`Successfully create folder`, 'DriveService.createFolder');
      return response.data;
    } catch (error) {
      Logger.error(`Error creating folder: ${error.message}`, 'DriveService.createFolder');
      throw error;
    } finally {
      Logger.log(`Finished create folder with name ${folderName}`, 'DriveService.createFolder');
    }
  }

  async checkFileExistsInParent(
    fileIdentifier: string,
    parentId: string,
    isFileName: boolean = false,
  ): Promise<boolean> {
    try {
      Logger.verbose(
        `Checking if ${isFileName ? 'file name' : 'file'} ${fileIdentifier} exists in folder ${parentId}`,
        'DriveApisService.checkFileExistsInParent',
      );
      const auth = this.getAuth();

      // Search by file name or get all files in parent and check ID
      const response = await this.drive.files.list({
        auth,
        q: `'${parentId}' in parents and trashed = false`,
        fields: 'files(id, name)',
      });

      if (!response.data.files) return false;

      return isFileName
        ? response.data.files.some((file) => file.name === fileIdentifier)
        : response.data.files.some((file) => file.id === fileIdentifier);
    } catch (error) {
      if (error.response?.status === 404) {
        return false;
      }
      Logger.error(
        `Error checking file existence: ${error.message}`,
        'DriveApisService.checkFileExistsInParent',
      );
      throw error;
    } finally {
      Logger.verbose(
        `Finished checking file existence`,
        'DriveApisService.checkFileExistsInParent',
      );
    }
  }
}
