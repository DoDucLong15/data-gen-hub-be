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
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleTypes } from 'src/users/enums/role-types.enum';
import { BaseResponse } from 'src/base/types/response.type';

@ApiTags('Class')
@ApiBearerAuth()
@Controller('class')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(RoleTypes.ADMIN, RoleTypes.TEACHER)
@UseInterceptors(ClassSerializerInterceptor)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  async create(@Body() request: CreateClassDto, @User() user: UserPayload): Promise<ClassEntity> {
    return await this.classService.create(request, user);
  }

  @Patch()
  async update(@Body() request: UpdateClassDto, @User() user: UserPayload): Promise<ClassEntity> {
    return await this.classService.update(request, user);
  }

  @Get()
  async list(@User() user: UserPayload): Promise<ClassEntity[]> {
    return await this.classService.getMany({
      where: { teacher: { email: user.email } },
      order: { createdAt: 'DESC' },
    });
  }

  @Delete(':id')
  async delete(@User() user: UserPayload, @Param('id') id: string): Promise<boolean> {
    return await this.classService.delete(id, user);
  }
}
