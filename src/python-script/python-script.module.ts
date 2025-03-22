import { forwardRef, Module } from '@nestjs/common';
import { PythonScriptService } from './python-script.service';
import { PythonScriptController } from './python-script.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [PythonScriptController],
  providers: [PythonScriptService],
  exports: [PythonScriptService],
})
export class PythonScriptModule {}
