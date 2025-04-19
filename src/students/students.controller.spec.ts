import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './dtos/student.dto';
import { UserPayload } from '../auth/types/user-playload.type';
import { StudentEntity } from './entities/student.entity';
import { BaseResponse } from '../base/types/response.type';
import { BadRequestException } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { PoliciesGuard } from '../authorization/guards/policies.guard';
import { Reflector } from '@nestjs/core';

describe('StudentsController', () => {
  let controller: StudentsController;
  let studentsService: StudentsService;

  // Mock data
  const mockUser: UserPayload = {
    email: 'teacher@example.com',
    role: 'teacher',
  };

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
    class: {
      id: 'class-id-1',
    },
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
      class: {
        id: 'class-id-1',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      get fullName() {
        return `${this.lastName} ${this.middleName} ${this.firstName}`;
      },
    } as unknown as StudentEntity,
  ];

  const mockDeleteResponse: BaseResponse = {
    status: 'success',
    message: 'Student with id student-id-1 deleted',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        {
          provide: StudentsService,
          useValue: {
            create: jest.fn(),
            list: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<StudentsController>(StudentsController);
    studentsService = module.get<StudentsService>(StudentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new student', async () => {
      // Arrange
      jest.spyOn(studentsService, 'create').mockResolvedValue(mockStudent);

      // Act
      const result = await controller.create(mockCreateStudentDto, mockUser);

      // Assert
      expect(studentsService.create).toHaveBeenCalledWith(mockCreateStudentDto, mockUser);
      expect(result).toEqual(mockStudent);
    });

    it('should handle error if service throws exception', async () => {
      // Arrange
      jest
        .spyOn(studentsService, 'create')
        .mockRejectedValue(new BadRequestException('Test error'));

      // Act & Assert
      await expect(controller.create(mockCreateStudentDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(studentsService.create).toHaveBeenCalledWith(mockCreateStudentDto, mockUser);
    });
  });

  describe('list', () => {
    it('should return list of students in a class', async () => {
      // Arrange
      jest.spyOn(studentsService, 'list').mockResolvedValue(mockStudents);

      // Act
      const result = await controller.list('class-id-1', mockUser);

      // Assert
      expect(studentsService.list).toHaveBeenCalledWith('class-id-1', mockUser);
      expect(result).toEqual(mockStudents);
    });

    it('should handle error if service throws exception', async () => {
      // Arrange
      jest.spyOn(studentsService, 'list').mockRejectedValue(new BadRequestException('Test error'));

      // Act & Assert
      await expect(controller.list('non-existent-id', mockUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(studentsService.list).toHaveBeenCalledWith('non-existent-id', mockUser);
    });
  });

  describe('delete', () => {
    it('should delete a student by id', async () => {
      // Arrange
      jest.spyOn(studentsService, 'delete').mockResolvedValue(mockDeleteResponse);

      // Act
      const result = await controller.delete('student-id-1', mockUser);

      // Assert
      expect(studentsService.delete).toHaveBeenCalledWith('student-id-1', mockUser);
      expect(result).toEqual(mockDeleteResponse);
    });

    it('should handle error if service throws exception', async () => {
      // Arrange
      jest
        .spyOn(studentsService, 'delete')
        .mockRejectedValue(new BadRequestException('Test error'));

      // Act & Assert
      await expect(controller.delete('non-existent-id', mockUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(studentsService.delete).toHaveBeenCalledWith('non-existent-id', mockUser);
    });
  });

  describe('update', () => {
    it('should update a student', async () => {
      // Arrange
      const updatedStudent = {
        ...mockStudent,
        firstName: mockUpdateStudentDto.firstName,
        email: mockUpdateStudentDto.email,
        phone: mockUpdateStudentDto.phone,
      } as StudentEntity;
      jest.spyOn(studentsService, 'update').mockResolvedValue(updatedStudent);

      // Act
      const result = await controller.update(mockUpdateStudentDto, mockUser);

      // Assert
      expect(studentsService.update).toHaveBeenCalledWith(mockUpdateStudentDto, mockUser);
      expect(result).toEqual(updatedStudent);
    });

    it('should handle error if service throws exception', async () => {
      // Arrange
      jest
        .spyOn(studentsService, 'update')
        .mockRejectedValue(new BadRequestException('Test error'));

      // Act & Assert
      await expect(controller.update(mockUpdateStudentDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(studentsService.update).toHaveBeenCalledWith(mockUpdateStudentDto, mockUser);
    });
  });
});
