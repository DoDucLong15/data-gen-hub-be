import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { CreateStudentDto, UpdateStudentDto } from './dtos/student.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { StudentEntity } from './entities/student.entity';
import { BaseResponse } from 'src/base/types/response.type';
import { ImportListStudentRequest, ImportStudentFormDataRequest } from './dtos/import-data.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ExportListStudentRequest, ExportStudentFormDataRequest } from './dtos/export-data.dto';
import { Response } from 'express';
import { request } from 'http';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { EAction } from 'src/permissions/enums/action.enum';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { ESubject } from 'src/authorization/enums/subject.enum';

@ApiTags('Student')
@ApiBearerAuth()
@Controller('students')
@UseGuards(AccessTokenGuard, PoliciesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Students })
  async create(
    @Body() request: CreateStudentDto,
    @User() user: UserPayload,
  ): Promise<StudentEntity> {
    return await this.studentsService.create(request, user);
  }

  @Get(':classId')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Students })
  async list(
    @Param('classId') classId: string,
    @User() user: UserPayload,
  ): Promise<StudentEntity[]> {
    return await this.studentsService.list(classId, user);
  }

  @Delete(':id')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Students })
  async delete(@Param('id') id: string, @User() user: UserPayload): Promise<BaseResponse> {
    return await this.studentsService.delete(id, user);
  }

  @Patch()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Students })
  async update(
    @Body() request: UpdateStudentDto,
    @User() user: UserPayload,
  ): Promise<StudentEntity> {
    return await this.studentsService.update(request, user);
  }

  @Post('import/list')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Students })
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
    return await this.studentsService.importListStudents(files, request, user);
  }

  @Post('export/list')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Students })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 5,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: ExportListStudentRequest,
  })
  async exportList(
    @Body() request: ExportListStudentRequest,
    @User() user: UserPayload,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ): Promise<void> {
    return await this.studentsService.exportListStudent(request, file, user, res);
  }

  @Post('generate')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Students })
  async generate(
    @Body() request: ExportStudentFormDataRequest,
    @User() user: UserPayload,
    @Res() res: Response,
  ): Promise<void> {
    return await this.studentsService.generateStudentFormData(request, user, res);
  }

  @Post('import/single')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Students })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 1024 * 1024 * 10,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: ImportStudentFormDataRequest,
  })
  async importStudentFormData(
    @Body() request: ImportStudentFormDataRequest,
    @User() user: UserPayload,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<BaseResponse> {
    return await this.studentsService.importStudentFormData(files, request, user);
  }
}
