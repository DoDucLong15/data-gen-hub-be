export interface StudentFormStatus {
  mssv: string;
  fullName: string;
  assignmentSheet: boolean;
  guidanceReview: boolean;
  supervisoryComment: boolean;
  missingInStudentList?: boolean;
}

export interface FormCompletionRate {
  formType: 'assignmentSheet' | 'guidanceReview' | 'supervisoryComment';
  completed: number;
  total: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface FormImportExportStats {
  formType: 'assignmentSheet' | 'guidanceReview' | 'supervisoryComment';
  importedCount: number;
  exportedCount: number;
  total: number;
}

export interface LecturerDashboardResponse {
  studentFormStatus: StudentFormStatus[];
  formCompletionRates: FormCompletionRate[];
  scoreDistribution: ScoreDistribution[];
  formImportExportStats: FormImportExportStats[];
}
