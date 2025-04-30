import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClassService } from './class.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import {
  CreateClassDto,
  DownloadFileFromDriveDto,
  SyncClassDriveDataRequest,
  UpdateClassDto,
} from './dtos/class.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { ClassEntity } from './entities/class.entity';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { ClassDriveInfoService } from './sub-services/class-drive-info.service';
import { DriveItem, UploadFilesResponse } from 'src/drive-apis/types/drive-config.type';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateFolderDto, UploadFilesDto } from 'src/drive-apis/dtos/drive.dto';
import { BaseResponse } from 'src/base/types/response.type';
import { ProgressService } from 'src/progress/progress.service';
import { ClassOnedriveInfoService } from './sub-services/class-onedrive-info.service';
import { TOnedriveHierarchy } from 'src/onedrive/types/onedrive.type';

@ApiTags('Class')
@ApiBearerAuth()
@Controller('class')
@UseGuards(AccessTokenGuard, PoliciesGuard)
export class ClassController {
  constructor(
    private readonly classService: ClassService,
    private readonly classDriveInfoService: ClassDriveInfoService,
    private readonly classOnedriveInfoService: ClassOnedriveInfoService,
  ) {}

  @Post()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Classes })
  @UseInterceptors(ClassSerializerInterceptor)
  async create(@Body() request: CreateClassDto, @User() user: UserPayload): Promise<ClassEntity> {
    return await this.classService.create(request, user);
  }

  @Patch()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Classes })
  @UseInterceptors(ClassSerializerInterceptor)
  async update(@Body() request: UpdateClassDto, @User() user: UserPayload): Promise<ClassEntity> {
    return await this.classService.update(request, user);
  }

  @Get()
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Classes })
  @UseInterceptors(ClassSerializerInterceptor)
  async list(@User() user: UserPayload): Promise<ClassEntity[]> {
    return await this.classService.getMany({
      where: { teacher: { email: user.email } },
      order: { createdAt: 'DESC' },
    });
  }

  @Delete(':id')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Classes })
  @UseInterceptors(ClassSerializerInterceptor)
  async delete(@User() user: UserPayload, @Param('id') id: string): Promise<boolean> {
    return await this.classService.delete(id, user);
  }

  @Get(':id/drive-info')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Thesis_GoogleDrive })
  async getDriveInfo(@Param('id') id: string, @User() user: UserPayload): Promise<DriveItem> {
    return await this.classDriveInfoService.getByClassId(id, user);
  }

  @Get(':classId/drive-info/download')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Thesis_GoogleDrive })
  async downloadDriveInfo(
    @Param('classId') classId: string,
    @Query() request: DownloadFileFromDriveDto,
    @Res() res: Response,
    @User() user: UserPayload,
  ) {
    return await this.classDriveInfoService.downloadFile(classId, request, res, user);
  }

  @Post(':classId/drive-info/upload')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
    }),
  )
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Thesis_GoogleDrive })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadFilesDto,
  })
  async uploadFiles(
    @Param('classId') classId: string,
    @Body() body: UploadFilesDto,
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: UserPayload,
  ): Promise<UploadFilesResponse> {
    return await this.classDriveInfoService.uploadFiles(classId, files, body.folderId, user);
  }

  @Delete(':classId/drive-info/:fileId')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Thesis_GoogleDrive })
  async deleteFile(
    @Param('classId') classId: string,
    @Param('fileId') fileId: string,
    @User() user: UserPayload,
  ): Promise<boolean> {
    return await this.classDriveInfoService.deleteFile(classId, fileId, user);
  }

  @Post(':classId/drive-info/folders')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Thesis_GoogleDrive })
  async createFolder(
    @Body() body: CreateFolderDto,
    @Param('classId') classId: string,
    @User() user: UserPayload,
  ) {
    return await this.classDriveInfoService.createFolder(
      classId,
      body.folderName,
      body.parentFolderId,
      user,
    );
  }

  @Post('drive-info/sync')
  @ApiBody({
    type: SyncClassDriveDataRequest,
    required: false,
  })
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Thesis_GoogleDrive })
  async syncDriveInfo(
    @Body() request: SyncClassDriveDataRequest,
    @User() user: UserPayload,
  ): Promise<BaseResponse> {
    const generateProcessId = ProgressService.generateId('sync-class-drive-data-manual');
    this.classDriveInfoService
      .syncClassDriveData(request, user, generateProcessId)
      .catch((error) => {
        Logger.error(error, `${this.constructor.name}.syncDriveInfo`);
      });
    return {
      status: 'processing',
      message: 'Processing sync class drive data',
      data: {
        processId: generateProcessId,
      },
    };
  }

  @Get(':id/onedrive-info')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Thesis_Onedrive })
  async getOnedriveInfo(
    @Param('id') id: string,
    @User() user: UserPayload,
  ): Promise<TOnedriveHierarchy> {
    return await this.classOnedriveInfoService.getByClassId(id, user);
  }

  @Post(':classId/onedrive-info/upload')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
    }),
  )
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Thesis_Onedrive })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadFilesDto,
  })
  async uploadOnedriveFiles(
    @Param('classId') classId: string,
    @Body() body: UploadFilesDto,
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: UserPayload,
  ): Promise<any> {
    return await this.classOnedriveInfoService.uploadFiles(
      classId,
      files,
      body.driveId,
      body.folderId,
      user,
    );
  }

  @Delete(':classId/onedrive-info/:driveId/:fileId')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Thesis_Onedrive })
  async deleteOnedriveFile(
    @Param('classId') classId: string,
    @Param('driveId') driveId: string,
    @Param('fileId') fileId: string,
    @User() user: UserPayload,
  ): Promise<boolean> {
    return await this.classOnedriveInfoService.deleteFile(classId, driveId, fileId, user);
  }

  @Post('onedrive-info/sync')
  @ApiBody({
    type: SyncClassDriveDataRequest,
    required: false,
  })
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Thesis_Onedrive })
  async syncOnedriveInfo(
    @Body() request: SyncClassDriveDataRequest,
    @User() user: UserPayload,
  ): Promise<BaseResponse> {
    const generateProcessId = ProgressService.generateId('sync-class-onedrive-data-manual');
    this.classOnedriveInfoService
      .syncClassDriveData(request, user, generateProcessId)
      .catch((error) => {
        Logger.error(error, `${this.constructor.name}.syncOnedriveInfo`);
      });
    return {
      status: 'processing',
      message: 'Processing sync class onedrive data',
      data: {
        processId: generateProcessId,
      },
    };
  }
}
