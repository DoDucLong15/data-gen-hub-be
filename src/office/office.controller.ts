import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { OfficeService } from './office.service';
import { ImportExportDynamicDto } from './dtos/office.dto';
import { Response } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorator';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { RoleTypes } from 'src/users/enums/role-types.enum';

@ApiTags('Office')
@ApiBearerAuth()
@Controller('office')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(RoleTypes.ADMIN, RoleTypes.TEACHER)
@UseInterceptors(ClassSerializerInterceptor)
export class OfficeController {
  constructor(private readonly officeService: OfficeService) {}

  @ApiBody({
    type: ImportExportDynamicDto,
  })
  @ApiConsumes('multipart/form-data')
  @Post('import-export-dynamic')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'inputFiles', maxCount: 20 },
        { name: 'templateFile', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 1024 * 1024 * 10,
        },
      },
    ),
  )
  async importExportDynamic(
    @UploadedFiles()
    files: {
      inputFiles: Express.Multer.File[];
      templateFile: Express.Multer.File[];
    },
    @Body() request: ImportExportDynamicDto,
    @Res() res: Response,
  ): Promise<void> {
    if (
      !files.inputFiles ||
      !files.templateFile ||
      !files.inputFiles.length ||
      !files.templateFile.length
    ) {
      throw new Error('Input files and template file are required');
    }
    return await this.officeService.dynamic(files.inputFiles, request, files.templateFile[0], res);
  }
}
