import { Controller } from '@nestjs/common';
import { OfficeService } from './office.service';

@Controller('office')
export class OfficeController {
  constructor(private readonly officeService: OfficeService) {}
}
