import { ThesisDocumentEnum } from 'src/thesis-management/enums/thesis-document.enum';

export enum EProgressType {
  ASSIGNMENT_SHEET = ThesisDocumentEnum.ASSIGNMENT_SHEET,
  GUIDANCE_REVIEW = ThesisDocumentEnum.GUIDANCE_REVIEW,
  SUPERVISORY_COMMENTS = ThesisDocumentEnum.SUPERVISORY_COMMENTS,
  STUDENT_LIST = 'student_list',
}

export enum EProgressStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
