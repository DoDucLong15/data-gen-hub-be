import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RoleService } from './sub-services/role.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEnity } from './entities/role.entity';
import { UserEntity } from './entities/user.entity';
import { MailerModule } from 'src/mailer/mailer.module';
import { RegisterEntity } from './entities/register.entity';
import { RegisterService } from './sub-services/register.service';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEnity, UserEntity, RegisterEntity]), MailerModule],
  controllers: [UsersController],
  providers: [UsersService, RoleService, RegisterService],
  exports: [UsersService, RegisterService],
})
export class UsersModule {}
