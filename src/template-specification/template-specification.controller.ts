import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TemplateSpecificationService } from './template-specification.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {
  CreateTemplateSpecificationDto,
  UpdateTemplateSpecificationDto,
} from './dtos/template-specification.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { TemplateSpecificationEntity } from './entities/template-specification.entity';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { EAction } from 'src/permissions/enums/action.enum';

@ApiTags('Template Specification')
@ApiBearerAuth()
@Controller('template-specification')
@UseGuards(AccessTokenGuard, PoliciesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TemplateSpecificationController {
  constructor(private readonly templateSpecificationService: TemplateSpecificationService) {}

  @Post()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Students })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'jsonFile', maxCount: 1 },
        { name: 'templateFile', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 1024 * 1024 * 5,
        },
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateTemplateSpecificationDto,
  })
  async create(
    @Body() request: CreateTemplateSpecificationDto,
    @UploadedFiles()
    files: {
      jsonFile: Express.Multer.File[];
      templateFile: Express.Multer.File[];
    },
    @User() user: UserPayload,
  ): Promise<TemplateSpecificationEntity> {
    return await this.templateSpecificationService.create(
      request,
      files?.templateFile?.[0],
      files?.jsonFile?.[0],
      user,
    );
  }

  @Patch()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Students })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'jsonFile', maxCount: 1 },
        { name: 'templateFile', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 1024 * 1024 * 5,
        },
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateTemplateSpecificationDto,
  })
  async update(
    @Body() request: UpdateTemplateSpecificationDto,
    @UploadedFiles()
    files: {
      jsonFile: Express.Multer.File[];
      templateFile: Express.Multer.File[];
    },
    @User() user: UserPayload,
  ): Promise<TemplateSpecificationEntity> {
    return await this.templateSpecificationService.update(
      request,
      user,
      files?.templateFile?.[0],
      files?.jsonFile?.[0],
    );
  }

  @Delete(':id')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Students })
  async delete(@Param('id') id: string, @User() user: UserPayload): Promise<boolean> {
    return await this.templateSpecificationService.delete(id, user);
  }

  @Get(':classId')
  async list(
    @User() user: UserPayload,
    @Param('classId') classId: string,
  ): Promise<TemplateSpecificationEntity[]> {
    return await this.templateSpecificationService.list(classId, user);
  }
}
