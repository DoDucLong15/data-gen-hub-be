import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SystemConfigurationService } from 'src/system-configuration/system-configuration.service';
import { TOnedriveDataConnectorConfig } from './types/onedrive.type';
import { DATA_CONNECTOR_ONEDRIVE } from 'src/auth/constants/data-connector.const';

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

  async getMe() {
    const url = `${this.baseUrl}/v1.0/me`;
    return await this.requestForObject(url, 'GET');
  }

  async listItemsInMyDrive() {
    try {
      Logger.verbose('Listing items in my drive', 'OnedriveService.listItemsInMyDrive');
      const url = `${this.baseUrl}/v1.0/me/drive/root/children`;
      return await this.requestForArray(url, 'GET');
    } catch (error) {
      Logger.error(error, 'OnedriveService.listItemsInMyDrive');
      throw new BadRequestException(error);
    } finally {
      Logger.verbose('Listing items in my drive completed', 'OnedriveService.listItemsInMyDrive');
    }
  }

  async getInfoSharedLink(sharedLink: string) {
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

  async getDriveItemSharedLink(sharedLink: string) {
    try {
      Logger.verbose(
        `Getting drive item shared link: ${sharedLink}`,
        'OnedriveService.getDriveItemSharedLink',
      );
      const encodedLink = this.encodeShareLink(sharedLink);

      // Log để debug
      Logger.verbose(
        `Encoded share link: ${encodedLink}`,
        'OnedriveService.getDriveItemSharedLink',
      );

      const url = `${this.baseUrl}/v1.0/shares/${encodedLink}/driveItem`;
      Logger.verbose(`URL: ${url}`, 'OnedriveService.getDriveItemSharedLink');

      return await this.requestForObject(url, 'GET');
    } catch (error) {
      Logger.error(
        {
          error: error.response?.data || error,
          status: error.response?.status,
          headers: error.response?.headers,
        },
        'OnedriveService.getDriveItemSharedLink',
      );
      throw new BadRequestException('Failed to get drive item shared link', error.message);
    } finally {
      Logger.verbose(
        `Getting drive item shared link completed`,
        'OnedriveService.getDriveItemSharedLink',
      );
    }
  }

  async listChildrenFromSharedLink(sharedLink: string, folderId?: string) {
    try {
      Logger.verbose(
        `Listing children from shared link: ${sharedLink}`,
        'OnedriveService.listChildrenFromSharedLink',
      );

      const nextLink = folderId
        ? `${this.baseUrl}/v1.0/shares/${this.encodeShareLink(sharedLink)}/driveItem/items/${folderId}/children`
        : `${this.baseUrl}/v1.0/shares/${this.encodeShareLink(sharedLink)}/driveItem/children`;

      return await this.requestForArray(nextLink, 'GET');
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.listChildrenFromSharedLink');
      throw new BadRequestException(
        'Failed to list children from shared link',
        error.response?.data,
      );
    } finally {
      Logger.verbose(
        `Listing children from shared link completed`,
        'OnedriveService.listChildrenFromSharedLink',
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

  async downloadFileFromSharedLink(sharedLink: string) {
    try {
      Logger.verbose(
        `Downloading file from shared link: ${sharedLink}`,
        'OnedriveService.downloadFileFromSharedLink',
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

      Logger.verbose(`File downloaded successfully`, 'OnedriveService.downloadFileFromSharedLink');
      // Return info about the file
      return {
        fileName: downloadResponse.headers['content-disposition'],
        fileSize: downloadResponse.headers['content-length'],
        fileType: downloadResponse.headers['content-type'],
        bufferLength: buffer.length,
      };
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.downloadFileFromSharedLink');
      throw new BadRequestException('Failed to download file', error.response?.data);
    }
  }

  async uploadFile(
    parentFolderId: string,
    fileBuffer: Buffer,
    fileName: string,
    options?: {
      contentType?: string;
    },
  ) {
    try {
      Logger.verbose(
        `Uploading file to parent folder ID: ${parentFolderId}`,
        'OnedriveService.uploadFile',
      );
      const dataConnectorConfig = await this.getDataConnectorConfig();

      // Create upload session
      const createSessionResponse = await axios.post(
        `${this.baseUrl}/v1.0/me/drive/items/${parentFolderId}:/${fileName}:/createUploadSession`,
        {
          item: {
            '@microsoft.graph.conflictBehavior': 'replace', // Optional: how to handle existing files
            ...(options?.contentType && {
              fileSystemInfo: {
                '@odata.type': 'microsoft.graph.fileSystemInfo',
              },
              mimeType: options.contentType,
            }),
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

      Logger.verbose(`File uploaded successfully`, 'OnedriveService.uploadFile');
      return {
        id: uploadResponse.data.id,
        name: fileName,
        size: fileBuffer.length,
        webUrl: uploadResponse.data.webUrl,
      };
    } catch (error) {
      Logger.error(error.response?.data, 'OnedriveService.uploadFile');
      throw new BadRequestException('Failed to upload file', error.response?.data);
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
}
