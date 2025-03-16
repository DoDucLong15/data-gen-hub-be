import { Module } from '@nestjs/common';
import { OfficeService } from './office.service';
import { OfficeController } from './office.controller';
import { PythonScriptModule } from 'src/python-script/python-script.module';
import { ProgressModule } from 'src/progress/progress.module';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [PythonScriptModule, ProgressModule, MailerModule],
  controllers: [OfficeController],
  providers: [OfficeService],
  exports: [OfficeService],
})
export class OfficeModule {}
