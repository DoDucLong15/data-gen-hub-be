import { Bucket } from '@google-cloud/storage';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { getDownloadURL } from 'firebase-admin/storage';
import { StorageUploadResult } from './types/storage.type';
import { Readable } from 'stream';


@Injectable()
export class StorageService {
  async uploadDataToFile(
    data: string | Buffer,
    contentType: string | undefined,
    filePath: string,
    _bucket?: Bucket,
  ): Promise<StorageUploadResult | undefined> {
    try {
      const bucket = _bucket ?? admin.storage().bucket();
      const file = bucket.file(filePath);

      await file.save(data, {
        contentType: contentType,
      });

      return {
        key: filePath,
        url: await getDownloadURL(file),
      }
    } catch (e) {
      return undefined;
    }
  }

  async downloadFile(filePath: string, _bucket?: Bucket,): Promise<Readable | undefined> {
    try {
      const bucket = _bucket ?? admin.storage().bucket();
      const file = bucket.file(filePath);

      const readable = file.createReadStream();

      return readable;
    } catch (e) {
      return undefined;
    }
  }

  async deleteFile(filePath: string, _bucket?: Bucket): Promise<boolean> {
    try {
      const bucket = _bucket ?? admin.storage().bucket();
      await bucket.file(filePath).delete();
      return true;
    } catch (e) {
      Logger.error(e, 'StorageService');
      return false;
    }
  }

  async getPublicURL(filePath: string, _bucket?: Bucket,): Promise<string> {
    const bucket = _bucket ?? admin.storage().bucket();
    const file = bucket.file(filePath);
    return await getDownloadURL(file);
  }
}
