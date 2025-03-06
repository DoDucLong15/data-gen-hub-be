import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentEntity } from './entities/student.entity';
import { FindManyOptions, FindOneOptions, In, Repository } from 'typeorm';
import { CreateStudentDto, UpdateStudentDto } from './dtos/student.dto';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { ClassService } from 'src/class/class.service';
import { BaseResponse } from 'src/base/types/response.type';
import { OfficeService } from 'src/office/office.service';
import { TemplateSpecificationImportListStudent } from 'src/office/constants/template-list-student.const';
import { JsonMappingListType } from 'src/office/types/json-mapping-list.type';
import { ImportListStudentRequest, ImportStudentFormDataRequest } from './dtos/import-data.dto';
import { AsyncUtils } from 'src/utils/async.utils';
import { ExportListStudentRequest, ExportStudentFormDataRequest } from './dtos/export-data.dto';
import { Response } from 'express';
import { TemplateSpecificationService } from 'src/template-specification/template-specification.service';
import { StorageService } from 'src/storage/storage.service';
import { streamToBuffer } from 'src/storage/helpers/convert.helper';
import { CommonUtils } from 'src/utils/common.util';
import { TemplateSpecificationImportSingleStudent } from 'src/office/constants/template-single-student.const';
import { JsonMappingSingleType } from 'src/template-specification/types/json.type';
import { SystemConfigUtils } from 'src/system-configuration/utils/system-config.util';
const archiver = require('archiver');

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,
    private readonly classService: ClassService,
    private readonly officeService: OfficeService,
    private readonly templateSpecificationService: TemplateSpecificationService,
    private readonly storageService: StorageService,
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
      if (!files || files.length === 0) {
        throw new BadRequestException('Files are required');
      }
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
      const unzipFiles = await CommonUtils.unzip(files);
      for (const file of unzipFiles) {
        const data = await this.officeService.importList<StudentEntity>(
          file,
          SystemConfigUtils.defaultTemplateSpecificationImportListStudent,
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

  async exportListStudent(
    request: ExportListStudentRequest,
    file: Express.Multer.File,
    user: UserPayload,
    res: Response,
  ): Promise<void> {
    try {
      if (!file) {
        throw new BadRequestException('File is required');
      }
      const students = await this.getMany({
        where: {
          ...(request.studentIds && { id: In(request.studentIds) }),
          class: {
            teacher: {
              email: user.email,
            },
          },
        },
      });
      const result = await this.officeService.exportList<StudentEntity>(
        students,
        file,
        request.jsonMapping,
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(result.originalname!)}"`,
      );
      res.setHeader('Content-Type', result.mimetype ?? file.mimetype);
      res.send(result.buffer);
    } catch (error) {
      Logger.error(error.message, error.stack, 'StudentsService.exportListStudent');
      res.status(500).json({
        status: 'error',
        message: `Error exporting students: ${error.message}`,
      });
    }
  }

  async generateStudentFormData(
    request: ExportStudentFormDataRequest,
    user: UserPayload,
    res: Response,
  ): Promise<void> {
    try {
      const templateSpecification = await this.templateSpecificationService.getOne({
        where: {
          id: request.templateSpecificationId,
          class: {
            teacher: {
              email: user.email,
            },
          },
        },
      });
      if (!templateSpecification) {
        throw new BadRequestException(
          `Template specification ${request.templateSpecificationId} not found`,
        );
      }
      const students = await this.getMany({
        where: {
          ...(request.studentIds && { id: In(request.studentIds) }),
          class: {
            teacher: {
              email: user.email,
            },
          },
        },
      });
      // Download file
      const readable = await this.storageService.downloadFile(templateSpecification.templateFile);
      if (!readable) {
        throw new BadRequestException('Failed to download template file');
      }
      const metadata = await this.storageService.getMetadata(templateSpecification.templateFile);
      if (!metadata) {
        throw new BadRequestException('Failed to get metadata of template file');
      }
      const jsonFile = await this.storageService.downloadFile(templateSpecification.jsonFile);
      if (!jsonFile) {
        throw new BadRequestException('Failed to download json file');
      }
      const jsonBuffer = await streamToBuffer(jsonFile);
      const jsonMapping = JSON.parse(jsonBuffer.toString()) as JsonMappingSingleType;
      const buffer = await streamToBuffer(readable);
      const file: Partial<Express.Multer.File> = {
        buffer: buffer,
        originalname: metadata.name?.split('/').pop(),
        mimetype: metadata.contentType!,
      };

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=${Date.now()}.zip`);

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      for (const student of students) {
        const result = await this.officeService.exportSingle<StudentEntity>(
          student,
          file,
          jsonMapping,
        );
        archive.append(result.buffer, { name: result.originalname });
      }
      archive.finalize();
    } catch (error) {
      Logger.error(error.message, error.stack, 'StudentsService.generateStudentFormData');
      res.status(500).json({
        status: 'error',
        message: `Error generating student form data: ${error.message}`,
      });
    }
  }

  async importStudentFormData(
    files: Express.Multer.File[],
    request: ImportStudentFormDataRequest,
    user: UserPayload,
  ): Promise<BaseResponse> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('Files are required');
      }
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
      const unzipFiles = await CommonUtils.unzip(files);
      const result: any[] = [];
      for (const file of unzipFiles) {
        try {
          Logger.debug(
            `Importing student form data from ${file.originalname}`,
            'StudentsService.importStudentFormData',
          );
          const data = await this.officeService.importSingle<any>(
            file,
            SystemConfigUtils.defaultTemplateSpecificationImportSingleStudent[
              request.type
            ] as JsonMappingSingleType,
          );
          if (data && Object.keys(data).length) result.push(data);
        } catch (error) {
          Logger.error(error.message, error.stack, 'StudentsService.importStudentFormData');
        } finally {
          await AsyncUtils.delay(1000);
        }
      }
      return {
        status: 'success',
        message: 'Imported student form data successfully',
        data: result,
      };
    } catch (error) {
      Logger.error(error.message, error.stack, 'StudentsService.importStudentFormData');
      return {
        status: 'error',
        message: `Error importing student form data: ${error.message}`,
      };
    }
  }
}
