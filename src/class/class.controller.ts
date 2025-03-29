import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClassService } from './class.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { CreateClassDto, DownloadFileFromDriveDto, UpdateClassDto } from './dtos/class.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { ClassEntity } from './entities/class.entity';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { ClassDriveInfoService } from './sub-services/class-drive-info.service';
import { DriveItem } from 'src/drive-apis/types/drive-config.type';
import { Response } from 'express';

@ApiTags('Class')
@ApiBearerAuth()
@Controller('class')
@UseGuards(AccessTokenGuard, PoliciesGuard)
export class ClassController {
  constructor(
    private readonly classService: ClassService,
    private readonly classDriveInfoService: ClassDriveInfoService,
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
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Classes })
  async getDriveInfo(@Param('id') id: string): Promise<DriveItem[]> {
    return await this.classDriveInfoService.getByClassId(id);
  }

  @Get(':classId/drive-info/download')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Classes })
  async downloadDriveInfo(
    @Param('classId') classId: string,
    @Query() request: DownloadFileFromDriveDto,
    @Res() res: Response,
  ) {
    return await this.classDriveInfoService.downloadFile(classId, request, res);
  }
}
