import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SystemConfigurationService } from 'src/system-configuration/system-configuration.service';
import { TOnedriveDataConnectorConfig } from './types/onedrive.type';
import { DATA_CONNECTOR_ONEDRIVE } from 'src/auth/constants/data-connector.const';

@Injectable()
export class OnedriveService {
  private readonly baseUrl = 'https://graph.microsoft.com';
  constructor(private readonly systemConfigurationService: SystemConfigurationService) {}

  async getDataConnectorConfig(): Promise<TOnedriveDataConnectorConfig> {
    const dataConnector = await this.systemConfigurationService.get(DATA_CONNECTOR_ONEDRIVE);
    if (!dataConnector) {
      throw new Error('No data connector found');
    }
    return dataConnector.jsonValue as TOnedriveDataConnectorConfig;
  }

  async getMe() {
    const dataConnectorConfig = await this.getDataConnectorConfig();
    const url = `${this.baseUrl}/v1.0/me`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${dataConnectorConfig.accessToken}`,
      },
    });
    return response.data;
  }

  async listItemsInMyDrive() {
    try {
      const dataConnectorConfig = await this.getDataConnectorConfig();
      let nextLink = `${this.baseUrl}/v1.0/me/drive/root/children`;
      const allItems = [];

      while (nextLink) {
        const response = await axios.get(nextLink, {
          headers: {
            Authorization: `Bearer ${dataConnectorConfig.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        allItems.push(...response.data.value);
        nextLink = response.data['@odata.nextLink'] || null;
      }

      return allItems;
    } catch (error) {
      Logger.error(error, 'OnedriveService.listItemsInMyDrive');
      throw new BadRequestException(error);
    }
  }
}
