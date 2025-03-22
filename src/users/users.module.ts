import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { MailerModule } from 'src/mailer/mailer.module';
import { RegisterEntity } from './entities/register.entity';
import { RegisterService } from './sub-services/register.service';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RegisterEntity]), MailerModule, RolesModule],
  controllers: [UsersController],
  providers: [UsersService, RegisterService],
  exports: [UsersService, RegisterService],
})
export class UsersModule {}
