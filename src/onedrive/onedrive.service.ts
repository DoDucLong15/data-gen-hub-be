import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SystemConfigurationService } from 'src/system-configuration/system-configuration.service';
import {
  TOnedriveChildren,
  TOnedriveDataConnectorConfig,
  TOnedriveHierarchy,
  TOnedriveItem,
  TOnedrivePreviewItem,
} from './types/onedrive.type';
import { DATA_CONNECTOR_ONEDRIVE } from 'src/auth/constants/data-connector.const';
import { TOnedriveMe } from './types/root.type';
import { TOnedriveShareLinkInfo } from './types/share-link.type';
import { OnedriveHelper } from './helpers/onedrive.helper';
import { ApplyCachingMetric } from 'src/base/decorators/caching.decorator';

@Injectable()
export class OnedriveService {
  private readonly baseUrl = 'https://graph.microsoft.com';
  constructor(private readonly systemConfigurationService: SystemConfigurationService) {}

  encodeShareLink(sharingUrl: string): string {
    const base64Value = Buffer.from(sharingUrl, 'utf-8').toString('base64');
    const encodedUrl =
      'u!' + base64Value.replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
    return encodedUrl;
  }

  async getDataConnectorConfig(): Promise<TOnedriveDataConnectorConfig> {
    const dataConnector = await this.systemConfigurationService.get(DATA_CONNECTOR_ONEDRIVE);
    if (!dataConnector) {
      throw new Error('No data connector found');
    }
    return dataConnector.jsonValue as TOnedriveDataConnectorConfig;
  }

  async getMe(): Promise<TOnedriveMe> {
    const url = `${this.baseUrl}/v1.0/me`;
    return await this.requestForObject(url, 'GET');
  }

  async getChildrenInRootDrive(): Promise<TOnedriveItem[]> {
    try {
      Logger.verbose('Listing items in my drive', 'OnedriveService.getChildrenInRootDrive');
      const url = `${this.baseUrl}/v1.0/me/drive/root/children`;
      return await this.requestForArray(url, 'GET');
    } catch (error) {
      Logger.error(error, 'OnedriveService.getChildrenInRootDrive');
      throw new BadRequestException(error);
    } finally {
      Logger.verbose(
        'Listing items in my drive completed',
        'OnedriveService.getChildrenInRootDrive',
      );
    }
  }

  async getInfoSharedLink(sharedLink: string): Promise<TOnedriveShareLinkInfo> {
    try {
      Logger.verbose(
        `Getting info shared link: ${sharedLink}`,
        'OnedriveService.getInfoSharedLink',
      );
      const encodedLink = this.encodeShareLink(sharedLink);
      // Log để debug
      Logger.verbose(`Encoded share link: ${encodedLink}`, 'OnedriveService.getInfoSharedLink');

      const url = `${this.baseUrl}/v1.0/shares/${encodedLink}`;
      Logger.verbose(`URL: ${url}`, 'OnedriveService.getInfoSharedLink');

      return await this.requestForObject(url, 'GET');
    } catch (error) {
      Logger.error(
        {
          error: error.response?.data || error,
          status: error.response?.status,
          headers: error.response?.headers,
        },
        'OnedriveService.getInfoSharedLink',
      );
      throw new BadRequestException('Failed to get info shared link', error.message);
    } finally {
      Logger.verbose(`Getting info shared link completed`, 'OnedriveService.getInfoSharedLink');
    }
  }

  async getChildrenFromSharedLink(
    sharedLink: string,
    expand: boolean = false,
  ): Promise<TOnedriveChildren> {
    try {
      Logger.verbose(
        `Getting drive item shared link: ${sharedLink}`,
        'OnedriveService.getChildrenFromSharedLink',
      );
      const encodedLink = this.encodeShareLink(sharedLink);

      // Log để debug
      Logger.verbose(
        `Encoded share link: ${encodedLink}`,
        'OnedriveService.getChildrenFromSharedLink',
      );

      const url = `${this.baseUrl}/v1.0/shares/${encodedLink}/driveItem${expand ? '?$expand=children' : ''}`;
      Logger.verbose(`URL: ${url}`, 'OnedriveService.getChildrenFromSharedLink');

      return await this.requestForObject(url, 'GET');
    } catch (error) {
      Logger.error(
        {
          error: error.response?.data || error,
          status: error.response?.status,
          headers: error.response?.headers,
        },
        'OnedriveService.getChildrenFromSharedLink',
      );
      throw new BadRequestException('Failed to get drive item shared link', error.message);
    } finally {
      Logger.verbose(
        `Getting drive item shared link completed`,
        'OnedriveService.getChildrenFromSharedLink',
      );
    }
  }

