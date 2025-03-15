import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorator';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { RoleTypes } from 'src/users/enums/role-types.enum';
import { StorageService } from './storage.service';
import { Response } from 'express';
import { streamToBuffer } from './helpers/convert.helper';
import { DownloadFilesDto } from './dtos/storage.dto';
import { BaseResponse } from 'src/base/types/response.type';
const archiver = require('archiver');

@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage')
@UseGuards(AccessTokenGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('download')
  @Roles(RoleTypes.ADMIN, RoleTypes.TEACHER)
  @ApiBody({
    type: DownloadFilesDto,
  })
  async downloadFiles(@Body() request: DownloadFilesDto, @Res() res: Response) {
    res.header('Content-Type', 'application/zip');
    res.header('Content-Disposition', `attachment; filename=${Date.now()}.zip`);

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });
    archive.pipe(res);

    for (const path of request.paths) {
      const readable = await this.storageService.downloadFile(path);
      if (readable) {
        const buffer = await streamToBuffer(readable);
        archive.append(buffer, { name: path.split('/').pop() });
      }
    }

    archive.finalize();
  }

  @Delete('delete')
  @Roles(RoleTypes.ADMIN)
  async deleteFiles(@Body() request: DownloadFilesDto): Promise<BaseResponse> {
    for (const path of request.paths) {
      await this.storageService.deleteFile(path);
    }
    return {
      status: 'success',
      message: 'Delete files successfully',
    };
  }

  @Get('download-one')
  @Roles(RoleTypes.ADMIN, RoleTypes.TEACHER)
  @ApiBody({
    type: DownloadFilesDto,
  })
  async downloadFile(@Query('path') path: string, @Res() res: Response) {
    try {
      const readable = await this.storageService.downloadFile(path);
      if (readable) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${encodeURIComponent(path.split('/').pop() || `file`)}`,
        );
        readable.pipe(res);
      } else {
        res.status(400).json({
          status: 'error',
          message: 'File not found',
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: `Error download: ${error.message}`,
      });
    }
  }
}
