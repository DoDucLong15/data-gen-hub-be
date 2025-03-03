import { forwardRef, Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentEntity } from './entities/student.entity';
import { ClassModule } from 'src/class/class.module';
import { OfficeModule } from 'src/office/office.module';
import { TemplateSpecificationModule } from 'src/template-specification/template-specification.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentEntity]),
    forwardRef(() => ClassModule),
    forwardRef(() => OfficeModule),
    forwardRef(() => TemplateSpecificationModule),
    forwardRef(() => StorageModule),
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
