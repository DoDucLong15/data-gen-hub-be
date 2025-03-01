import { Module } from '@nestjs/common';
import { SystemConfigurationService } from './system-configuration.service';
import { SystemConfigurationController } from './system-configuration.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfigEntity } from './entities/system-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemConfigEntity]),
  ],
  controllers: [SystemConfigurationController],
  providers: [SystemConfigurationService],
  exports: [SystemConfigurationService],
})
export class SystemConfigurationModule {}
