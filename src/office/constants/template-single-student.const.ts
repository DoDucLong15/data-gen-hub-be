import { ThesisDocumentEnum } from 'src/thesis-management/enums/thesis-document.enum';

export const TemplateSpecificationImportSingleStudent = {
  [ThesisDocumentEnum.GUIDANCE_REVIEW]: {
    sheets: [],
  },
  [ThesisDocumentEnum.SUPERVISORY_COMMENTS]: {
    sheets: [],
  },
  [ThesisDocumentEnum.ASSIGNMENT_SHEET]: {
    sheets: [
      {
        name: 'Cử nhân',
        mapping: {
          cells: [
            {
              cell: 'F6',
              dbField: 'semester',
            },
            {
              cell: 'C9',
              dbField: 'fullName',
            },
            {
              cell: 'I9',
              dbField: 'mssv',
            },
            {
              cell: 'I10',
              dbField: 'studentClassName',
            },
            {
              cell: 'A17',
              dbField: 'projectTitle',
            },
            {
              cell: 'C13',
              dbField: 'supervisor',
            },
            {
              cell: 'C10',
              dbField: 'phone',
            },
            {
              cell: 'C11',
              dbField: 'email',
            },
            {
              cell: 'I11',
              dbField: 'malop',
            },
            {
              cell: 'C14',
              dbField: 'school',
            },
            {
              cell: 'D15',
              dbField: 'thesisStartDate',
            },
            {
              cell: 'I15',
              dbField: 'thesisEndDate',
            },
            {
              cell: 'C19',
              dbField: 'thesisType',
            },
            {
              cell: 'A26',
              dbField: 'knowledgeStudentGain',
            },
            {
              cell: 'A30',
              dbField: 'technologyStudentGain',
            },
            {
              cell: 'A34',
              dbField: 'skillStudentGain',
            },
            {
              cell: 'A36',
              dbField: 'expectedProduct',
            },
            {
              cell: 'A40',
              dbField: 'realProblem',
            },
          ],
        },
      },
    ],
  },
};
