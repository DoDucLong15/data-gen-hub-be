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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TemplateSpecificationService } from './template-specification.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleTypes } from 'src/users/enums/role-types.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CreateTemplateSpecificationDto,
  UpdateTemplateSpecificationDto,
} from './dtos/template-specification.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { TemplateSpecificationEntity } from './entities/template-specification.entity';

@ApiTags('Template Specification')
@ApiBearerAuth()
@Controller('template-specification')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(RoleTypes.ADMIN, RoleTypes.TEACHER)
@UseInterceptors(ClassSerializerInterceptor)
export class TemplateSpecificationController {
  constructor(private readonly templateSpecificationService: TemplateSpecificationService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 5,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateTemplateSpecificationDto,
  })
  async create(
    @Body() request: CreateTemplateSpecificationDto,
    @UploadedFile() file: Express.Multer.File,
    @User() user: UserPayload,
  ): Promise<TemplateSpecificationEntity> {
    return await this.templateSpecificationService.create(request, file, user);
  }

  @Patch()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 5,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateTemplateSpecificationDto,
  })
  async update(
    @Body() request: UpdateTemplateSpecificationDto,
    @UploadedFile() file: Express.Multer.File,
    @User() user: UserPayload,
  ): Promise<TemplateSpecificationEntity> {
    return await this.templateSpecificationService.update(request, user, file);
  }

  @Delete(':id')
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
