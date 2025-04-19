import { Test, TestingModule } from '@nestjs/testing';
import { ExcelStrategy } from './excel.strategy';
import { PythonScriptService } from 'src/python-script/python-script.service';
import { JsonMappingListType } from '../types/json-mapping-list.type';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { Logger } from '@nestjs/common';

// Mock the PythonScriptService
const mockPythonScriptService = {
  runPythonScript: jest.fn(),
  runScript: jest.fn(),
};

// Mock XLSX module
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    decode_range: jest.fn(),
    decode_col: jest.fn(),
    encode_range: jest.fn(),
  },
  write: jest.fn().mockReturnValue(Buffer.from('mock-excel-data')),
}));

// Mock ExcelJS
jest.mock('exceljs', () => {
  const mockCell = {
    value: '',
    style: {},
  };

  const mockRow = {
    getCell: jest.fn().mockReturnValue(mockCell),
    commit: jest.fn(),
  };

  const mockWorksheet = {
    getRow: jest.fn().mockReturnValue(mockRow),
    getCell: jest.fn().mockReturnValue(mockCell),
    state: 'visible',
    views: [],
  };

  const mockWorkbook = {
    worksheets: [mockWorksheet],
    getWorksheet: jest.fn().mockReturnValue(mockWorksheet),
    xlsx: {
      load: jest.fn().mockResolvedValue(undefined),
      writeBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-excel-data')),
    },
  };

  return {
    Workbook: jest.fn().mockImplementation(() => mockWorkbook),
  };
});

