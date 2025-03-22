import { Controller, Post } from '@nestjs/common';
import { MockService } from './mock.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Mock')
@Controller('mock')
export class MockController {
  constructor(private readonly mockService: MockService) {}

  @Post('role-user-permission')
  async mockRoleUserPermission() {
    return this.mockService.mockRoleUserPermission();
  }
}
