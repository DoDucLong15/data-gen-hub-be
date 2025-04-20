import { BadGatewayException, BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssignmentSheetsEntity } from './entities/assignment-sheet.entity';
import { Repository } from 'typeorm';
import { GuidanceReviewEntity } from './entities/guidance-review.entity';
import { SupervisoryCommentsEntity } from './entities/supervisory-comments.entity';
import { ClassService } from 'src/class/class.service';
import { StorageService } from 'src/storage/storage.service';
import { ThesisDocumentInterface } from './interfaces/thesis-document.interface';
import { ThesisDocumentEnum } from './enums/thesis-document.enum';
import { AssignmentSheetStrategy } from './strategies/assignment-sheet.strategy';
import { GuidanceReviewStrategy } from './strategies/guidance-review.strategy';
import { SupervisoryCommentsStrategy } from './strategies/supervisory-comments.strategy';
import {
  CreateAssignmentSheetDto,
  DeleteAssignmentSheetDto,
  DeleteFileAssignmentSheetDto,
  DownloadFileAssignmentSheetDto,
  GetListAssignmentSheetDto,
  GetOneAssignmentSheetDto,
  UpdateAssignmentSheetDto,
} from './dtos/assignment-sheet.dto';
import {
  CreateGuidanceReviewDto,
  DeleteFileGuidanceReviewDto,
  DeleteGuidanceReviewDto,
  DownloadFileGuidanceReviewDto,
  GetListGuidanceReviewDto,
  GetOneGuidanceReviewDto,
  UpdateGuidanceReviewDto,
} from './dtos/guidance-review.dto';
import {
  CreateSupervisoryCommentsDto,
  DeleteFileSupervisoryCommentsDto,
  DeleteSupervisoryCommentsDto,
  DownloadFileSupervisoryCommentsDto,
  GetListSupervisoryCommentsDto,
  GetOneSupervisoryCommentsDto,
  UpdateSupervisoryCommentsDto,
} from './dtos/supervisory-comments.dto';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { OfficeService } from 'src/office/office.service';
import { TemplateSpecificationService } from 'src/template-specification/template-specification.service';
import { ActionEnum } from 'src/template-specification/enums/action.enum';
import { SpecificationNameEnum } from 'src/template-specification/constants/default.const';
import { streamToBuffer } from 'src/storage/helpers/convert.helper';
import { CommonUtils } from 'src/utils/common.util';

@Injectable()
export class ThesisManagementService {
  private thesisStrategy: Record<string, ThesisDocumentInterface> = {};
  constructor(
    @InjectRepository(AssignmentSheetsEntity)
    private readonly assignmentSheetsRepository: Repository<AssignmentSheetsEntity>,
    @InjectRepository(GuidanceReviewEntity)
    private readonly guidanceReviewRepository: Repository<GuidanceReviewEntity>,
    @InjectRepository(SupervisoryCommentsEntity)
    private readonly supervisoryCommentsRepository: Repository<SupervisoryCommentsEntity>,
    private readonly classService: ClassService,
    private readonly storageService: StorageService,
    private readonly officeService: OfficeService,
    private readonly specificationService: TemplateSpecificationService,
  ) {
    this.use(
      ThesisDocumentEnum.ASSIGNMENT_SHEET,
      new AssignmentSheetStrategy(assignmentSheetsRepository, classService, storageService),
    );
    this.use(
      ThesisDocumentEnum.GUIDANCE_REVIEW,
      new GuidanceReviewStrategy(guidanceReviewRepository, classService, storageService),
    );
    this.use(
      ThesisDocumentEnum.SUPERVISORY_COMMENTS,
      new SupervisoryCommentsStrategy(supervisoryCommentsRepository, classService, storageService),
    );
  }

  private use(name: string, strategy: ThesisDocumentInterface): void {
    this.thesisStrategy[name] = strategy;
  }

  private getStrategy(thesisDocType: ThesisDocumentEnum): ThesisDocumentInterface {
    if (!this.thesisStrategy[thesisDocType]) {
      throw new BadRequestException(`Strategy ${thesisDocType} not found`);
    }
    return this.thesisStrategy[thesisDocType];
  }

  async create(
    request: CreateAssignmentSheetDto | CreateGuidanceReviewDto | CreateSupervisoryCommentsDto,
    user: UserPayload,
  ): Promise<any> {
    const strategy = this.getStrategy(request.thesisDocType);
    const newEntity = await strategy.create(request, user);
    await this.syncDataAndFile(newEntity.id, request.thesisDocType, user);
    return newEntity;
  }

  async update(
    request: UpdateAssignmentSheetDto | UpdateGuidanceReviewDto | UpdateSupervisoryCommentsDto,
    user: UserPayload,
  ): Promise<any> {
    const strategy = this.getStrategy(request.thesisDocType);
    const newEntity = await strategy.update(request, user);
    await this.syncDataAndFile(newEntity.id, request.thesisDocType, user);
    return newEntity;
  }

