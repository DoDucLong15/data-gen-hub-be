import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StudentEntity } from './entities/student.entity';
import { DeleteResult, Repository } from 'typeorm';
import { ClassService } from '../class/class.service';
import { BadRequestException } from '@nestjs/common';
import { UserPayload } from '../auth/types/user-playload.type';
import { CreateStudentDto, UpdateStudentDto } from './dtos/student.dto';
import { ClassEntity } from '../class/entities/class.entity';
import { OfficeService } from '../office/office.service';
import { TemplateSpecificationService } from '../template-specification/template-specification.service';
import { StorageService } from '../storage/storage.service';

describe('StudentsService', () => {
  let service: StudentsService;
  let studentRepository: Repository<StudentEntity>;
  let classService: ClassService;

  // Mock data
  const mockUser: UserPayload = {
    email: 'teacher@example.com',
    role: 'teacher',
  };

  const mockClass = {
    id: 'class-id-1',
    name: 'Test Class',
    classCode: 'TC001',
    courseCode: 'CC001',
    semester: '2023-2024',
    teacher: {
      email: 'teacher@example.com',
    },
    studentPaths: [],
    students: [],
  } as unknown as ClassEntity;

  const mockStudent = {
    id: 'student-id-1',
    mssv: '20200001',
    lastName: 'Nguyen',
    middleName: 'Van',
    firstName: 'A',
    email: 'student1@example.com',
    phone: '0123456789',
    projectTitle: 'Project 1',
    supervisor: 'Supervisor 1',
    reviewer: 'Reviewer 1',
    studentClassName: 'Class 1',
    class: mockClass,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    get fullName() {
      return `${this.lastName} ${this.middleName} ${this.firstName}`;
    },
  } as unknown as StudentEntity;

  const mockStudents = [
    mockStudent,
    {
      id: 'student-id-2',
      mssv: '20200002',
      lastName: 'Tran',
      middleName: 'Thi',
      firstName: 'B',
      email: 'student2@example.com',
      phone: '0123456788',
      projectTitle: 'Project 2',
      supervisor: 'Supervisor 2',
      reviewer: 'Reviewer 2',
      studentClassName: 'Class 2',
      class: mockClass,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      get fullName() {
        return `${this.lastName} ${this.middleName} ${this.firstName}`;
      },
    } as unknown as StudentEntity,
  ];

  const mockCreateStudentDto: CreateStudentDto = {
    mssv: '20200001',
    lastName: 'Nguyen',
    middleName: 'Van',
    firstName: 'A',
    email: 'student1@example.com',
    phone: '0123456789',
    projectTitle: 'Project 1',
    supervisor: 'Supervisor 1',
    reviewer: 'Reviewer 1',
    studentClassName: 'Class 1',
    classId: 'class-id-1',
  };

  const mockUpdateStudentDto: UpdateStudentDto = {
    id: 'student-id-1',
    lastName: 'Nguyen',
    middleName: 'Van',
    firstName: 'A Updated',
    email: 'student1.updated@example.com',
    phone: '0123456780',
    projectTitle: 'Project 1 Updated',
    supervisor: 'Supervisor 1 Updated',
    reviewer: 'Reviewer 1 Updated',
    studentClassName: 'Class 1 Updated',
  };

  const mockDeleteResult: DeleteResult = {
    raw: [],
    affected: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: getRepositoryToken(StudentEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ClassService,
          useValue: {
            getOne: jest.fn(),
          },
        },
        {
          provide: OfficeService,
          useValue: {},
        },
        {
          provide: TemplateSpecificationService,
          useValue: {},
        },
        {
          provide: StorageService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    studentRepository = module.get<Repository<StudentEntity>>(getRepositoryToken(StudentEntity));
    classService = module.get<ClassService>(ClassService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new student if not exists', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(studentRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(studentRepository, 'save').mockResolvedValue(mockStudent);

      // Act
      const result = await service.create(mockCreateStudentDto, mockUser);

      // Assert
      expect(classService.getOne).toHaveBeenCalledWith({
        where: {
          id: mockCreateStudentDto.classId,
          teacher: {
            email: mockUser.email,
          },
        },
      });
      expect(studentRepository.findOne).toHaveBeenCalledWith({
        where: {
          mssv: mockCreateStudentDto.mssv,
          class: {
            id: mockCreateStudentDto.classId,
          },
        },
      });
      expect(studentRepository.save).toHaveBeenCalledWith({
        ...mockCreateStudentDto,
        class: mockClass,
      });
      expect(result).toEqual(mockStudent);
    });

    it('should update an existing student if exists', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(studentRepository, 'findOne').mockResolvedValue(mockStudent);
      jest.spyOn(studentRepository, 'save').mockResolvedValue(mockStudent);

      // Act
      const result = await service.create(mockCreateStudentDto, mockUser);

      // Assert
      expect(classService.getOne).toHaveBeenCalledWith({
        where: {
          id: mockCreateStudentDto.classId,
          teacher: {
            email: mockUser.email,
          },
        },
      });
      expect(studentRepository.findOne).toHaveBeenCalledWith({
        where: {
          mssv: mockCreateStudentDto.mssv,
          class: {
            id: mockCreateStudentDto.classId,
          },
        },
      });
      expect(studentRepository.save).toHaveBeenCalledWith({
        ...mockStudent,
        ...mockCreateStudentDto,
      });
      expect(result).toEqual(mockStudent);
    });

    it('should throw BadRequestException if class not found', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(mockCreateStudentDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(classService.getOne).toHaveBeenCalledWith({
        where: {
          id: mockCreateStudentDto.classId,
          teacher: {
            email: mockUser.email,
          },
        },
      });
      expect(studentRepository.findOne).not.toHaveBeenCalled();
      expect(studentRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getOne', () => {
    it('should return a student by options', async () => {
      // Arrange
      const options = { where: { id: 'student-id-1' } };
      jest.spyOn(studentRepository, 'findOne').mockResolvedValue(mockStudent);

      // Act
      const result = await service.getOne(options);

      // Assert
      expect(studentRepository.findOne).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockStudent);
    });

    it('should return null if student not found', async () => {
      // Arrange
      const options = { where: { id: 'non-existent-id' } };
      jest.spyOn(studentRepository, 'findOne').mockResolvedValue(null);

      // Act
      const result = await service.getOne(options);

      // Assert
      expect(studentRepository.findOne).toHaveBeenCalledWith(options);
      expect(result).toBeNull();
    });
  });

  describe('getMany', () => {
    it('should return array of students by options', async () => {
      // Arrange
      const options = { where: { class: { id: 'class-id-1' } } };
      jest.spyOn(studentRepository, 'find').mockResolvedValue(mockStudents);

      // Act
      const result = await service.getMany(options);

      // Assert
      expect(studentRepository.find).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockStudents);
    });

    it('should return empty array if no students found', async () => {
      // Arrange
      const options = { where: { class: { id: 'non-existent-id' } } };
      jest.spyOn(studentRepository, 'find').mockResolvedValue([]);

      // Act
      const result = await service.getMany(options);

      // Assert
      expect(studentRepository.find).toHaveBeenCalledWith(options);
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete a student by id', async () => {
      // Arrange
      jest.spyOn(studentRepository, 'findOne').mockResolvedValue(mockStudent);
      jest.spyOn(studentRepository, 'delete').mockResolvedValue(mockDeleteResult);

      // Act
      const result = await service.delete('student-id-1', mockUser);

      // Assert
      expect(studentRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'student-id-1',
          class: {
            teacher: {
              email: mockUser.email,
            },
          },
        },
      });
      expect(studentRepository.delete).toHaveBeenCalledWith('student-id-1');
      expect(result).toEqual({
        status: 'success',
        message: 'Student with id student-id-1 deleted',
      });
    });

    it('should throw BadRequestException if student not found', async () => {
      // Arrange
      jest.spyOn(studentRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete('non-existent-id', mockUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(studentRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'non-existent-id',
          class: {
            teacher: {
              email: mockUser.email,
            },
          },
        },
      });
      expect(studentRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return list of students in a class', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(mockClass);
      jest.spyOn(studentRepository, 'find').mockResolvedValue(mockStudents);

      // Act
      const result = await service.list('class-id-1', mockUser);

      // Assert
      expect(classService.getOne).toHaveBeenCalledWith({
        where: {
          id: 'class-id-1',
          teacher: {
            email: mockUser.email,
          },
        },
      });
      expect(studentRepository.find).toHaveBeenCalledWith({
        where: {
          class: {
            id: 'class-id-1',
          },
        },
      });
      expect(result).toEqual(mockStudents);
    });

    it('should throw BadRequestException if class not found', async () => {
      // Arrange
      jest.spyOn(classService, 'getOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.list('non-existent-id', mockUser)).rejects.toThrow(BadRequestException);
      expect(classService.getOne).toHaveBeenCalledWith({
        where: {
          id: 'non-existent-id',
          teacher: {
            email: mockUser.email,
          },
        },
      });
    });
  });

  describe('update', () => {
    it('should update a student', async () => {
      // Arrange
      jest.spyOn(studentRepository, 'findOne').mockResolvedValue(mockStudent);
      jest.spyOn(studentRepository, 'save').mockResolvedValue({
        ...mockStudent,
        firstName: mockUpdateStudentDto.firstName,
        email: mockUpdateStudentDto.email,
        phone: mockUpdateStudentDto.phone,
        projectTitle: mockUpdateStudentDto.projectTitle,
        supervisor: mockUpdateStudentDto.supervisor,
        reviewer: mockUpdateStudentDto.reviewer,
        studentClassName: mockUpdateStudentDto.studentClassName,
      } as unknown as StudentEntity);

      // Act
      const result = await service.update(mockUpdateStudentDto, mockUser);

      // Assert
      expect(studentRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockUpdateStudentDto.id,
          class: {
            teacher: {
              email: mockUser.email,
            },
          },
        },
      });
      expect(studentRepository.save).toHaveBeenCalledWith({
        ...mockStudent,
        ...mockUpdateStudentDto,
      });
      expect(result).toHaveProperty('firstName', mockUpdateStudentDto.firstName);
    });

    it('should throw BadRequestException if student not found', async () => {
      // Arrange
      jest.spyOn(studentRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(mockUpdateStudentDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(studentRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockUpdateStudentDto.id,
          class: {
            teacher: {
              email: mockUser.email,
            },
          },
        },
      });
      expect(studentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if trying to update mssv', async () => {
      // Arrange
      jest.spyOn(studentRepository, 'findOne').mockResolvedValue(mockStudent);

      const updateWithMssv = {
        ...mockUpdateStudentDto,
        mssv: '20200003', // Different from original
      };

      // Act & Assert
      await expect(service.update(updateWithMssv, mockUser)).rejects.toThrow(BadRequestException);
      expect(studentRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: updateWithMssv.id,
          class: {
            teacher: {
              email: mockUser.email,
            },
          },
        },
      });
      expect(studentRepository.save).not.toHaveBeenCalled();
    });
  });
});
