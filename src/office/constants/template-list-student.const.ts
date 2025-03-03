export const TemplateSpecificationImportListStudent = {
  sheets: [
    {
      visible: true,
      mapping: {
        rows: '8:*',
        columns: [
          { column: 'B', dbField: 'mssv' },
          { column: 'C', dbField: 'lastName' },
          { column: 'D', dbField: 'middleName' },
          { column: 'E', dbField: 'firstName' },
          { column: 'F', dbField: 'projectTitle' },
          { column: 'G', dbField: 'supervisor' },
          { column: 'H', dbField: 'reviewer' },
          { column: 'I', dbField: 'studentClassName' },
          { column: 'K', dbField: 'phone' },
          { column: 'M', dbField: 'email' },
        ],
      },
    },
  ],
};

export const TemplateSpecificationExportListStudent = {
  sheets: [
    {
      name: '*0',
      visible: true,
      mapping: {
        rows: '8:*',
        columns: [
          { column: 'B', dbField: 'mssv' },
          { column: 'C', dbField: 'lastName' },
          { column: 'D', dbField: 'middleName' },
          { column: 'E', dbField: 'firstName' },
          { column: 'F', dbField: 'projectTitle' },
          { column: 'G', dbField: 'supervisor' },
          { column: 'H', dbField: 'reviewer' },
          { column: 'I', dbField: 'studentClassName' },
          { column: 'K', dbField: 'phone' },
          { column: 'M', dbField: 'email' },
        ],
      },
    },
  ],
};
