import { forwardRef, Module } from '@nestjs/common';
import { StudentServiceV2 } from './student-v2.service';
import { StudentControllerV2 } from './student-v2.controller';
import { StudentsModule } from 'src/students/students.module';
import { OfficeModule } from 'src/office/office.module';
import { ClassModule } from 'src/class/class.module';
import { TemplateSpecificationModule } from 'src/template-specification/template-specification.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [
    forwardRef(() => StudentsModule),
    forwardRef(() => OfficeModule),
    forwardRef(() => ClassModule),
    forwardRef(() => TemplateSpecificationModule),
    forwardRef(() => StorageModule),
  ],
  controllers: [StudentControllerV2],
  providers: [StudentServiceV2],
})
export class StudentModuleV2 {}
