import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { OnedriveService } from './onedrive.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileToDriveIdDto, UploadFileToMyDriveDto } from './dtos/upload.dto';
import { TOnedriveMe } from './types/root.type';
import { TOnedriveChildren, TOnedriveItem, TOnedrivePreviewItem } from './types/onedrive.type';
import { TOnedriveShareLinkInfo } from './types/share-link.type';
import { CreateFolderInSpecificDriveDto } from './dtos/folder.dto';

@ApiTags('Onedrive')
@ApiBearerAuth()
@Controller('onedrive')
@UseGuards(AccessTokenGuard, PoliciesGuard)
export class OnedriveController {
  constructor(private readonly onedriveService: OnedriveService) {}

  @Post('health-check')
  async healthCheckOnedrive() {
    return await this.onedriveService.healthCheckOnedrive();
  }

  @Get('me')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async getMe(): Promise<TOnedriveMe> {
    return await this.onedriveService.getMe();
  }

  @Get('root/children')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async getChildrenInRootDrive(): Promise<TOnedriveItem[]> {
    return await this.onedriveService.getChildrenInRootDrive();
  }

  @Post('root/upload')
  @ApiBody({ type: UploadFileToMyDriveDto })
  @ApiConsumes('multipart/form-data')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Onedrive })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 10, // 10MB
      },
    }),
  )
  async uploadFileToRootDrive(
    @Body() body: UploadFileToMyDriveDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.onedriveService.uploadFileToRootDrive(
      body.parentFolderId,
      file.buffer,
      file.originalname,
    );
  }

  @Get('root/preview')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async getPreviewItemInRootDrive(@Query('fileId') fileId: string): Promise<TOnedrivePreviewItem> {
    return await this.onedriveService.getPreviewItemInRootDrive(fileId);
  }

  @Get('shared-link/info')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async getInfoSharedLink(
    @Query('sharedLink') sharedLink: string,
  ): Promise<TOnedriveShareLinkInfo> {
    return await this.onedriveService.getInfoSharedLink(sharedLink);
  }

  @Get('shared-link/children')
  @ApiQuery({
    name: 'expand',
    required: false,
    type: Boolean,
  })
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async getChildrenFromSharedLink(
    @Query('sharedLink') sharedLink: string,
    @Query('expand') expand: boolean,
  ): Promise<TOnedriveChildren> {
    return await this.onedriveService.getChildrenFromSharedLink(sharedLink, expand);
  }

  @Get('shared-link/items')
  @ApiQuery({
    name: 'folderId',
    required: false,
    type: String,
  })
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async listChildrenFromSharedLink(
    @Query('sharedLink') sharedLink: string,
    @Query('folderId') folderId?: string,
  ) {
    return await this.onedriveService.listItemsFromSharedLink(sharedLink, folderId);
  }

  @Get('shared-link/download')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async downloadFileSharedLink(@Query('sharedLink') sharedLink: string) {
    return await this.onedriveService.downloadFileSharedLink(sharedLink);
  }

  @Get('shared-link/hierarchy')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async listFileSharedLinkWithHierarchy(
    @Query('sharedLink') sharedLink: string,
    @Query('maxDepth') maxDepth: number = 5,
  ) {
    return await this.onedriveService.listFileSharedLinkWithHierarchy(sharedLink, true, maxDepth);
  }

  @Get('specific-drive/items')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async listChildrenFromSpecificDrive(
    @Query('driveId') driveId: string,
    @Query('folderId') folderId: string,
  ): Promise<TOnedriveItem[]> {
    return await this.onedriveService.listChildrenFromSpecificDrive(driveId, folderId);
  }

  @Get('specific-drive/download')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async downloadFileFromSpecificDrive(
    @Query('driveId') driveId: string,
    @Query('fileId') fileId: string,
  ) {
    return await this.onedriveService.downloadFileFromSpecificDrive(driveId, fileId);
  }

  @Post('specific-drive/upload')
  @ApiBody({ type: UploadFileToDriveIdDto })
  @ApiConsumes('multipart/form-data')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Onedrive })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 10, // 10MB
      },
    }),
  )
  async uploadFileToSpecificDrive(
    @Body() body: UploadFileToDriveIdDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.onedriveService.uploadFileToSpecificDrive(
      body.driveId,
      body.parentFolderId,
      file.buffer,
      file.originalname,
    );
  }

  @Get('specific-drive/preview')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async getPreviewItemInSpecificDrive(
    @Query('driveId') driveId: string,
    @Query('fileId') fileId: string,
  ): Promise<TOnedrivePreviewItem> {
    return await this.onedriveService.getPreviewItemInSpecificDrive(driveId, fileId);
  }

  @Post('specific-drive/folders')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Onedrive })
  async createFolderInSpecificDrive(
    @Body() body: CreateFolderInSpecificDriveDto,
  ): Promise<TOnedriveItem> {
    return await this.onedriveService.createFolderInSpecificDrive(
      body.driveId,
      body.parentFolderId,
      body.folderName,
    );
  }
}
