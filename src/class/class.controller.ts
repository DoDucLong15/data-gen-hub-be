import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClassService } from './class.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { CreateClassDto, UpdateClassDto } from './dtos/class.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { ClassEntity } from './entities/class.entity';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';

@ApiTags('Class')
@ApiBearerAuth()
@Controller('class')
@UseGuards(AccessTokenGuard, PoliciesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Classes })
  async create(@Body() request: CreateClassDto, @User() user: UserPayload): Promise<ClassEntity> {
    return await this.classService.create(request, user);
  }

  @Patch()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Classes })
  async update(@Body() request: UpdateClassDto, @User() user: UserPayload): Promise<ClassEntity> {
    return await this.classService.update(request, user);
  }

  @Get()
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Classes })
  async list(@User() user: UserPayload): Promise<ClassEntity[]> {
    return await this.classService.getMany({
      where: { teacher: { email: user.email } },
      order: { createdAt: 'DESC' },
    });
  }

  @Delete(':id')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.Classes })
  async delete(@User() user: UserPayload, @Param('id') id: string): Promise<boolean> {
    return await this.classService.delete(id, user);
  }
}
