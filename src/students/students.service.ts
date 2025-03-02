import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentEntity } from './entities/student.entity';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { CreateStudentDto, UpdateStudentDto } from './dtos/student.dto';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { ClassService } from 'src/class/class.service';
import { BaseResponse } from 'src/base/types/response.type';
import { OfficeService } from 'src/office/office.service';
import { TemplateSpecificationImportListStudent } from 'src/office/constants/template-list-student.const';
import { JsonMappingListType } from 'src/office/types/json-mapping-list.type';
import { ImportListStudentRequest } from './dtos/import-data.dto';
import { AsyncUtils } from 'src/utils/async.utils';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,
    private readonly classService: ClassService,
    private readonly officeService: OfficeService,
  ) {}

  async create(request: CreateStudentDto, user: UserPayload): Promise<StudentEntity> {
    const _class = await this.classService.getOne({
      where: {
        id: request.classId,
        teacher: {
          email: user.email,
        },
      },
    });
    if (!_class) {
      throw new BadRequestException(`Class ${request.classId} not found`);
    }
    const existingStudent = await this.studentRepository.findOne({
      where: {
        mssv: request.mssv,
        class: {
          id: request.classId,
        },
      },
    });
    if (existingStudent) {
      Logger.warn(
        `Student ${request.mssv} already exists in class ${request.classId}`,
        'StudentsService.create',
      );
      return await this.studentRepository.save({
        ...existingStudent,
        ...request,
      });
    }
    const newStudent = await this.studentRepository.save({
      ...request,
      class: _class,
    });
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
            email: user.email,
          },
        },
      },
    });
    if (!existingStudent) {
      throw new BadRequestException(`Student with id ${id} not found`);
    }
    await this.studentRepository.delete(id);
    return {
      status: 'success',
      message: `Student with id ${id} deleted`,
    };
  }

  async list(classId: string, user: UserPayload): Promise<StudentEntity[]> {
    const _class = await this.classService.getOne({
      where: {
        id: classId,
        teacher: {
          email: user.email,
        },
      },
    });
    if (!_class) {
      throw new BadRequestException(`Class ${classId} not found`);
    }
    return await this.getMany({
      where: {
        class: {
          id: classId,
        },
      },
    });
  }

  async update(request: UpdateStudentDto, user: UserPayload): Promise<StudentEntity> {
    const existingStudent = await this.studentRepository.findOne({
      where: {
        id: request.id,
        class: {
          teacher: {
            email: user.email,
          },
        },
      },
    });
    if (!existingStudent) {
      throw new BadRequestException(`Student with id ${request.id} not found`);
    }
    if (request.mssv && existingStudent.mssv !== request.mssv) {
      throw new BadRequestException(`Cannot update mssv of student`);
    }
    return await this.studentRepository.save({
      ...existingStudent,
      ...request,
    });
  }

  async importListStudents(
    files: Express.Multer.File[],
    request: ImportListStudentRequest,
    user: UserPayload,
  ): Promise<BaseResponse> {
    try {
      const _class = await this.classService.getOne({
        where: {
          id: request.classId,
          teacher: {
            email: user.email,
          },
        },
      });
      if (!_class) {
        throw new BadRequestException(`Class ${request.classId} not found`);
      }
      const newStudents: StudentEntity[] = [];
      for (const file of files) {
        const data = await this.officeService.importList<StudentEntity>(
          file,
          TemplateSpecificationImportListStudent as JsonMappingListType,
        );
        data.forEach((student) => newStudents.push(student));
        await AsyncUtils.delay(1000);
      }
      if (newStudents.length > 0) {
        Logger.verbose(
          `Imported ${newStudents.length} students`,
          'StudentsService.importListStudents',
        );
        for (const newStudent of newStudents) {
          Logger.log(
            `Creating student ${newStudent.mssv}-${newStudent.lastName ?? ''} ${newStudent.middleName ?? ''} ${newStudent.firstName ?? ''}`,
            'StudentsService.importListStudents',
          );
          await this.create(
            {
              ...newStudent,
              classId: request.classId,
            },
            user,
          );
        }
      }
      return {
        status: 'success',
        message: 'Imported students successfully',
        data: newStudents,
      };
    } catch (error) {
      Logger.error(error.message, error.stack, 'StudentsService.importListStudents');
      return {
        status: 'error',
        message: `Error importing students: ${error.message}`,
        data: [],
      };
    }
  }
}
