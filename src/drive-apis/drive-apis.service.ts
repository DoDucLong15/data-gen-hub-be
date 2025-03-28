import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { drive_v3, google } from 'googleapis';
import { DRIVE_SCOPES, DRIVE_VERSION, FOLDER_MIMETYPE } from './constants/drive.constant';
import * as driveConfig from '../../drive.config.json';
import { GaxiosPromise, GoogleAuth } from 'googleapis-common';
import { DriveItem, TDriveConnectorConfig } from './types/drive-config.type';
import { ListDriveItemsDto } from './dtos/drive.dto';
import { MailerService } from 'src/mailer/mailer.service';
import { SystemConfigUtils } from 'src/system-configuration/utils/system-config.util';

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
}
