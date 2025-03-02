import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentEntity } from './entities/student.entity';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { CreateStudentDto, UpdateStudentDto } from './dtos/student.dto';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { ClassService } from 'src/class/class.service';
import { BaseResponse } from 'src/base/types/response.type';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,
    private readonly classService: ClassService,
  ){}

  async _save(request: CreateStudentDto, user: UserPayload): Promise<StudentEntity> {
    const _class = await this.classService.getOne({
      where: {
        id: request.classId,
        teacher: {
          email: user.email
        }
      }
    }) 
    if(!_class) {
      throw new BadRequestException(`Class ${request.classId} not found`);
    }
    const existingStudent = await this.studentRepository.findOne({
      where: {
        mssv: request.mssv,
        class: {
          id: request.classId
        }
      }
    })
    if(existingStudent) {
      Logger.warn(`Student ${request.mssv} already exists in class ${request.classId}`, 'StudentsService.create');
      return await this.studentRepository.save({
        ...existingStudent,
        ...request
      })
    }
    const newStudent = await this.studentRepository.save({
      ...request,
      class: _class
    })
    // TODO: Send email to student
    return newStudent;
  }

  async getOne(options: FindOneOptions<StudentEntity>): Promise<StudentEntity | null> {
    return await this.studentRepository.findOne(options);
  }

  async getMany(options?: FindManyOptions<StudentEntity> | undefined): Promise<StudentEntity[]> {
    return await this.studentRepository.find(options);
  }

  async delete(id: string, user: UserPayload): Promise<BaseResponse> {
    const existingStudent = await this.studentRepository.findOne({
      where: {
        id: id,
        class: {
          teacher: {
            email: user.email
          }
        }
      }
    })
    if(!existingStudent) {
      throw new BadRequestException(`Student with id ${id} not found`);
    }
    await this.studentRepository.delete(id);
    return {
      status: 'success',
      message: `Student with id ${id} deleted`
    }
  }

  async list(classId: string, user: UserPayload): Promise<StudentEntity[]> {
    const _class = await this.classService.getOne({
      where: {
        id: classId,
        teacher: {
          email: user.email
        }
      }
    })
    if(!_class) {
      throw new BadRequestException(`Class ${classId} not found`);
    }
    return await this.getMany({
      where: {
        class: {
          id: classId
        }
      }
    })
  }

  async update(request: UpdateStudentDto, user: UserPayload): Promise<StudentEntity> {
    const existingStudent = await this.studentRepository.findOne({
      where: {
        id: request.id,
        class: {
          teacher: {
            email: user.email
          }
        }
      }
    })
    if(!existingStudent) {
      throw new BadRequestException(`Student with id ${request.id} not found`);
    }
    if(request.mssv && existingStudent.mssv !== request.mssv) {
      throw new BadRequestException(`Cannot update mssv of student`);
    }
    return await this.studentRepository.save({
      ...existingStudent,
      ...request
    })
  }
}
