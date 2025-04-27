import {
  Body,
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
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from './dtos/user.dto';
import { UserResponse } from './types/user-response.type';
import { MapperUserResponse } from './helpers/mapper.helper';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { RegisterEntity } from './entities/register.entity';
import { RegisterService } from './sub-services/register.service';
import { BaseResponse } from 'src/base/types/response.type';
import { ApproveRegisterDto } from './dtos/register.dto';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AccessTokenGuard, PoliciesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly registerService: RegisterService,
  ) {}

  @Post()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Users })
  async createUser(@Body() request: CreateUserDto): Promise<UserResponse> {
    return await this.usersService.createUser(request);
  }

  @Patch()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 5,
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      },
    }),
  )
  async updateUser(
    @Body() request: UpdateUserDto,
    @User() user: UserPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserResponse> {
    return await this.usersService.updateUserInfo(request, user, file);
  }

  @Get('me')
  async getUserInfo(@User() user: UserPayload): Promise<UserResponse> {
    return await this.usersService.getUserInfo(user.email);
  }

  @Get('/one/:id')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_Users })
  async getUserById(@Param('id') id: string): Promise<UserResponse | null> {
    return await this.usersService
      .getUserById(id)
      .then((data) => (data ? MapperUserResponse(data) : null));
  }

  @Get()
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_Users })
  async getAllUsers(): Promise<UserResponse[]> {
    return await this.usersService
      .getUsers({
        order: { createdAt: 'DESC' },
        withDeleted: true,
      })
      .then((users) => users.map(MapperUserResponse));
  }

  @Delete(':id')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Users })
  async deleteUser(@Param('id') id: string): Promise<boolean> {
    return await this.usersService.deleteUser(id);
  }

  @Get('registers')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Users })
  async getRegisters(): Promise<RegisterEntity[]> {
    return await this.registerService.getRegisters();
  }

  @Post('registers')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Users })
  async approveRegister(@Body() request: ApproveRegisterDto): Promise<BaseResponse> {
    return await this.registerService.approveRegister(request);
  }

  @Delete('registers/:id')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Users })
  async rejectRegister(@Param('id') id: string): Promise<BaseResponse> {
    return await this.registerService.rejectRegister(id);
  }
}
