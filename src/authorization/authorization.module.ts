import { forwardRef, Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { PoliciesGuard } from './guards/policies.guard';

@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [PoliciesGuard],
  exports: [PoliciesGuard],
})
export class AuthorizationModule {}
