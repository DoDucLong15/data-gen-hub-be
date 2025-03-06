import { Module } from '@nestjs/common';
import { PythonScriptService } from './python-script.service';
import { PythonScriptController } from './python-script.controller';

@Module({
  controllers: [PythonScriptController],
  providers: [PythonScriptService],
})
export class PythonScriptModule {}
