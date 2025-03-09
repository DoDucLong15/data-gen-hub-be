import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Logger,
  Post,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { StudentServiceV2 } from './student-v2.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleTypes } from 'src/users/enums/role-types.enum';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ImportListStudentRequest,
  ImportStudentFormDataRequestV2,
} from 'src/students/dtos/import-data.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { BaseResponse } from 'src/base/types/response.type';
import {
  ExportListStudentRequestV2,
  ExportStudentFormDataRequestV2,
} from 'src/students/dtos/export-data.dto';
import { Response } from 'express';
import { ProgressService } from 'src/progress/progress.service';

@ApiTags('Student V2')
@ApiBearerAuth()
@Controller('student-v2')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(RoleTypes.ADMIN, RoleTypes.TEACHER)
@UseInterceptors(ClassSerializerInterceptor)
export class StudentControllerV2 {
  constructor(private readonly studentV2Service: StudentServiceV2) {}

  @Post('student-list/import')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 1024 * 1024 * 5,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: ImportListStudentRequest,
  })
  async importList(
    @Body() request: ImportListStudentRequest,
    @User() user: UserPayload,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<BaseResponse> {
    const generateProcessId = ProgressService.generateId('import-student-list-manual');
    this.studentV2Service
      .importListStudents(files, request, user, generateProcessId)
      .catch((error) => {
        Logger.error(error, `${this.constructor.name}.importList`);
      });
    return {
      status: 'processing',
      message: 'Processing import student list',
      data: {
        processId: generateProcessId,
      },
    };
  }

  @Post('student-list/export')
  async exportList(
    @Body() request: ExportListStudentRequestV2,
    @User() user: UserPayload,
    @Res() res: Response,
  ): Promise<void> {
    const generateProcessId = ProgressService.generateId('export-student-list-manual');
    return await this.studentV2Service.exportListStudent(request, user, res, generateProcessId);
  }

  @Post('thesis-document/export')
  async generate(
    @Body() request: ExportStudentFormDataRequestV2,
    @User() user: UserPayload,
  ): Promise<BaseResponse> {
    const generateProcessId = ProgressService.generateId(`export-${request.thesisDocType}-manual`);
    this.studentV2Service
      .generateStudentFormData(request, user, generateProcessId)
      .catch((error) => {
        Logger.error(error, `${this.constructor.name}.generate`);
      });
    return {
      status: 'processing',
      message: 'Processing generate student form data',
      data: {
        processId: generateProcessId,
      },
    };
  }

  @Post('thesis-document/import')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 1024 * 1024 * 10,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: ImportStudentFormDataRequestV2,
  })
  async importStudentFormData(
    @Body() request: ImportStudentFormDataRequestV2,
    @User() user: UserPayload,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<BaseResponse> {
    const generateProcessId = ProgressService.generateId(`import-${request.thesisDocType}-manual`);
    this.studentV2Service
      .importStudentFormData(files, request, user, generateProcessId)
      .catch((error) => {
        Logger.error(error, `${this.constructor.name}.importStudentFormData`);
      });
    return {
      status: 'processing',
      message: 'Processing import student form data',
      data: {
        processId: generateProcessId,
      },
    };
  }
}
