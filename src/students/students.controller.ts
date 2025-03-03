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
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleTypes } from 'src/users/enums/role-types.enum';
import { CreateStudentDto, UpdateStudentDto } from './dtos/student.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { StudentEntity } from './entities/student.entity';
import { BaseResponse } from 'src/base/types/response.type';
import { ImportListStudentRequest } from './dtos/import-data.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ExportListStudentRequest, ExportStudentFormDataRequest } from './dtos/export-data.dto';
import { Response } from 'express';
import { request } from 'http';

@ApiTags('Student')
@ApiBearerAuth()
@Controller('students')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(RoleTypes.ADMIN, RoleTypes.TEACHER)
@UseInterceptors(ClassSerializerInterceptor)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  async create(
    @Body() request: CreateStudentDto,
    @User() user: UserPayload,
  ): Promise<StudentEntity> {
    return await this.studentsService.create(request, user);
  }

  @Get(':classId')
  async list(
    @Param('classId') classId: string,
    @User() user: UserPayload,
  ): Promise<StudentEntity[]> {
    return await this.studentsService.list(classId, user);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @User() user: UserPayload): Promise<BaseResponse> {
    return await this.studentsService.delete(id, user);
  }

  @Patch()
  async update(
    @Body() request: UpdateStudentDto,
    @User() user: UserPayload,
  ): Promise<StudentEntity> {
    return await this.studentsService.update(request, user);
  }

  @Post('import/list')
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
  async generate(
    @Body() request: ExportStudentFormDataRequest,
    @User() user: UserPayload,
    @Res() res: Response,
  ): Promise<void> {
    return await this.studentsService.generateStudentFormData(request, user, res);
  }
}
