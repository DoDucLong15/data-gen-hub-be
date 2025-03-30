import { forwardRef, Module } from '@nestjs/common';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassEntity } from './entities/class.entity';
import { UsersModule } from 'src/users/users.module';
import { TemplateSpecificationModule } from 'src/template-specification/template-specification.module';
import { ClassDriveInfoEntity } from './entities/drive-info.entity';
import { DriveApisModule } from 'src/drive-apis/drive-apis.module';
import { ClassDriveInfoService } from './sub-services/class-drive-info.service';
import { StudentModuleV2 } from 'src/student-v2/student-v2.module';
import { ProgressModule } from 'src/progress/progress.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassEntity, ClassDriveInfoEntity]),
    UsersModule,
    forwardRef(() => TemplateSpecificationModule),
    DriveApisModule,
    forwardRef(() => StudentModuleV2),
    ProgressModule,
  ],
  controllers: [ClassController],
  providers: [ClassService, ClassDriveInfoService],
  exports: [ClassService, ClassDriveInfoService],
})
export class ClassModule {}