  async list(
    request: GetListAssignmentSheetDto | GetListGuidanceReviewDto | GetListSupervisoryCommentsDto,
    user: UserPayload,
  ): Promise<any[]> {
    const strategy = this.getStrategy(request.thesisDocType);
    return await strategy.list(request, user);
  }

  async delete(
    request: DeleteAssignmentSheetDto | DeleteGuidanceReviewDto | DeleteSupervisoryCommentsDto,
    user: UserPayload,
  ): Promise<any> {
    const strategy = this.getStrategy(request.thesisDocType);
    return await strategy.delete(request, user);
  }

  async getOne(
    request: GetOneAssignmentSheetDto | GetOneGuidanceReviewDto | GetOneSupervisoryCommentsDto,
    user: UserPayload,
  ): Promise<any> {
    const strategy = this.getStrategy(request.thesisDocType);
    return await strategy.getOne(request, user);
  }

  async downloadFile(
    request:
      | DownloadFileAssignmentSheetDto
      | DownloadFileGuidanceReviewDto
      | DownloadFileSupervisoryCommentsDto,
    res: Response,
    user: UserPayload,
  ) {
    const strategy = this.getStrategy(request.thesisDocType);
    return await strategy.downloadFile(request, res, user);
  }

  async deleteFile(
    request:
      | DeleteFileAssignmentSheetDto
      | DeleteFileGuidanceReviewDto
      | DeleteFileSupervisoryCommentsDto,
    user: UserPayload,
  ) {
    const strategy = this.getStrategy(request.thesisDocType);
    return await strategy.deleteFile(request, user);
  }

  private async syncDataAndFile(id: string, thesisDocType: ThesisDocumentEnum, user: UserPayload) {
    const entity = await this.getOne({ id, thesisDocType }, user);
    const classId = entity.class.id;
    const [specificationExport, specificationImport] = await Promise.all([
      this.specificationService.getOne({
        where: {
          classId: classId,
          action: ActionEnum.EXPORT,
          name:
            thesisDocType === ThesisDocumentEnum.ASSIGNMENT_SHEET
              ? SpecificationNameEnum.PGNV
              : thesisDocType === ThesisDocumentEnum.GUIDANCE_REVIEW
                ? SpecificationNameEnum.NXHD
                : SpecificationNameEnum.NXPB,
        },
      }),
      this.specificationService.getOne({
        where: {
          classId: classId,
          action: ActionEnum.IMPORT,
          name:
            thesisDocType === ThesisDocumentEnum.ASSIGNMENT_SHEET
              ? SpecificationNameEnum.PGNV
              : thesisDocType === ThesisDocumentEnum.GUIDANCE_REVIEW
                ? SpecificationNameEnum.NXHD
                : SpecificationNameEnum.NXPB,
        },
      }),
    ]);
    if (!specificationExport || !specificationImport) {
      return;
    }
    await this.officeService.exportSingleByScript(
      classId,
      [id],
      specificationExport.templateFile,
      specificationImport.jsonFile,
      thesisDocType,
      {
        thesis_start_date: entity.thesisStartDate,
        thesis_end_date: entity.thesisEndDate,
        teacher_sign_date: entity.teacherSignatureDate,
      },
    );
    const newEntity = await this.getOne({ id, thesisDocType }, user);
    if (newEntity.outputPath) {
      const generatedFile = await this.storageService.downloadFile(newEntity.outputPath);
      const metadata = await this.storageService.getMetadata(newEntity.outputPath);
      if (generatedFile) {
        const buffer = await streamToBuffer(generatedFile);
        const res = await this.storageService.uploadDataToFile(
          buffer,
          metadata?.contentType ??
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          CommonUtils.getStudentFilePath(
            classId,
            thesisDocType,
            'input',
            metadata?.name?.split('/').pop() ?? `${entity.mssv}.xlsx`,
          ),
        );
        if (res) {
          newEntity.inputPath = res.key;
          switch (thesisDocType) {
            case ThesisDocumentEnum.ASSIGNMENT_SHEET:
              await this.assignmentSheetsRepository.save(newEntity);
              break;
            case ThesisDocumentEnum.GUIDANCE_REVIEW:
              await this.guidanceReviewRepository.save(newEntity);
              break;
            case ThesisDocumentEnum.SUPERVISORY_COMMENTS:
              await this.supervisoryCommentsRepository.save(newEntity);
              break;
            default:
              Logger.warn(
                `Sync data and file failed, thesisDocType: ${thesisDocType}`,
                'ThesisManagementService.syncDataAndFile',
              );
              break;
          }
        }
      }
    }
  }
}
