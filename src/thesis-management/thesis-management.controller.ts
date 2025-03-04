import { ClassSerializerInterceptor, Controller, UseGuards, UseInterceptors } from '@nestjs/common';
import { ThesisManagementService } from './thesis-management.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';

@ApiTags('Thesis Management')
@ApiBearerAuth()
@Controller('thesis-management')
@UseGuards(AccessTokenGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ThesisManagementController {
  constructor(private readonly thesisManagementService: ThesisManagementService) {}
}
