import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Logger,
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
import { BaseResponse } from 'src/base/types/response.type';
import { ProgressService } from 'src/progress/progress.service';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';

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
        { name: 'specificationInput', maxCount: 1 },
        { name: 'specificationOutput', maxCount: 1 },
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
      specificationInput: Express.Multer.File[];
      specificationOutput: Express.Multer.File[];
    },
    @Body() request: ImportExportDynamicDto,
    @User() user: UserPayload,
  ): Promise<BaseResponse> {
    if (
      !files.inputFiles ||
      !files.templateFile ||
      !files.inputFiles.length ||
      !files.templateFile.length ||
      !files.specificationInput ||
      !files.specificationOutput
    ) {
      throw new Error(
        'Input files and template file and specificationInput and specificationOutput are required',
      );
    }
    const generateProcessId = ProgressService.generateId('import-export-dynamic-manual');
    this.officeService
      .dynamic(
        files.inputFiles,
        files.specificationInput[0],
        request,
        files.templateFile[0],
        files.specificationOutput[0],
        generateProcessId,
        user,
      )
      .catch((error) => {
        Logger.error(error, `${this.constructor.name}.importExportDynamic`);
      });
    return {
      status: 'processing',
      message: 'Processing import export dynamic',
      data: {
        processId: generateProcessId,
      },
    };
  }
}
