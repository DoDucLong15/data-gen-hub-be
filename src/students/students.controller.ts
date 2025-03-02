import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { StudentsService } from './students.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleTypes } from 'src/users/enums/role-types.enum';
import { CreateStudentDto, UpdateStudentDto } from './dtos/student.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { StudentEntity } from './entities/student.entity';
import { BaseResponse } from 'src/base/types/response.type';

@ApiTags('Student')
@ApiBearerAuth()
@Controller('students')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(RoleTypes.ADMIN, RoleTypes.TEACHER)
@UseInterceptors(ClassSerializerInterceptor)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  async create(@Body() request: CreateStudentDto, @User() user: UserPayload): Promise<StudentEntity> {
    return await this.studentsService._save(request, user);
  }

  @Get(':classId')
  async list(@Param('classId') classId: string, @User() user: UserPayload): Promise<StudentEntity[]> {
    return await this.studentsService.list(classId, user);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @User() user: UserPayload): Promise<BaseResponse> {
    return await this.studentsService.delete(id, user);
  }

  @Patch()
  async update(@Body() request: UpdateStudentDto, @User() user: UserPayload): Promise<StudentEntity> {
    return await this.studentsService.update(request, user);
  }
}
