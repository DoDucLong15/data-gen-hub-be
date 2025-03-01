import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassEntity } from './entities/class.entity';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { CreateClassDto, UpdateClassDto } from './dtos/class.dto';
import { UserPayload } from 'src/auth/types/user-playload.type';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly repository: Repository<ClassEntity>,
    private readonly usersService: UsersService,
  ) {}

  async create(request: CreateClassDto, user: UserPayload): Promise<ClassEntity> {
    const teacher = await this.usersService.getUser({
      where: { email: user.email },
    });
    if (!teacher) {
      throw new BadRequestException(`Teacher with email ${user.email} not found`);
    }
    return await this.repository.save({
      ...request,
      teacher,
    });
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
}
