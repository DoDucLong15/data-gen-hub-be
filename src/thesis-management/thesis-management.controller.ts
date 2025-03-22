import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ThesisManagementService } from './thesis-management.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { User } from 'src/auth/decorators/user.decorator';
import {
  CreateAssignmentSheetDto,
  DeleteAssignmentSheetDto,
  DeleteFileAssignmentSheetDto,
  DownloadFileAssignmentSheetDto,
  GetListAssignmentSheetDto,
  UpdateAssignmentSheetDto,
} from './dtos/assignment-sheet.dto';
import {
  CreateGuidanceReviewDto,
  DeleteFileGuidanceReviewDto,
  DeleteGuidanceReviewDto,
  DownloadFileGuidanceReviewDto,
  GetListGuidanceReviewDto,
  UpdateGuidanceReviewDto,
} from './dtos/guidance-review.dto';
import {
  CreateSupervisoryCommentsDto,
  DeleteFileSupervisoryCommentsDto,
  DeleteSupervisoryCommentsDto,
  DownloadFileSupervisoryCommentsDto,
  GetListSupervisoryCommentsDto,
  UpdateSupervisoryCommentsDto,
} from './dtos/supervisory-comments.dto';
import { EAction } from 'src/permissions/enums/action.enum';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { PoliciesGuardV2 } from 'src/authorization/guards/policies-v2.guard';
import { CheckPoliciesV2 } from 'src/authorization/decorators/check-policies-v2.decorator';

@ApiTags('Thesis Management')
@ApiBearerAuth()
@Controller('thesis-management')
@UseGuards(AccessTokenGuard, PoliciesGuardV2)
export class ThesisManagementController {
  constructor(private readonly thesisManagementService: ThesisManagementService) {}

