import { forwardRef, Module } from '@nestjs/common';
import { ThesisManagementService } from './thesis-management.service';
import { ThesisManagementController } from './thesis-management.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentSheetsEntity } from './entities/assignment-sheet.entity';
import { GuidanceReviewEntity } from './entities/guidance-review.entity';
import { SupervisoryCommentsEntity } from './entities/supervisory-comments.entity';
import { ClassModule } from 'src/class/class.module';
import { StorageModule } from 'src/storage/storage.module';
import { UsersModule } from 'src/users/users.module';
import { OfficeModule } from 'src/office/office.module';
import { TemplateSpecificationModule } from 'src/template-specification/template-specification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssignmentSheetsEntity,
      GuidanceReviewEntity,
      SupervisoryCommentsEntity,
    ]),
    forwardRef(() => ClassModule),
    forwardRef(() => StorageModule),
    forwardRef(() => UsersModule),
    forwardRef(() => OfficeModule),
    forwardRef(() => TemplateSpecificationModule),
  ],
  controllers: [ThesisManagementController],
  providers: [ThesisManagementService],
})
export class ThesisManagementModule {}
