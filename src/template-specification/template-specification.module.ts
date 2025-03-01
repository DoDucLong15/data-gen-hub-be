import { forwardRef, Module } from '@nestjs/common';
import { TemplateSpecificationService } from './template-specification.service';
import { TemplateSpecificationController } from './template-specification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateSpecificationEntity } from './entities/template-specification.entity';
import { StorageModule } from 'src/storage/storage.module';
import { ClassModule } from 'src/class/class.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TemplateSpecificationEntity]),
    StorageModule,
    forwardRef(() => ClassModule),
  ],
  controllers: [TemplateSpecificationController],
  providers: [TemplateSpecificationService],
  exports: [TemplateSpecificationService],
})
export class TemplateSpecificationModule {}