  async listItemsFromSharedLink(sharedLink: string, folderId?: string) {
    try {
      Logger.verbose(
        `Listing children from shared link: ${sharedLink}`,
        'OnedriveService.listItemsFromSharedLink',
      );

      const nextLink = folderId
        ? `${this.baseUrl}/v1.0/shares/${this.encodeShareLink(sharedLink)}/driveItem/items/${folderId}/children`
        : `${this.baseUrl}/v1.0/shares/${this.encodeShareLink(sharedLink)}/driveItem/children`;

      return await this.requestForArray(nextLink, 'GET');
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.listItemsFromSharedLink');
      throw new BadRequestException(
        'Failed to list children from shared link',
        error.response?.data,
      );
    } finally {
      Logger.verbose(
        `Listing children from shared link completed`,
        'OnedriveService.listItemsFromSharedLink',
      );
    }
  }

  async downloadFileFromRootDrive(fileId: string) {
    try {
      Logger.verbose(
        `Downloading file with ID: ${fileId}`,
        'OnedriveService.downloadFileFromRootDrive',
      );
      const dataConnectorConfig = await this.getDataConnectorConfig();

      // Get download URL
      const downloadUrlResponse = await axios.get(
        `${this.baseUrl}/v1.0/me/drive/items/${fileId}/content`,
        {
          headers: {
            Authorization: `Bearer ${dataConnectorConfig.accessToken}`,
          },
          maxRedirects: 0,
          validateStatus: (status) => status === 302, // We expect a redirect
        },
      );

      // Follow the redirect to download the file
      const downloadResponse = await axios({
        method: 'get',
        url: downloadUrlResponse.headers.location,
        responseType: 'stream',
      });

      // Stream to buffer
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        downloadResponse.data.on('data', (chunk: Buffer) => chunks.push(chunk));
        downloadResponse.data.on('end', () => resolve(Buffer.concat(chunks)));
        downloadResponse.data.on('error', reject);
      });

