import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
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
    return await strategy.create(request, user);
  }

  async update(
    request: UpdateAssignmentSheetDto | UpdateGuidanceReviewDto | UpdateSupervisoryCommentsDto,
    user: UserPayload,
  ): Promise<any> {
    const strategy = this.getStrategy(request.thesisDocType);
    return await strategy.update(request, user);
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
}
