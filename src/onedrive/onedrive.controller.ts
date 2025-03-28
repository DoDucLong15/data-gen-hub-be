import {
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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

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
  async getMe() {
    return await this.onedriveService.getMe();
  }

  @Get('items')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async listItemsInMyDrive() {
    return await this.onedriveService.listItemsInMyDrive();
  }

  @Get('shared-link/info')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async getInfoSharedLink(@Query('sharedLink') sharedLink: string) {
    return await this.onedriveService.getInfoSharedLink(sharedLink);
  }

  @Get('shared-link/drive-item')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async getDriveItemSharedLink(@Query('sharedLink') sharedLink: string) {
    return await this.onedriveService.getDriveItemSharedLink(sharedLink);
  }

  @Get('shared-link/items')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async listChildrenFromSharedLink(@Query('sharedLink') sharedLink: string) {
    return await this.onedriveService.listChildrenFromSharedLink(sharedLink);
  }

  @Get('shared-link/download')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async downloadFileFromSharedLink(@Query('sharedLink') sharedLink: string) {
    return await this.onedriveService.downloadFileFromSharedLink(sharedLink);
  }

  @Post('upload')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Onedrive })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 10, // 10MB
      },
    }),
  )
  async uploadFileToSharedLink(
    @Query('sharedLink') sharedLink: string,
    @Query('parentFolderId') parentFolderId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.onedriveService.uploadFile(parentFolderId, file.buffer, file.originalname, {
      contentType: file.mimetype,
    });
  }
}
