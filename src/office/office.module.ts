import { forwardRef, Module } from '@nestjs/common';
import { OfficeService } from './office.service';
import { OfficeController } from './office.controller';
import { PythonScriptModule } from 'src/python-script/python-script.module';
import { ProgressModule } from 'src/progress/progress.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [PythonScriptModule, ProgressModule, MailerModule, forwardRef(() => UsersModule)],
  controllers: [OfficeController],
  providers: [OfficeService],
  exports: [OfficeService],
})
export class OfficeModule {}