      Logger.verbose(`File downloaded successfully`, 'OnedriveService.downloadFileFromRootDrive');
      // Return info about the file
      return {
        fileName: downloadResponse.headers['content-disposition'],
        fileSize: downloadResponse.headers['content-length'],
        fileType: downloadResponse.headers['content-type'],
        bufferLength: buffer.length,
      };
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.downloadFileFromRootDrive');
      throw new BadRequestException('Failed to download file', error.response?.data);
    }
  }

  async downloadFileSharedLink(sharedLink: string) {
    try {
      Logger.verbose(
        `Downloading file from shared link: ${sharedLink}`,
        'OnedriveService.downloadFileSharedLink',
      );
      const dataConnectorConfig = await this.getDataConnectorConfig();

      // Get download URL
      const downloadUrlResponse = await axios.get(
        `${this.baseUrl}/v1.0/shares/${this.encodeShareLink(sharedLink)}/driveItem/content`,
        {
          headers: {
            Authorization: `Bearer ${dataConnectorConfig.accessToken}`,
          },
          maxRedirects: 0,
          validateStatus: (status) => status === 302, // We expect a redirect
        },
      );

      // Follow the redirect to download the file
      const downloadResponse = await axios({
        method: 'get',
        url: downloadUrlResponse.headers.location,
        responseType: 'stream',
      });

      // Stream to buffer
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        downloadResponse.data.on('data', (chunk: Buffer) => chunks.push(chunk));
        downloadResponse.data.on('end', () => resolve(Buffer.concat(chunks)));
        downloadResponse.data.on('error', reject);
      });

      Logger.verbose(`File downloaded successfully`, 'OnedriveService.downloadFileSharedLink');
      // Return info about the file
      return {
        fileName: downloadResponse.headers['content-disposition'],
        fileSize: downloadResponse.headers['content-length'],
        fileType: downloadResponse.headers['content-type'],
        bufferLength: buffer.length,
      };
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.downloadFileSharedLink');
      throw new BadRequestException('Failed to download file', error.response?.data);
    }
  }

  async downloadFileFromSpecificDrive(driveId: string, fileId: string) {
    try {
      Logger.verbose(
        `Downloading file from drive ID: ${driveId}`,
        'OnedriveService.downloadFileFromSpecificDrive',
      );
      const dataConnectorConfig = await this.getDataConnectorConfig();

      // Get download URL
      const downloadUrlResponse = await axios.get(
        `${this.baseUrl}/v1.0/drives/${driveId}/items/${fileId}/content`,
        {
          headers: {
            Authorization: `Bearer ${dataConnectorConfig.accessToken}`,
          },
          maxRedirects: 0,
          validateStatus: (status) => status === 302, // We expect a redirect
        },
      );

      // Follow the redirect to download the file
      const downloadResponse = await axios({
        method: 'get',
        url: downloadUrlResponse.headers.location,
        responseType: 'stream',
      });

      // Stream to buffer
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        downloadResponse.data.on('data', (chunk: Buffer) => chunks.push(chunk));
        downloadResponse.data.on('end', () => resolve(Buffer.concat(chunks)));
        downloadResponse.data.on('error', reject);
      });

      Logger.verbose(
        `File downloaded successfully`,
        'OnedriveService.downloadFileFromSpecificDrive',
      );
      // Return info about the file
      return {
        originalname: OnedriveHelper.parseContentDisposition(
          downloadResponse.headers['content-disposition'],
        ),
        mimetype: downloadResponse.headers['content-type'],
        buffer: buffer,
        size: downloadResponse.headers['content-length'],
      };
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.downloadFileFromSpecificDrive');
      throw new BadRequestException('Failed to download file', error.response?.data);
    }
  }

  async uploadFileToRootDrive(parentFolderId: string, fileBuffer: Buffer, fileName: string) {
    try {
      Logger.verbose(
        `Uploading file to parent folder ID: ${parentFolderId}`,
        'OnedriveService.uploadFileToRootDrive',
      );
      const dataConnectorConfig = await this.getDataConnectorConfig();

      // Xử lý tên file an toàn
      const safeFileName = OnedriveHelper.sanitizeFileNameForOneDriveUrl(fileName);

      // Create upload session
      const createSessionResponse = await axios.post(
        `${this.baseUrl}/v1.0/me/drive/items/${parentFolderId}:/${safeFileName}:/createUploadSession`,
        {
          item: {
            '@microsoft.graph.conflictBehavior': 'replace',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${dataConnectorConfig.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const uploadUrl = createSessionResponse.data.uploadUrl;

      // Upload entire buffer in one request
      const uploadResponse = await axios.put(uploadUrl, fileBuffer, {
        headers: {
          'Content-Length': fileBuffer.length,
          'Content-Range': `bytes 0-${fileBuffer.length - 1}/${fileBuffer.length}`,
        },
      });

      Logger.verbose(`File uploaded successfully`, 'OnedriveService.uploadFileToRootDrive');
      return {
        id: uploadResponse.data.id,
        name: fileName,
        size: fileBuffer.length,
        webUrl: uploadResponse.data.webUrl,
      };
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.uploadFileToRootDrive');
      throw new BadRequestException('Failed to upload file', error.response?.data);
    }
  }

  async uploadFileToSpecificDrive(
    driveId: string,
    parentFolderId: string,
    fileBuffer: Buffer,
    fileName: string,
  ) {
    try {
      Logger.verbose(
        `Uploading file to parent folder ID: ${parentFolderId}`,
        'OnedriveService.uploadFileToSpecificDrive',
      );
      const dataConnectorConfig = await this.getDataConnectorConfig();

      // Xử lý tên file an toàn
      const safeFileName = OnedriveHelper.sanitizeFileNameForOneDriveUrl(fileName);
      Logger.debug(`Safe file name: ${safeFileName}`, 'OnedriveService.uploadFileToSpecificDrive');
      // Create upload session
      const createSessionResponse = await axios.post(
        `${this.baseUrl}/v1.0/drives/${driveId}/items/${parentFolderId}:/${safeFileName}:/createUploadSession`,
        {
          item: {
            '@microsoft.graph.conflictBehavior': 'replace',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${dataConnectorConfig.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const uploadUrl = createSessionResponse.data.uploadUrl;

      // Upload entire buffer in one request
      const uploadResponse = await axios.put(uploadUrl, fileBuffer, {
        headers: {
          'Content-Length': fileBuffer.length,
          'Content-Range': `bytes 0-${fileBuffer.length - 1}/${fileBuffer.length}`,
        },
      });

      Logger.verbose(`File uploaded successfully`, 'OnedriveService.uploadFileToSpecificDrive');
      return {
        id: uploadResponse.data.id,
        name: fileName,
        size: fileBuffer.length,
        webUrl: uploadResponse.data.webUrl,
      };
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.uploadFileToSpecificDrive');
      throw new BadRequestException('Failed to upload file', error.response?.data);
    }
  }

  async uploadMultipleFilesToSpecificDrive(
    driveId: string,
    parentFolderId: string,
    files: Array<{ buffer: Buffer; fileName: string }>,
  ) {
    try {
      Logger.verbose(
        `Bắt đầu upload ${files.length} file vào thư mục ID: ${parentFolderId}`,
        'OnedriveService.uploadMultipleFilesToSpecificDrive',
      );

      const results = await Promise.all(
        files.map(async (file) => {
          try {
            const result = await this.uploadFileToSpecificDrive(
              driveId,
              parentFolderId,
              file.buffer,
              file.fileName,
            );
            return {
              success: true,
              file: result,
            };
          } catch (error) {
            Logger.error(
              `Lỗi khi upload file ${file.fileName}: ${error.message}`,
              'OnedriveService.uploadMultipleFilesToSpecificDrive',
            );
            return {
              success: false,
              fileName: file.fileName,
              error: error.message || 'Unknown error',
            };
          }
        }),
      );

      const successCount = results.filter((r) => r.success).length;
      Logger.verbose(
        `Upload hoàn tất: ${successCount}/${files.length} file thành công`,
        'OnedriveService.uploadMultipleFilesToSpecificDrive',
      );

      return {
        totalFiles: files.length,
        successCount,
        failedCount: files.length - successCount,
        results,
      };
    } catch (error) {
      Logger.error(
        `Lỗi upload nhiều file: ${error.message}`,
        'OnedriveService.uploadMultipleFilesToSpecificDrive',
      );
      throw new BadRequestException('Lỗi khi upload nhiều file', error.response?.data);
    }
  }

  async updateOnedriveAccessToken(data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }) {
    const dataConnector = await this.systemConfigurationService.get(DATA_CONNECTOR_ONEDRIVE);
    if (dataConnector) {
      dataConnector.jsonValue = data;
      await this.systemConfigurationService.update(dataConnector);
    } else {
      await this.systemConfigurationService.create({
        key: DATA_CONNECTOR_ONEDRIVE,
        jsonValue: data,
      });
    }
  }

  // Health check
  async refreshOnedriveAccessToken(refreshToken: string) {
    const url = `https://login.microsoftonline.com/${process.env.ONEDRIVE_TENANT_ID}/oauth2/v2.0/token`;
    const data = new URLSearchParams({
      client_id: process.env.ONEDRIVE_CLIENT_ID || '',
      client_secret: process.env.ONEDRIVE_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await axios.post(url, data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const fetchData = response.data;
    const accessToken = fetchData.access_token;
    const newRefreshToken = fetchData.refresh_token;
    const expiresIn = fetchData.expires_in;
    await this.updateOnedriveAccessToken({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    });
    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: expiresIn,
    };
  }

  async healthCheckOnedrive() {
    const dataConnector = await this.systemConfigurationService.get(DATA_CONNECTOR_ONEDRIVE);
    if (!dataConnector) {
      Logger.warn('No onedrive data connector found', 'OnedriveService');
      return;
    }
    try {
      const url = `${this.baseUrl}/v1.0/me/drive/root/children`;
      await axios.get(url, {
        headers: {
          Authorization: `Bearer ${dataConnector.jsonValue.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      Logger.verbose('Onedrive access token is valid', 'OnedriveService');
      return {
        status: 'success',
        message: 'Onedrive access token is valid',
      };
    } catch (error) {
      Logger.error(error, 'OnedriveService.healthCheckOnedrive');
      if (error.response?.status === 401) {
        Logger.warn('Onedrive access token is invalid', 'OnedriveService');
      }
      await this.refreshOnedriveAccessToken(dataConnector.jsonValue.refreshToken);
      return {
        status: 'success',
        message: 'Onedrive access token is refreshed',
      };
    }
  }

  private async requestForArray<T>(
    url: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    params?: any,
    body?: any,
  ): Promise<T[]> {
    try {
      const dataConnectorConfig = await this.getDataConnectorConfig();
      let nextLink = url;
      const allItems: T[] = [];

      while (nextLink) {
        try {
          const response = await axios.request({
            method,
            url: nextLink,
            headers: {
              Authorization: `Bearer ${dataConnectorConfig.accessToken}`,
              'Content-Type': 'application/json',
            },
            params,
            data: body,
          });
          allItems.push(...response.data.value);
          nextLink = response.data['@odata.nextLink'] || null;
        } catch (error) {
          if (error.response?.status === 401) {
            Logger.warn('Token expired, refreshing...', 'OnedriveService.requestForArray');
            await this.refreshOnedriveAccessToken(dataConnectorConfig.refreshToken);
            // Retry with new token
            const newConfig = await this.getDataConnectorConfig();
            const response = await axios.get(nextLink, {
              headers: {
                Authorization: `Bearer ${newConfig.accessToken}`,
                'Content-Type': 'application/json',
              },
            });
            allItems.push(...response.data.value);
            nextLink = response.data['@odata.nextLink'] || null;
          } else {
            throw error;
          }
        }
      }

      return allItems;
    } catch (error) {
      Logger.error(error.response?.data || error, 'OnedriveService.requestForArray');
      throw new BadRequestException('Failed to fetch data', error.response?.data);
    }
  }

  private async requestForObject<T>(
    url: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    params?: any,
    body?: any,
  ): Promise<T> {
    try {
      const dataConnectorConfig = await this.getDataConnectorConfig();
      try {
        const response = await axios.request({
          method,
          url,
          headers: {
            Authorization: `Bearer ${dataConnectorConfig.accessToken}`,
            'Content-Type': 'application/json',
          },
          params,
          data: body,
        });
        return response.data;
      } catch (error) {
        if (error.response?.status === 401) {
          Logger.warn('Token expired, refreshing...', 'OnedriveService.requestForObject');
          await this.refreshOnedriveAccessToken(dataConnectorConfig.refreshToken);
          // Retry with new token
          const newConfig = await this.getDataConnectorConfig();
          const response = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${newConfig.accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          return response.data;
        }
        throw error;
      }
    } catch (error) {
      Logger.error(error.response?.data || error, 'OnedriveService.requestForObject');
      throw new BadRequestException('Failed to fetch data', error.response?.data);
    }
  }

  async listChildrenFromSpecificDrive(driveId: string, folderId: string): Promise<TOnedriveItem[]> {
    try {
      Logger.verbose(
        `Listing children from drive ID: ${driveId}`,
        'OnedriveService.listChildrenFromSpecificDrive',
      );

      const url = `${this.baseUrl}/v1.0/drives/${driveId}/items/${folderId}/children`;

      const response = await this.requestForObject(url, 'GET');
      return (response as any)?.value || [];
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.listChildrenFromSpecificDrive');
      throw new BadRequestException('Failed to list children from drive ID', error.response?.data);
    } finally {
      Logger.verbose(
        `Listing children from drive ID completed`,
        'OnedriveService.listChildrenFromSpecificDrive',
      );
    }
  }

  @ApplyCachingMetric(60 * 5)
  async listFileSharedLinkWithHierarchy(
    sharedLink: string,
    deep: boolean = false,
    maxDepth: number = 5,
  ): Promise<TOnedriveHierarchy> {
    try {
      Logger.verbose(
        `Listing files with hierarchy from shared link: ${sharedLink}, deep: ${deep}`,
        'OnedriveService.listFileSharedLinkWithHierarchy',
      );

      // Lấy thông tin chi tiết từ liên kết chia sẻ
      const rootInfo = await this.getChildrenFromSharedLink(sharedLink, false);

      if (!rootInfo) {
        return {} as TOnedriveHierarchy;
      }

      // Lấy ra driveId và id của thư mục gốc
      const driveId = rootInfo.parentReference?.driveId;
      const rootId = rootInfo.id;

      // Tạo cấu trúc nút gốc
      const rootNode: TOnedriveChildren = {
        ...rootInfo,
        children: [],
      };

      // Nếu không có driveId hoặc không có quyền truy cập, trả về nút gốc trống
      if (!driveId) {
        return rootNode;
      }

      // Hàm đệ quy để xây dựng cây phân cấp
      const buildHierarchy = async (
        driveId: string,
        folderId: string,
        folderNode: any,
        depth: number,
      ): Promise<void> => {
        // Nếu đã vượt quá độ sâu tối đa, dừng đệ quy
        if (depth > maxDepth) {
          return;
        }

        // Lấy danh sách mục con trong thư mục
        const items = await this.listChildrenFromSpecificDrive(driveId, folderId);

        if (!items || !items.length) {
          return;
        }

        // Xử lý từng mục con
        for (const item of items) {
          const isFolder = !!item.folder;

          // Tạo node cho mục này
          const node: TOnedriveChildren = {
            ...item,
            children: isFolder ? [] : undefined,
          };

          // Thêm vào danh sách con của thư mục cha
          folderNode.children.push(node);

          // Nếu là thư mục và cần đi sâu, tiếp tục đệ quy
          if (isFolder && deep && depth < maxDepth) {
            await buildHierarchy(driveId, item.id, node, depth + 1);
          }
        }
      };

      // Bắt đầu xây dựng cấu trúc phân cấp từ thư mục gốc
      await buildHierarchy(driveId, rootId, rootNode, 1);

      return rootNode;
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.listFileSharedLinkWithHierarchy');
      throw new BadRequestException(
        'Failed to list files with hierarchy from shared link',
        error.response?.data,
      );
    } finally {
      Logger.verbose(
        `Listing files with hierarchy from shared link completed`,
        'OnedriveService.listFileSharedLinkWithHierarchy',
      );
    }
  }

  async getPreviewItemInRootDrive(fileId: string): Promise<TOnedrivePreviewItem> {
    try {
      Logger.verbose(
        `Getting preview item in root drive: ${fileId}`,
        'OnedriveService.getPreviewItemInRootDrive',
      );
      const url = `${this.baseUrl}/v1.0/me/drive/items/${fileId}/preview`;
      return await this.requestForObject(url, 'POST');
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.getPreviewItemInRootDrive');
      throw new BadRequestException(
        'Failed to get preview item in root drive',
        error.response?.data,
      );
    } finally {
      Logger.verbose(
        `Getting preview item in root drive completed`,
        'OnedriveService.getPreviewItemInRootDrive',
      );
    }
  }

  @ApplyCachingMetric(60 * 60 * 24)
  async getPreviewItemInSpecificDrive(
    driveId: string,
    fileId: string,
  ): Promise<TOnedrivePreviewItem> {
    try {
      Logger.verbose(
        `Getting preview item in specific drive: ${driveId}`,
        'OnedriveService.getPreviewItemInSpecificDrive',
      );
      const url = `${this.baseUrl}/v1.0/drives/${driveId}/items/${fileId}/preview`;
      return await this.requestForObject(url, 'POST');
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.getPreviewItemInSpecificDrive');
      throw new BadRequestException(
        'Failed to get preview item in specific drive',
        error.response?.data,
      );
    } finally {
      Logger.verbose(
        `Getting preview item in specific drive completed`,
        'OnedriveService.getPreviewItemInSpecificDrive',
      );
    }
  }

  async createFolderInSpecificDrive(
    driveId: string,
    parentFolderId: string,
    folderName: string,
  ): Promise<TOnedriveItem> {
    try {
      Logger.verbose(
        `Creating folder ${folderName} in specific drive: ${driveId}`,
        'OnedriveService.createFolderInSpecificDrive',
      );
      const url = `${this.baseUrl}/v1.0/drives/${driveId}/items/${parentFolderId}/children`;
      return await this.requestForObject(
        url,
        'POST',
        {},
        {
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        },
      );
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.createFolderInSpecificDrive');
      throw new BadRequestException(
        'Failed to create folder in specific drive',
        error.response?.data,
      );
    } finally {
      Logger.verbose(
        `Creating folder in specific drive completed`,
        'OnedriveService.createFolderInSpecificDrive',
      );
    }
  }

  async deleteItemInSpecificDrive(driveId: string, itemId: string) {
    try {
      Logger.verbose(
        `Deleting item in specific drive: ${driveId}`,
        'OnedriveService.deleteItemInSpecificDrive',
      );
      const url = `${this.baseUrl}/v1.0/drives/${driveId}/items/${itemId}`;
      return await this.requestForObject(url, 'DELETE');
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.deleteItemInSpecificDrive');
      throw new BadRequestException(
        'Failed to delete item in specific drive',
        error.response?.data,
      );
    } finally {
      Logger.verbose(
        `Deleting item in specific drive completed`,
        'OnedriveService.deleteItemInSpecificDrive',
      );
    }
  }
}
