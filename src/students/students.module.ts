import { forwardRef, Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentEntity } from './entities/student.entity';
import { ClassModule } from 'src/class/class.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentEntity]),
    forwardRef(() => ClassModule)
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService]
})
export class StudentsModule {}
