import { forwardRef, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [StorageService],
  exports: [StorageService],
  controllers: [StorageController],
  imports: [forwardRef(() => UsersModule)],
})
export class StorageModule {}
