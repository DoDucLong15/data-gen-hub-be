import { forwardRef, Module } from '@nestjs/common';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassEntity } from './entities/class.entity';
import { UsersModule } from 'src/users/users.module';
import { TemplateSpecificationModule } from 'src/template-specification/template-specification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassEntity]),
    UsersModule,
    forwardRef(() => TemplateSpecificationModule),
  ],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService],
})
export class ClassModule {}
