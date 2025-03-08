import {
  Body,
  ClassSerializerInterceptor,
  Controller,
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
import { ImportListStudentRequest } from 'src/students/dtos/import-data.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { BaseResponse } from 'src/base/types/response.type';
import { ExportListStudentRequestV2 } from 'src/students/dtos/export-data.dto';
import { Response } from 'express';

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
    return await this.studentV2Service.importListStudents(files, request, user);
  }

  @Post('student-list/export')
  async exportList(
    @Body() request: ExportListStudentRequestV2,
    @User() user: UserPayload,
    @Res() res: Response,
  ): Promise<void> {
    return await this.studentV2Service.exportListStudent(request, user, res);
  }
}
