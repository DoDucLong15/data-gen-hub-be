import { Controller, Get } from '@nestjs/common';
import { PythonScriptService } from './python-script.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Python Script')
@Controller('python-script')
export class PythonScriptController {
  constructor(private readonly pythonScriptService: PythonScriptService) {}

  @Get('test')
  async testPythonScript() {
    const data = await this.pythonScriptService.runPythonScript('../python-script/main.py');
    return JSON.parse(data);
  }
}
