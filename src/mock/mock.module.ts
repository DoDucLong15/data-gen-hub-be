import { Module } from '@nestjs/common';
import { MockService } from './mock.service';
import { MockController } from './mock.controller';
import { RolesModule } from 'src/roles/roles.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [MockController],
  providers: [MockService],
  imports: [RolesModule, PermissionsModule, UsersModule],
})
export class MockModule {}
