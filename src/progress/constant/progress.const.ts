import { ThesisDocumentEnum } from 'src/thesis-management/enums/thesis-document.enum';

export enum EProgressType {
  ASSIGNMENT_SHEET = ThesisDocumentEnum.ASSIGNMENT_SHEET,
  GUIDANCE_REVIEW = ThesisDocumentEnum.GUIDANCE_REVIEW,
  SUPERVISORY_COMMENTS = ThesisDocumentEnum.SUPERVISORY_COMMENTS,
  STUDENT_LIST = 'student_list',
  OTHER_DOCUMENT = 'other_document',
  DRIVE_DATA = 'drive_data',
  ONEDRIVE_DATA = 'onedrive_data',
}

export enum EProgressStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
