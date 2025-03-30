import { forwardRef, Module } from '@nestjs/common';
import { StudentServiceV2 } from './student-v2.service';
import { StudentControllerV2 } from './student-v2.controller';
import { StudentsModule } from 'src/students/students.module';
import { OfficeModule } from 'src/office/office.module';
import { ClassModule } from 'src/class/class.module';
import { TemplateSpecificationModule } from 'src/template-specification/template-specification.module';
import { StorageModule } from 'src/storage/storage.module';
import { ProgressModule } from 'src/progress/progress.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    forwardRef(() => StudentsModule),
    forwardRef(() => OfficeModule),
    forwardRef(() => ClassModule),
    forwardRef(() => TemplateSpecificationModule),
    forwardRef(() => StorageModule),
    forwardRef(() => ProgressModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [StudentControllerV2],
  providers: [StudentServiceV2],
  exports: [StudentServiceV2],
})
export class StudentModuleV2 {}
