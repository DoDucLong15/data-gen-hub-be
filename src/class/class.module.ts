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
import { ClassOnedriveInfoEntity } from './entities/onedrive-info.entity';
import { OnedriveModule } from 'src/onedrive/onedrive.module';
import { ClassOnedriveInfoService } from './sub-services/class-onedrive-info.service';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassEntity, ClassDriveInfoEntity, ClassOnedriveInfoEntity]),
    UsersModule,
    forwardRef(() => TemplateSpecificationModule),
    DriveApisModule,
    forwardRef(() => StudentModuleV2),
    ProgressModule,
    OnedriveModule,
    MailerModule,
  ],
  controllers: [ClassController],
  providers: [ClassService, ClassDriveInfoService, ClassOnedriveInfoService],
  exports: [ClassService, ClassDriveInfoService, ClassOnedriveInfoService],
})
export class ClassModule {}
