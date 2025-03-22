import { Controller, Get, UseGuards } from '@nestjs/common';
import { PythonScriptService } from './python-script.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { EAction } from 'src/permissions/enums/action.enum';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';

@ApiTags('Python Script')
@Controller('python-script')
@UseGuards(AccessTokenGuard, PoliciesGuard)
export class PythonScriptController {
  constructor(private readonly pythonScriptService: PythonScriptService) {}

  @Get('test')
  async testPythonScript() {
    const data = await this.pythonScriptService.runPythonScript('../python-script/main.py');
    return JSON.parse(data);
  }

  @Get('db-gen-spec')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.PythonScript_DBGenSpec })
  async generateSpec() {
    const data = await this.pythonScriptService.runPythonScript('../python-script/dbgenspec.py');
    return JSON.parse(data);
  }
}