describe('ExcelStrategy', () => {
  let excelStrategy: ExcelStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExcelStrategy,
        {
          provide: PythonScriptService,
          useValue: mockPythonScriptService,
        },
      ],
    }).compile();

    excelStrategy = module.get<ExcelStrategy>(ExcelStrategy);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('importList', () => {
    it('should return an empty array when no sheets are defined in template', async () => {
      // Arrange
      const file = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const template: JsonMappingListType = {
        sheets: [],
      };

      // Act
      const result = await excelStrategy.importList(file, template);

      // Assert
      expect(result).toEqual([]);
    });

    it('should process Excel file and extract data based on template', async () => {
      // Arrange
      const file = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const template: JsonMappingListType = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              rows: '2:2', // Only row 2
              columns: [
                { column: 'A', dbfield: 'id' },
                { column: 'B', dbfield: 'name' },
                { column: 'C', dbfield: 'data', const: 'constant-value' },
              ],
            },
          },
        ],
      };

      // Mock workbook and worksheet
      const mockWorkSheet = {
        '!ref': 'A1:C5',
        A2: { v: '1', t: 's' },
        B2: { v: 'John', t: 's' },
        C2: { v: 'Data', t: 's' },
      };

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: mockWorkSheet,
        },
      };

      // Setup mocks
      (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);
      (XLSX.utils.decode_range as jest.Mock).mockReturnValue({
        s: { c: 0, r: 0 },
        e: { c: 2, r: 4 },
      });

      // Act
      const result = await excelStrategy.importList(file, template);

      // Assert
      expect(XLSX.read).toHaveBeenCalledWith(file.buffer, { type: 'buffer' });
      expect(result).toEqual([{ id: '1', name: 'John', data: 'constant-value' }]);
    });

    it('should handle multiple sheets in template', async () => {
      // Arrange
      const file = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const template: JsonMappingListType = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              rows: '2:2', // Only row 2
              columns: [
                { column: 'A', dbfield: 'id' },
                { column: 'B', dbfield: 'name' },
              ],
            },
          },
          {
            name: 'Sheet2',
            mapping: {
              rows: '2:2', // Only row 2
              columns: [
                { column: 'A', dbfield: 'code' },
                { column: 'B', dbfield: 'description' },
              ],
            },
          },
        ],
      };

      // Mock workbook and worksheets
      const mockSheet1 = {
        '!ref': 'A1:B3',
        A2: { v: '1', t: 's' },
        B2: { v: 'John', t: 's' },
      };

      const mockSheet2 = {
        '!ref': 'A1:B3',
        A2: { v: 'C001', t: 's' },
        B2: { v: 'Product', t: 's' },
      };

      const mockWorkbook = {
        SheetNames: ['Sheet1', 'Sheet2'],
        Sheets: {
          Sheet1: mockSheet1,
          Sheet2: mockSheet2,
        },
      };

      // Setup mocks
      (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);
      (XLSX.utils.decode_range as jest.Mock).mockImplementation((ref) => {
        return { s: { c: 0, r: 0 }, e: { c: 1, r: 2 } };
      });

      // Act
      const result = await excelStrategy.importList(file, template);

      // Assert
      expect(XLSX.read).toHaveBeenCalledWith(file.buffer, { type: 'buffer' });
      expect(result).toEqual([
        { id: '1', name: 'John' },
        { code: 'C001', description: 'Product' },
      ]);
    });

    it('should handle sheet name with wildcard index', async () => {
      // Arrange
      const file = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const template: JsonMappingListType = {
        sheets: [
          {
            name: '*0', // First sheet by index
            mapping: {
              rows: '1:1', // Only row 1
              columns: [
                { column: 'A', dbfield: 'id' },
                { column: 'B', dbfield: 'name' },
              ],
            },
          },
        ],
      };

      // Mock workbook and worksheet
      const mockWorkSheet = {
        '!ref': 'A1:B3',
        A1: { v: '1', t: 's' },
        B1: { v: 'John', t: 's' },
      };

      const mockWorkbook = {
        SheetNames: ['FirstSheet', 'SecondSheet'],
        Sheets: {
          FirstSheet: mockWorkSheet,
        },
      };

      // Setup mocks
      (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);
      (XLSX.utils.decode_range as jest.Mock).mockReturnValue({
        s: { c: 0, r: 0 },
        e: { c: 1, r: 2 },
      });

      // Act
      const result = await excelStrategy.importList(file, template);

      // Assert
      expect(XLSX.read).toHaveBeenCalledWith(file.buffer, { type: 'buffer' });
      expect(result).toEqual([{ id: '1', name: 'John' }]);
    });

    it('should handle errors and return empty array', async () => {
      // Arrange
      const file = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const template: JsonMappingListType = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              columns: [{ column: 'A', dbfield: 'id' }],
            },
          },
        ],
      };

      // Setup mocks to throw error
      (XLSX.read as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      // Spy on Logger.error
      const loggerSpy = jest.spyOn(Logger, 'error').mockImplementation();

      // Act
      const result = await excelStrategy.importList(file, template);

      // Assert
      expect(result).toEqual([]);
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('exportList', () => {
    // Test case 1: Successfully export list to Excel
    it('should successfully export list to Excel', async () => {
      // Arrange
      const mockList = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];

      const mockTemplateFile = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      } as Express.Multer.File;

      const mockTemplate: JsonMappingListType = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              rows: '2:*',
              columns: [
                { column: 'A', dbfield: 'id' },
                { column: 'B', dbfield: 'name' },
              ],
            },
          },
        ],
      };

      // Act
      const result = await excelStrategy.exportList(mockList, mockTemplateFile, mockTemplate);

      // Assert
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.originalname).toContain('template_');
      expect(result.originalname).toContain('.xlsx');
      expect(result.mimetype).toBe(mockTemplateFile.mimetype);
      expect(result.size).toBeDefined();
      if (result.buffer && result.size) {
        expect(result.size).toBe(result.buffer.length);
      }
    });

    // Test case 2: Handle empty list
    it('should handle empty list', async () => {
      // Arrange
      const mockList: any[] = [];

      const mockTemplateFile = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      } as Express.Multer.File;

      const mockTemplate: JsonMappingListType = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              rows: '2:*',
              columns: [
                { column: 'A', dbfield: 'id' },
                { column: 'B', dbfield: 'name' },
              ],
            },
          },
        ],
      };

      // Act
      const result = await excelStrategy.exportList(mockList, mockTemplateFile, mockTemplate);

      // Assert
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.originalname).toContain('template_');
    });

    // Test case 3: Handle template without sheets
    it('should throw error when template has no sheets', async () => {
      // Arrange
      const mockList = [{ id: 1, name: 'Item 1' }];

      const mockTemplateFile = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      } as Express.Multer.File;

      const mockTemplate: JsonMappingListType = {
        sheets: [],
      };

      // Act & Assert
      await expect(
        excelStrategy.exportList(mockList, mockTemplateFile, mockTemplate),
      ).rejects.toThrow('Error exporting list to Excel: No sheets found in template');
    });

    // Test case 4: Handle sheet without mapping
    it('should skip sheet without mapping', async () => {
      // Arrange
      const mockList = [{ id: 1, name: 'Item 1' }];

      const mockTemplateFile = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      } as Express.Multer.File;

      const mockTemplate: JsonMappingListType = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              // No columns defined
              columns: [],
            },
          },
          {
            name: 'Sheet2',
            mapping: {
              columns: [{ column: 'A', dbfield: 'id' }],
            },
          },
        ],
      };

      // Act
      const result = await excelStrategy.exportList(mockList, mockTemplateFile, mockTemplate);

      // Assert
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    // Test case 5: Handle sheet with custom row mapping
    it('should handle sheet with custom row mapping', async () => {
      // Arrange
      const mockList = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];

      const mockTemplateFile = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      } as Express.Multer.File;

      const mockTemplate: JsonMappingListType = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              rows: '5:*', // Start from row 5
              columns: [
                { column: 'A', dbfield: 'id' },
                { column: 'B', dbfield: 'name' },
              ],
            },
          },
        ],
      };

      // Act
      const result = await excelStrategy.exportList(mockList, mockTemplateFile, mockTemplate);

      // Assert
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    // Test case 6: Handle sheet visibility settings
    it('should handle sheet visibility settings', async () => {
      // Arrange
      const mockList = [{ id: 1, name: 'Item 1' }];

      const mockTemplateFile = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      } as Express.Multer.File;

      const mockTemplate: JsonMappingListType = {
        sheets: [
          {
            name: 'Sheet1',
            visible: false, // Set sheet to hidden
            mapping: {
              columns: [
                { column: 'A', dbfield: 'id' },
                { column: 'B', dbfield: 'name' },
              ],
            },
          },
        ],
      };

      // Act
      const result = await excelStrategy.exportList(mockList, mockTemplateFile, mockTemplate);

      // Assert
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    // Test case 7: Handle sheet with named reference
    it('should handle sheet with named reference', async () => {
      // Arrange
      const mockList = [{ id: 1, name: 'Item 1' }];

      const mockTemplateFile = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      } as Express.Multer.File;

      const mockTemplate: JsonMappingListType = {
        sheets: [
          {
            name: 'SpecificSheet', // Specific sheet name
            mapping: {
              columns: [
                { column: 'A', dbfield: 'id' },
                { column: 'B', dbfield: 'name' },
              ],
            },
          },
        ],
      };

      // Act
      const result = await excelStrategy.exportList(mockList, mockTemplateFile, mockTemplate);

      // Assert
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    // Test case 8: Handle sheet with index reference
    it('should handle sheet with index reference', async () => {
      // Arrange
      const mockList = [{ id: 1, name: 'Item 1' }];

      const mockTemplateFile = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      } as Express.Multer.File;

      const mockTemplate: JsonMappingListType = {
        sheets: [
          {
            name: '*0', // First sheet by index
            mapping: {
              columns: [
                { column: 'A', dbfield: 'id' },
                { column: 'B', dbfield: 'name' },
              ],
            },
          },
        ],
      };

      // Act
      const result = await excelStrategy.exportList(mockList, mockTemplateFile, mockTemplate);

      // Assert
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('exportSingle', () => {
    // Test case 1: Export with valid data
    it('should export data to Excel with valid template', async () => {
      // Arrange
      const data = { name: 'John Doe', age: 30, id: '12345' };
      const templateFile: Partial<Express.Multer.File> = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      };
      const template = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              cells: [
                { cell: 'A1', dbfield: 'name' },
                { cell: 'B1', dbfield: 'age' },
              ],
            },
          },
        ],
      };

      // Act
      const result = await excelStrategy.exportSingle(data, templateFile, template);

      // Assert
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.originalname).toContain('template_');
      expect(result.originalname).toContain('.xlsx');
      expect(result.mimetype).toBe(templateFile.mimetype);
      expect(result.size).toBe(Buffer.from('mock-excel-data').length);
    });

    // Test case 2: Export with custom filename
    it('should export with custom filename when nameFormat is provided', async () => {
      // Arrange
      const data = { name: 'John Doe', id: 'ABC123' };
      const templateFile: Partial<Express.Multer.File> = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      };
      const template = {
        config: {
          nameFormat: ['Report-', '?id', '-', '?name', '.xlsx'],
        },
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              cells: [{ cell: 'A1', dbfield: 'name' }],
            },
          },
        ],
      };

      // Mock Date to ensure consistent filename
      const originalDate = global.Date;
      const fixedDate = new Date('2023-01-01T00:00:00Z');
      global.Date = class extends Date {
        constructor() {
          super();
          return fixedDate;
        }
      } as any;

      try {
        // Act
        const result = await excelStrategy.exportSingle(data, templateFile, template);

        // Assert
        expect(result.originalname).toBe('Report-ABC123-John Doe.xlsx');
      } finally {
        // Restore original Date
        global.Date = originalDate;
      }
    });

    // Test case 3: Export with dbfield value
    it('should correctly set cell values from dbfield', async () => {
      // Arrange
      const data = { name: 'John Doe', age: 30 };
      const templateFile: Partial<Express.Multer.File> = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      };
      const template = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              cells: [{ cell: 'A1', dbfield: 'name' }],
            },
          },
        ],
      };

      // Mock the getCell method to track calls
      const mockGetCell = jest.fn().mockReturnValue({ value: '', style: {} });
      const mockWorksheet = {
        getCell: mockGetCell,
        state: 'visible',
        views: [],
      };
      const mockWorkbook = {
        worksheets: [mockWorksheet],
        getWorksheet: jest.fn().mockReturnValue(mockWorksheet),
        xlsx: {
          load: jest.fn().mockResolvedValue(undefined),
          writeBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-excel-data')),
        },
      };

      // @ts-expect-error - Mock the ExcelJS.Workbook constructor
      ExcelJS.Workbook.mockImplementationOnce(() => mockWorkbook);

      // Act
      await excelStrategy.exportSingle(data, templateFile, template);

      // Assert
      expect(mockGetCell).toHaveBeenCalledWith('A1');
      expect(mockGetCell.mock.results[0].value.value).toBe('John Doe');
    });

    // Test case 4: Export with dbfields formatting
    it('should correctly format values using dbfields', async () => {
      // Arrange
      const data = { firstName: 'John', lastName: 'Doe' };
      const templateFile: Partial<Express.Multer.File> = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      };
      const template = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              cells: [{ cell: 'A1', dbfields: ['{0} {1}', 'firstName', 'lastName'] }],
            },
          },
        ],
      };

      // Mock CommonUtils.formatString
      const originalFormatString = require('src/utils/common.util').CommonUtils.formatString;
      const mockFormatString = jest.fn().mockReturnValue('John Doe');
      require('src/utils/common.util').CommonUtils.formatString = mockFormatString;

      try {
        // Act
        await excelStrategy.exportSingle(data, templateFile, template);

        // Assert
        expect(mockFormatString).toHaveBeenCalledWith('{0} {1}', 'John', 'Doe');
      } finally {
        // Restore original function
        require('src/utils/common.util').CommonUtils.formatString = originalFormatString;
      }
    });

    // Test case 5: Export with const value
    it('should use const value when provided', async () => {
      // Arrange
      const data = { name: 'John Doe' };
      const templateFile: Partial<Express.Multer.File> = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      };
      const template = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              cells: [{ cell: 'A1', dbfield: 'name', const: 'Constant Value' }],
            },
          },
        ],
      };

      // Mock the getCell method to track calls
      const mockGetCell = jest.fn().mockReturnValue({ value: '', style: {} });
      const mockWorksheet = {
        getCell: mockGetCell,
        state: 'visible',
        views: [],
      };
      const mockWorkbook = {
        worksheets: [mockWorksheet],
        getWorksheet: jest.fn().mockReturnValue(mockWorksheet),
        xlsx: {
          load: jest.fn().mockResolvedValue(undefined),
          writeBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-excel-data')),
        },
      };

      // @ts-expect-error - Mock the ExcelJS.Workbook constructor
      ExcelJS.Workbook.mockImplementationOnce(() => mockWorkbook);

      // Act
      await excelStrategy.exportSingle(data, templateFile, template);

      // Assert
      expect(mockGetCell).toHaveBeenCalledWith('A1');
      expect(mockGetCell.mock.results[0].value.value).toBe('Constant Value');
    });

    // Test case 6: Export with empty template
    it('should throw error when template has no sheets', async () => {
      // Arrange
      const data = { name: 'John Doe' };
      const templateFile: Partial<Express.Multer.File> = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      };
      const template = {
        sheets: [],
      };

      // Act & Assert
      await expect(excelStrategy.exportSingle(data, templateFile, template)).rejects.toThrow(
        'Error exporting single to Excel: No sheets found in template',
      );
    });

    // Test case 7: Export with invalid sheet
    it('should skip sheet when mapping or cells are missing', async () => {
      // Arrange
      const data = { name: 'John Doe' };
      const templateFile: Partial<Express.Multer.File> = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      };
      const template = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              // Missing cells array
            } as any,
          },
        ],
      };

      // Act
      const result = await excelStrategy.exportSingle(data, templateFile, template);

      // Assert
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    // Test case 8: Export with sheet visibility
    it('should set sheet visibility based on configuration', async () => {
      // Arrange
      const data = { name: 'John Doe' };
      const templateFile: Partial<Express.Multer.File> = {
        buffer: Buffer.from('mock-template-data'),
        originalname: 'template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1000,
      };
      const template = {
        sheets: [
          {
            name: 'Sheet1',
            visible: false,
            mapping: {
              cells: [{ cell: 'A1', dbfield: 'name' }],
            },
          },
        ],
      };

      // Mock the worksheet to track state changes
      const mockWorksheet = {
        getCell: jest.fn().mockReturnValue({ value: '', style: {} }),
        state: 'visible',
        views: [],
      };
      const mockWorkbook = {
        worksheets: [mockWorksheet],
        getWorksheet: jest.fn().mockReturnValue(mockWorksheet),
        xlsx: {
          load: jest.fn().mockResolvedValue(undefined),
          writeBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-excel-data')),
        },
      };

      // @ts-expect-error - Mock the ExcelJS.Workbook constructor
      ExcelJS.Workbook.mockImplementationOnce(() => mockWorkbook);

      // Act
      await excelStrategy.exportSingle(data, templateFile, template);

      // Assert
      expect(mockWorksheet.state).toBe('hidden');
    });
  });

  describe('importSingle', () => {
    // Test case 1: Successfully import single data
    it('should successfully import single data from Excel', async () => {
      // Arrange
      const file = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const template = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              cells: [
                { cell: 'A1', dbfield: 'id' },
                { cell: 'B1', dbfield: 'name' },
                { cell: 'C1', dbfield: 'data', const: 'constant-value' },
              ],
            },
          },
        ],
      };

      // Mock workbook and worksheet
      const mockWorkSheet = {
        A1: { v: '1', t: 's' },
        B1: { v: 'John', t: 's' },
        C1: { v: 'Data', t: 's' },
      };

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: mockWorkSheet,
        },
      };

      // Setup mocks
      (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);

      // Act
      const result = await excelStrategy.importSingle(file, template);

      // Assert
      expect(XLSX.read).toHaveBeenCalledWith(file.buffer, { type: 'buffer' });
      expect(result).toEqual({
        id: '1',
        name: 'John',
        data: 'constant-value',
      });
    });

    // Test case 2: Handle empty template sheets
    it('should throw error when template has no sheets', async () => {
      // Arrange
      const file = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const template = {
        sheets: [],
      };

      // Setup mocks
      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {},
        },
      });

      // Spy on Logger.warn
      const loggerSpy = jest.spyOn(Logger, 'warn').mockImplementation();

      // Act & Assert
      await expect(excelStrategy.importSingle(file, template)).rejects.toThrow(
        'Error importing single from Excel: No sheets found in template',
      );
      expect(loggerSpy).toHaveBeenCalled();
    });

    // Test case 3: Handle sheet without mapping
    it('should skip sheet without mapping', async () => {
      // Arrange
      const file = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const template = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              cells: [], // Empty cells array
            },
          },
          {
            name: 'Sheet2',
            mapping: {
              cells: [{ cell: 'A1', dbfield: 'id' }],
            },
          },
        ],
      };

      // Mock workbook and worksheets
      const mockSheet1 = {};

      const mockSheet2 = {
        A1: { v: 'C001', t: 's' },
      };

      const mockWorkbook = {
        SheetNames: ['Sheet1', 'Sheet2'],
        Sheets: {
          Sheet1: mockSheet1,
          Sheet2: mockSheet2,
        },
      };

      // Setup mocks
      (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);

      // Act
      const result = await excelStrategy.importSingle(file, template);

      // Assert
      expect(result).toEqual({
        id: 'C001',
      });
    });

    // Test case 4: Handle sheet with wildcard name
    it('should handle sheet name with wildcard index', async () => {
      // Arrange
      const file = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const template = {
        sheets: [
          {
            name: '*0', // First sheet by index
            mapping: {
              cells: [
                { cell: 'A1', dbfield: 'id' },
                { cell: 'B1', dbfield: 'name' },
              ],
            },
          },
        ],
      };

      // Mock workbook and worksheet
      const mockWorkSheet = {
        A1: { v: '1', t: 's' },
        B1: { v: 'John', t: 's' },
      };

      const mockWorkbook = {
        SheetNames: ['FirstSheet', 'SecondSheet'],
        Sheets: {
          FirstSheet: mockWorkSheet,
        },
      };

      // Setup mocks
      (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);

      // Act
      const result = await excelStrategy.importSingle(file, template);

      // Assert
      expect(result).toEqual({
        id: '1',
        name: 'John',
      });
    });

    // Test case 5: Handle unnamed sheet
    it('should handle unnamed sheet and use all non-hidden sheets', async () => {
      // Arrange
      const file = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const template = {
        sheets: [
          {
            // No name specified
            mapping: {
              cells: [
                { cell: 'A1', dbfield: 'id' },
                { cell: 'B1', dbfield: 'name' },
              ],
            },
          },
        ],
      };

      // Mock workbook and worksheets
      const mockSheet1 = {
        A1: { v: '1', t: 's' },
        B1: { v: 'John', t: 's' },
      };

      const mockSheet2 = {
        A1: { v: '2', t: 's' },
        B1: { v: 'Jane', t: 's' },
        '!hidden': 1, // Hidden sheet
      };

      const mockWorkbook = {
        SheetNames: ['Sheet1', 'Sheet2'],
        Sheets: {
          Sheet1: mockSheet1,
          Sheet2: mockSheet2,
        },
      };

      // Setup mocks
      (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);

      // Act
      const result = await excelStrategy.importSingle(file, template);

      // Assert
      expect(result).toEqual({
        id: '1',
        name: 'John',
      });
    });

    // Test case 6: Handle missing worksheet
    it('should handle missing worksheet', async () => {
      // Arrange
      const file = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const template = {
        sheets: [
          {
            name: 'NonExistentSheet',
            mapping: {
              cells: [{ cell: 'A1', dbfield: 'id' }],
            },
          },
        ],
      };

      // Mock workbook with no matching sheet
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {},
        },
      };

      // Setup mocks
      (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);

      // Act
      const result = await excelStrategy.importSingle(file, template);

      // Assert
      expect(result).toEqual({});
    });

    // Test case 7: Handle missing cell value
    it('should handle missing cell value', async () => {
      // Arrange
      const file = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const template = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              cells: [
                { cell: 'A1', dbfield: 'id' },
                { cell: 'B1', dbfield: 'name' },
                { cell: 'C1', dbfield: 'missing' }, // This cell doesn't exist
                { cell: 'D1', dbfield: 'withConst', const: 'default-value' }, // This cell doesn't exist but has const
              ],
            },
          },
        ],
      };

      // Mock workbook and worksheet with missing cells
      const mockWorkSheet = {
        A1: { v: '1', t: 's' },
        B1: { v: 'John', t: 's' },
        // C1 is missing
        // D1 is missing but has const
      };

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: mockWorkSheet,
        },
      };

      // Setup mocks
      (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);

      // Act
      const result = await excelStrategy.importSingle(file, template);

      // Assert
      expect(result).toEqual({
        id: '1',
        name: 'John',
        withConst: 'default-value',
      });
    });

    // Test case 8: Handle error during import
    it('should handle errors during import', async () => {
      // Arrange
      const file = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const template = {
        sheets: [
          {
            name: 'Sheet1',
            mapping: {
              cells: [{ cell: 'A1', dbfield: 'id' }],
            },
          },
        ],
      };

      // Setup mocks to throw error
      (XLSX.read as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act & Assert
      await expect(excelStrategy.importSingle(file, template)).rejects.toThrow(
        'Error importing single from Excel: Test error',
      );
    });
  });
});
