import { Module } from '@nestjs/common';
import { ThesisManagementService } from './thesis-management.service';
import { ThesisManagementController } from './thesis-management.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentSheetsEntity } from './entities/assignment-sheet.entity';
import { GuidanceReviewEntity } from './entities/guidance-review.entity';
import { SupervisoryCommentsEntity } from './entities/supervisory-comments.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssignmentSheetsEntity,
      GuidanceReviewEntity,
      SupervisoryCommentsEntity,
    ]),
  ],
  controllers: [ThesisManagementController],
  providers: [ThesisManagementService],
})
export class ThesisManagementModule {}
