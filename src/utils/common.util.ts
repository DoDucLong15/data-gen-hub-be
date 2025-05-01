import * as path from 'path';
import * as decompress from 'decompress';
import * as mime from 'mime-types';
import { Readable } from 'stream';
import { HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { AxiosError } from 'axios';

export class CommonUtils {
  static zipExtension = ['.zip', '.tar', '.tar.gz', '.tgz', '.bz2'];

  static isNullish(value: any): boolean {
    return value === null || value === undefined;
  }

  static isNotNullish(value: any): boolean {
    return !this.isNullish(value);
  }

  static formatString(template: string, ...values: string[]): string {
    return template.replace(/{(\d+)}/g, (match, index) => {
      return values[index] !== undefined ? values[index] : match;
    });
  }

  static async unzip(files: Express.Multer.File[]): Promise<Express.Multer.File[]> {
    const extractedFiles: Express.Multer.File[] = [];

    for (const file of files) {
      const fileExt = path.extname(file.originalname).toLowerCase();

      if (this.zipExtension.includes(fileExt)) {
        const decompressedFiles = await decompress(file.buffer);

        decompressedFiles.forEach((decompressedFile) => {
          const extractedMimeType =
            mime.lookup(decompressedFile.path) || 'application/octet-stream';

          extractedFiles.push({
            fieldname: file.fieldname,
            originalname: decompressedFile.path,
            encoding: file.encoding,
            mimetype: extractedMimeType,
            buffer: decompressedFile.data,
            size: decompressedFile.data.length,
            destination: '',
            filename: decompressedFile.path,
            path: '',
            stream: new Readable({
              read() {
                this.push(decompressedFile.data);
                this.push(null);
              },
            }),
          });
        });
      } else {
        extractedFiles.push(file);
      }
    }
    return extractedFiles;
  }

  static isNotEmptyObj(obj: Record<string, any>): boolean {
    return obj && Object.keys(obj).length > 0;
  }

  static isEmptyObj(obj: Record<string, any>): boolean {
    return !this.isNotEmptyObj(obj);
  }

  static transformError(error: any, context?: string): HttpException {
    if (error instanceof HttpException) return error;

    if (error instanceof AxiosError) {
      const message = error.response?.data?.message ?? JSON.stringify(error.response?.data);
      const status = error.response?.status ?? error.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return new HttpException(context ? `${context}: ${message}` : message, status);
    }

    const message = typeof error === 'string' ? error : (error.message ?? JSON.stringify(error));
    return new InternalServerErrorException(context ? `${context}: ${message}` : message);
  }

  static isNotEmptyArray(arr: any[]): boolean {
    return arr && arr.length > 0;
  }

  static getStudentFilePath(
    classId: string,
    name: string,
    action: string,
    originalName: string,
  ): string {
    return `data-gen-hub/${classId}/${name}/${action}/${Date.now()}_${originalName}`;
  }

  static getKeyValueFromObject = (prefix = '', ...args: any[]): string => {
    return `${prefix}::${JSON.stringify(args)}`;
  };
}
