import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RoleService } from './sub-services/role.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEnity } from './entities/role.entity';
import { UserEntity } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleEnity, UserEntity]),
  ],
  controllers: [UsersController],
  providers: [UsersService, RoleService],
  exports: [UsersService],
})
export class UsersModule {}
