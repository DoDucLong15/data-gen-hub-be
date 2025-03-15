import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { BaseResponse } from 'src/base/types/response.type';
import { ClassService } from 'src/class/class.service';
import { OfficeService } from 'src/office/office.service';
import { StorageService } from 'src/storage/storage.service';
import {
  ExportListStudentRequest,
  ExportListStudentRequestV2,
  ExportStudentFormDataRequest,
  ExportStudentFormDataRequestV2,
} from 'src/students/dtos/export-data.dto';
import {
  ImportListStudentRequest,
  ImportStudentFormDataRequest,
  ImportStudentFormDataRequestV2,
} from 'src/students/dtos/import-data.dto';
import { StudentsService } from 'src/students/students.service';
import { SpecificationNameEnum } from 'src/template-specification/constants/default.const';
import { ActionEnum } from 'src/template-specification/enums/action.enum';
import { TemplateSpecificationService } from 'src/template-specification/template-specification.service';
import { AsyncUtils } from 'src/utils/async.utils';
import { CommonUtils } from 'src/utils/common.util';
import { Response } from 'express';
import { streamToBuffer } from 'src/storage/helpers/convert.helper';
import { ThesisDocumentEnum } from 'src/thesis-management/enums/thesis-document.enum';
import { ProgressService } from 'src/progress/progress.service';
import { EProgressType } from 'src/progress/constant/progress.const';

@Injectable()
export class StudentServiceV2 {
  constructor(
    @Inject(forwardRef(() => StudentsService))
    private readonly studentService: StudentsService,
    @Inject(forwardRef(() => OfficeService))
    private readonly officeService: OfficeService,
    @Inject(forwardRef(() => ClassService))
    private readonly classService: ClassService,
    @Inject(forwardRef(() => TemplateSpecificationService))
    private readonly specificationService: TemplateSpecificationService,
    @Inject(forwardRef(() => StorageService))
    private readonly storageService: StorageService,
    private readonly processService: ProgressService,
  ) {}

  async importListStudents(
    files: Express.Multer.File[],
    request: ImportListStudentRequest,
    user: UserPayload,
    processId: string,
  ): Promise<BaseResponse> {
    const errorCollector: Record<string, any> = {};
    try {
      await this.processService.createProgress([
        {
          processId,
          type: EProgressType.STUDENT_LIST,
          action: ActionEnum.IMPORT,
          createBy: user.email,
          classId: request.classId,
        },
      ]);
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
      const specification = await this.specificationService.getOne({
        where: {
          classId: request.classId,
          action: ActionEnum.IMPORT,
          name: SpecificationNameEnum.DSSV,
        },
      });
      if (!specification) {
        throw new BadRequestException(`Specification not found`);
      }
      const unzipFiles = await CommonUtils.unzip(files);
      const inputPaths: string[] = [];
      for (const file of unzipFiles) {
        let inputPath: string = '';
        try {
          const res = await this.storageService.uploadDataToFile(
            file.buffer,
            file.mimetype,
            `data-gen-hub/${request.classId}/students/input/${Date.now()}_${file.originalname}`,
          );
          if (res) {
            inputPath = res.key;
            await this.officeService.importListByScript(
              inputPath,
              specification.jsonFile,
              request.classId,
            );
            inputPaths.push(inputPath);
          }
        } catch (error) {
          Logger.error(error.message, error.stack, 'StudentsServiceV2.importListStudents');
          if (inputPath && inputPath.length) {
            await this.storageService.deleteFile(inputPath);
          }
          errorCollector[file.originalname] = error;
        } finally {
          await AsyncUtils.delay(1000);
        }
      }
      if (inputPaths.length > 0) {
        _class.studentPaths = Array.from(new Set([...(_class.studentPaths || []), ...inputPaths]));
        await this.classService.update(
          {
            id: request.classId,
            studentPaths: _class.studentPaths,
          },
          user,
        );
      }
      await this.processService.makeCompleted(
        { processId },
        {
          error: errorCollector,
        },
      );
      return {
        status: 'success',
        message: 'Imported students successfully',
      };
    } catch (error) {
      Logger.error(error.message, error.stack, 'StudentsServiceV2.importListStudents');
      errorCollector['unknown'] = error;
      await this.processService.makeFailed(
        { processId },
        {
          error: errorCollector,
        },
      );
      return {
        status: 'error',
        message: `Error importing students: ${error.message}`,
        data: [],
      };
    }
  }

