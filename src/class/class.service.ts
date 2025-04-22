import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassEntity } from './entities/class.entity';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { CreateClassDto, UpdateClassDto } from './dtos/class.dto';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { TemplateSpecificationService } from 'src/template-specification/template-specification.service';
import { SystemConfigUtils } from 'src/system-configuration/utils/system-config.util';
import { TemplateSpecificationEntity } from 'src/template-specification/entities/template-specification.entity';
import { ClassDriveInfoService } from './sub-services/class-drive-info.service';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly repository: Repository<ClassEntity>,
    private readonly usersService: UsersService,
    private readonly templateSpecificationService: TemplateSpecificationService,
    private readonly classDriveInfoService: ClassDriveInfoService,
  ) {}

  async create(request: CreateClassDto, user: UserPayload): Promise<ClassEntity> {
    const teacher = await this.usersService.getUser({
      where: { email: user.email },
    });
    if (!teacher) {
      throw new BadRequestException(`Teacher with email ${user.email} not found`);
    }
    const newClass = await this.repository.save({
      ...request,
      teacher,
    });
    if (
      SystemConfigUtils.defaultTemplateSpecification &&
      SystemConfigUtils.defaultTemplateSpecification.length > 0
    ) {
      this.templateSpecificationService
        ._save(
          SystemConfigUtils.defaultTemplateSpecification.map((template) => {
            const { id, ...restTemplate } = template;
            return {
              ...restTemplate,
              class: newClass,
            } as TemplateSpecificationEntity;
          }),
        )
        .then((res) =>
          Logger.verbose(
            `Default template specification created for class ${newClass.id}`,
            'ClassService.create',
          ),
        )
        .catch((error) => Logger.error(error, 'ClassService.create'));
    }
    if (request.driveId) {
      this.classDriveInfoService.create(newClass.id, request.driveId).catch(async (error) => {
        Logger.error(error, 'ClassService.create');
        await this.repository.update(newClass.id, {
          driveId: null,
        });
      });
    }
    return newClass;
  }

  async getOne(options: FindOneOptions<ClassEntity>): Promise<ClassEntity | null> {
    return await this.repository.findOne(options);
  }

  async getMany(options?: FindManyOptions<ClassEntity> | undefined): Promise<ClassEntity[]> {
    return await this.repository.find(options);
  }

  async update(request: UpdateClassDto, user: UserPayload): Promise<ClassEntity> {
    const _class = await this.getOne({ where: { id: request.id, teacher: { email: user.email } } });
    if (!_class) {
      throw new BadRequestException(`Class with id ${request.id} not found`);
    }
    if (request.driveId && _class.driveId !== request.driveId) {
      this.classDriveInfoService.create(_class.id, request.driveId).catch(async (error) => {
        Logger.error(error, 'ClassService.update');
        await this.repository.update(_class.id, {
          driveId: _class.driveId,
        });
      });
    }
    return await this.repository.save({
      ..._class,
      ...request,
    });
  }

  async delete(id: string, user: UserPayload): Promise<boolean> {
    const _class = await this.getOne({ where: { id, teacher: { email: user.email } } });
    if (!_class) {
      throw new BadRequestException(`Class with id ${id} not found`);
    }
    await this.repository.softDelete(id);
    return true;
  }

  async getStudentsByClassId(classId: string) {
    const classObj = await this.repository.findOne({
      where: { id: classId },
      relations: ['students'],
    });
    if (!classObj) return [];
    return classObj.students.map((stu) => ({
      ...stu,
      fullName:
        stu.fullName ||
        `${stu.lastName ?? ''} ${stu.middleName ?? ''} ${stu.firstName ?? ''}`.trim(),
    }));
  }
}
