import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DriveApisService } from './drive-apis.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';
import {
  CheckFileExistsInParentDto,
  CreateFolderDto,
  ListDriveItemsDto,
  UploadFilesDto,
} from './dtos/drive.dto';
import { DriveItem, UploadFilesResponse } from './types/drive-config.type';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Drive Apis')
@ApiBearerAuth()
@Controller('drive-apis')
@UseGuards(AccessTokenGuard, PoliciesGuard)
export class DriveApisController {
  constructor(private readonly driveApisService: DriveApisService) {}

  @Get('files/:fileId')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_DriveApis })
  async getFile(@Query('fileId') fileId: string): Promise<DriveItem> {
    return await this.driveApisService.getFile(fileId);
  }

  @Get('files')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_DriveApis })
  async listFiles(@Query() query: ListDriveItemsDto): Promise<DriveItem[]> {
    return await this.driveApisService.listFiles(query);
  }

  @Post('files')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
    }),
  )
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_DriveApis })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadFilesDto,
  })
  async uploadFiles(
    @Body() body: UploadFilesDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UploadFilesResponse> {
    return await this.driveApisService.uploadFiles(files, body.folderId);
  }

  @Get('download-file')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_DriveApis })
  async downloadFile(@Query('fileId') fileId: string) {
    return await this.driveApisService.downloadFile(fileId);
  }

  @Get('check-file-exists')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_DriveApis })
  async fileExists(@Query() request: CheckFileExistsInParentDto): Promise<boolean> {
    return await this.driveApisService.checkFileExistsInParent(
      request.fileIdentifier,
      request.parentFolderId,
      request.isFileName,
    );
  }

  @Delete('files/:fileId')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_DriveApis })
  async deleteFile(@Query('fileId') fileId: string) {
    return await this.driveApisService.deleteFile(fileId);
  }

  @Post('folders')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_DriveApis })
  async createFolder(@Body() body: CreateFolderDto) {
    return await this.driveApisService.createFolder(body.folderName, body.parentFolderId);
  }

  @Post('health-check')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_DriveApis })
  async healthCheck() {
    return await this.driveApisService.healthCheck();
  }
}
