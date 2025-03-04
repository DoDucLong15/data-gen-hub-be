import { Module } from '@nestjs/common';
import { ThesisManagementService } from './thesis-management.service';
import { ThesisManagementController } from './thesis-management.controller';

@Module({
  controllers: [ThesisManagementController],
  providers: [ThesisManagementService],
})
export class ThesisManagementModule {}