  async exportListStudent(
    request: ExportListStudentRequestV2,
    user: UserPayload,
    res: Response,
    processId: string,
  ): Promise<void> {
    const errorCollector: Record<string, any> = {};
    try {
      await this.processService.createProgress([
        {
          processId,
          type: EProgressType.STUDENT_LIST,
          action: ActionEnum.EXPORT,
          createBy: user.email,
          classId: request.classId,
        },
      ]);
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
      const specification = await this.specificationService.getOne({
        where: {
          classId: request.classId,
          action: ActionEnum.EXPORT,
          name: SpecificationNameEnum.DSSV,
        },
      });
      if (!specification) {
        throw new BadRequestException(`Specification not found`);
      }
      await this.officeService.exportListByScript(
        request.classId,
        request.studentIds,
        specification.templateFile,
        specification.jsonFile,
      );
      const fileOutputPath = await this.classService
        .getOne({ where: { id: request.classId } })
        .then((data) => {
          return data?.outputPath;
        });
      if (fileOutputPath) {
        const fileOutput = await this.storageService.downloadFile(fileOutputPath);
        const metaData = await this.storageService.getMetadata(fileOutputPath);
        if (fileOutput) {
          if (_class.outputPath) this.storageService.deleteFile(_class.outputPath);
          const output = await streamToBuffer(fileOutput);
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(fileOutputPath.split('/').pop() || 'output.xlsx')}"`,
          );
          res.setHeader('Content-Type', metaData?.contentType || 'application/octet-stream');
          res.send(output);
          await this.processService.makeCompleted({ processId }, { error: errorCollector });
          return;
        }
      }
      errorCollector['exist-output'] = 'Notfound file output';
      await this.processService.makeCompleted({ processId }, { error: errorCollector });
      res.status(400).json({
        status: 'error',
        message: `Error exporting students: Notfound file output`,
      });
    } catch (error) {
      Logger.error(error.message, error.stack, 'StudentsService.exportListStudent');
      errorCollector['unknown'] = error;
      await this.processService.makeFailed({ processId }, { error: errorCollector });
      res.status(500).json({
        status: 'error',
        message: `Error exporting students: ${error.message}`,
      });
    }
  }

  async generateStudentFormData(
    request: ExportStudentFormDataRequestV2,
    user: UserPayload,
    processId: string,
  ): Promise<BaseResponse> {
    const errorCollector: Record<string, any> = {};
    try {
      await this.processService.createProgress([
        {
          processId,
          type:
            request.thesisDocType === ThesisDocumentEnum.ASSIGNMENT_SHEET
              ? EProgressType.ASSIGNMENT_SHEET
              : request.thesisDocType === ThesisDocumentEnum.GUIDANCE_REVIEW
                ? EProgressType.GUIDANCE_REVIEW
                : EProgressType.SUPERVISORY_COMMENTS,
          action: ActionEnum.EXPORT,
          createBy: user.email,
          classId: request.classId,
        },
      ]);
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
      const specification = await this.specificationService.getOne({
        where: {
          classId: request.classId,
          action: ActionEnum.EXPORT,
          name:
            request.thesisDocType === ThesisDocumentEnum.ASSIGNMENT_SHEET
              ? SpecificationNameEnum.PGNV
              : request.thesisDocType === ThesisDocumentEnum.GUIDANCE_REVIEW
                ? SpecificationNameEnum.NXHD
                : SpecificationNameEnum.NXPB,
        },
      });
      if (!specification) {
        throw new BadRequestException(`Specification not found`);
      }
      await this.officeService.exportSingleByScript(
        request.classId,
        specification.templateFile,
        specification.jsonFile,
        request.thesisDocType,
        {
          thesis_start_date: request.thesisStartDate,
          thesis_end_date: request.thesisEndDate,
          teacher_sign_date: request.teacherSignatureDate,
        },
      );
      await this.processService.makeCompleted({ processId }, { error: errorCollector });
      return {
        status: 'success',
        message: 'Generating student form data successfully',
      };
    } catch (error) {
      Logger.error(error.message, error.stack, 'StudentsService.generateStudentFormData');
      errorCollector['unknown'] = error;
      await this.processService.makeFailed({ processId }, { error: errorCollector });
      return {
        status: 'error',
        message: `Error generating student form data: ${error.message}`,
      };
    }
  }

  async importStudentFormData(
    files: Express.Multer.File[],
    request: ImportStudentFormDataRequestV2,
    user: UserPayload,
    processId: string,
  ): Promise<BaseResponse> {
    const errorCollector: Record<string, any> = {};
    try {
      await this.processService.createProgress([
        {
          processId,
          type:
            request.thesisDocType === ThesisDocumentEnum.ASSIGNMENT_SHEET
              ? EProgressType.ASSIGNMENT_SHEET
              : request.thesisDocType === ThesisDocumentEnum.GUIDANCE_REVIEW
                ? EProgressType.GUIDANCE_REVIEW
                : EProgressType.SUPERVISORY_COMMENTS,
          action: ActionEnum.IMPORT,
          createBy: user.email,
          classId: request.classId,
        },
      ]);
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
      const specification = await this.specificationService.getOne({
        where: {
          classId: request.classId,
          action: ActionEnum.IMPORT,
          name:
            request.thesisDocType === ThesisDocumentEnum.ASSIGNMENT_SHEET
              ? SpecificationNameEnum.PGNV
              : request.thesisDocType === ThesisDocumentEnum.GUIDANCE_REVIEW
                ? SpecificationNameEnum.NXHD
                : SpecificationNameEnum.NXPB,
        },
      });
      if (!specification) {
        throw new BadRequestException(`Specification not found`);
      }

      const unzipFiles = await CommonUtils.unzip(files);
      for (const file of unzipFiles) {
        let path: string = '';
        try {
          Logger.debug(
            `Importing student form data from ${file.originalname}`,
            'StudentsService.importStudentFormData',
          );
          const res = await this.storageService.uploadDataToFile(
            file.buffer,
            file.mimetype,
            `data-gen-hub/${request.classId}/${request.thesisDocType}/input/${Date.now()}_${file.originalname}`,
          );
          if (res) {
            path = res.key;
            await this.officeService.importSingleByScript(
              res.key,
              specification.jsonFile,
              request.classId,
            );
          }
        } catch (error) {
          Logger.error(error.message, error.stack, 'StudentsService.importStudentFormData');
          if (path && path.length) await this.storageService.deleteFile(path);
          errorCollector[file.originalname] = error;
        } finally {
          await AsyncUtils.delay(1000);
        }
      }
      await this.processService.makeCompleted({ processId }, { error: errorCollector });
      return {
        status: 'success',
        message: 'Imported student form data successfully',
      };
    } catch (error) {
      Logger.error(error.message, error.stack, 'StudentsService.importStudentFormData');
      errorCollector['unknown'] = error;
      await this.processService.makeFailed({ processId }, { error: errorCollector });
      return {
        status: 'error',
        message: `Error importing student form data: ${error.message}`,
      };
    }
  }
}