  @Post()
  @CheckPoliciesV2(
    { action: EAction.MANAGE, subject: ESubject.Thesis_AssignmentSheets },
    { action: EAction.MANAGE, subject: ESubject.Thesis_GuidanceReviews },
    { action: EAction.MANAGE, subject: ESubject.Thesis_SupervisoryComments },
  )
  @ApiExtraModels(CreateAssignmentSheetDto, CreateGuidanceReviewDto, CreateSupervisoryCommentsDto)
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CreateAssignmentSheetDto) },
        { $ref: getSchemaPath(CreateGuidanceReviewDto) },
        { $ref: getSchemaPath(CreateSupervisoryCommentsDto) },
      ],
    },
  })
  async create(
    @Body()
    request: CreateAssignmentSheetDto | CreateGuidanceReviewDto | CreateSupervisoryCommentsDto,
    @User() user: UserPayload,
  ): Promise<any> {
    return await this.thesisManagementService.create(request, user);
  }

  @Patch()
  @CheckPoliciesV2(
    { action: EAction.MANAGE, subject: ESubject.Thesis_AssignmentSheets },
    { action: EAction.MANAGE, subject: ESubject.Thesis_GuidanceReviews },
    { action: EAction.MANAGE, subject: ESubject.Thesis_SupervisoryComments },
  )
  @ApiExtraModels(UpdateAssignmentSheetDto, UpdateGuidanceReviewDto, UpdateSupervisoryCommentsDto)
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(UpdateAssignmentSheetDto) },
        { $ref: getSchemaPath(UpdateGuidanceReviewDto) },
        { $ref: getSchemaPath(UpdateSupervisoryCommentsDto) },
      ],
    },
  })
  async update(
    @Body()
    request: UpdateAssignmentSheetDto | UpdateGuidanceReviewDto | UpdateSupervisoryCommentsDto,
    @User() user: UserPayload,
  ): Promise<any> {
    return await this.thesisManagementService.update(request, user);
  }

  // @Get('one')
  // async getOne(@Body() request: any, @User() user: UserPayload): Promise<any> {
  //   return await this.thesisManagementService.getOne(request, user);
  // }

  @Post('list')
  @CheckPoliciesV2(
    { action: EAction.READ, subject: ESubject.Thesis_AssignmentSheets },
    { action: EAction.READ, subject: ESubject.Thesis_GuidanceReviews },
    { action: EAction.READ, subject: ESubject.Thesis_SupervisoryComments },
  )
  @ApiExtraModels(
    GetListAssignmentSheetDto,
    GetListGuidanceReviewDto,
    GetListSupervisoryCommentsDto,
  )
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(GetListAssignmentSheetDto) },
        { $ref: getSchemaPath(GetListGuidanceReviewDto) },
        { $ref: getSchemaPath(GetListSupervisoryCommentsDto) },
      ],
    },
  })
  async list(
    @Body()
    request: GetListAssignmentSheetDto | GetListGuidanceReviewDto | GetListSupervisoryCommentsDto,
    @User() user: UserPayload,
  ): Promise<any> {
    return await this.thesisManagementService.list(request, user);
  }

  @Delete()
  @CheckPoliciesV2(
    { action: EAction.MANAGE, subject: ESubject.Thesis_AssignmentSheets },
    { action: EAction.MANAGE, subject: ESubject.Thesis_GuidanceReviews },
    { action: EAction.MANAGE, subject: ESubject.Thesis_SupervisoryComments },
  )
  @ApiExtraModels(DeleteAssignmentSheetDto, DeleteGuidanceReviewDto, DeleteSupervisoryCommentsDto)
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(DeleteAssignmentSheetDto) },
        { $ref: getSchemaPath(DeleteGuidanceReviewDto) },
        { $ref: getSchemaPath(DeleteSupervisoryCommentsDto) },
      ],
    },
  })
  async delete(
    @Body()
    request: DeleteAssignmentSheetDto | DeleteGuidanceReviewDto | DeleteSupervisoryCommentsDto,
    @User() user: UserPayload,
  ): Promise<any> {
    return await this.thesisManagementService.delete(request, user);
  }

  @Post('download-file')
  @CheckPoliciesV2(
    { action: EAction.READ, subject: ESubject.Thesis_AssignmentSheets },
    { action: EAction.READ, subject: ESubject.Thesis_GuidanceReviews },
    { action: EAction.READ, subject: ESubject.Thesis_SupervisoryComments },
  )
  @ApiExtraModels(
    DownloadFileAssignmentSheetDto,
    DownloadFileGuidanceReviewDto,
    DownloadFileSupervisoryCommentsDto,
  )
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(DownloadFileAssignmentSheetDto) },
        { $ref: getSchemaPath(DownloadFileGuidanceReviewDto) },
        { $ref: getSchemaPath(DownloadFileSupervisoryCommentsDto) },
      ],
    },
  })
  async downloadFile(
    @Body()
    request:
      | DownloadFileAssignmentSheetDto
      | DownloadFileGuidanceReviewDto
      | DownloadFileSupervisoryCommentsDto,
    @Res() res: Response,
    @User() user: UserPayload,
  ): Promise<any> {
    return await this.thesisManagementService.downloadFile(request, res, user);
  }

  @Post('delete-file')
  @CheckPoliciesV2(
    { action: EAction.MANAGE, subject: ESubject.Thesis_AssignmentSheets },
    { action: EAction.MANAGE, subject: ESubject.Thesis_GuidanceReviews },
    { action: EAction.MANAGE, subject: ESubject.Thesis_SupervisoryComments },
  )
  @ApiExtraModels(
    DeleteFileAssignmentSheetDto,
    DeleteFileGuidanceReviewDto,
    DeleteFileSupervisoryCommentsDto,
  )
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(DeleteFileAssignmentSheetDto) },
        { $ref: getSchemaPath(DeleteFileGuidanceReviewDto) },
        { $ref: getSchemaPath(DeleteFileSupervisoryCommentsDto) },
      ],
    },
  })
  async deleteFile(
    @Body()
    request:
      | DeleteFileAssignmentSheetDto
      | DeleteFileGuidanceReviewDto
      | DeleteFileSupervisoryCommentsDto,
    @User() user: UserPayload,
  ): Promise<any> {
    return await this.thesisManagementService.deleteFile(request, user);
  }
}
