import { Logger } from '@nestjs/common';
import { OfficeStrategy } from '../interfaces/office.interface';
import { JsonMappingListType } from '../types/json-mapping-list.type';
import * as XLSX from 'xlsx';
import { isBoolean } from 'class-validator';
import * as ExcelJS from 'exceljs';
import { columnLetterToNumber } from '../helpers/office.helper';
import { JsonMappingSingleType } from 'src/template-specification/types/json.type';
import { CommonUtils } from 'src/utils/common.util';
import { PythonScriptService } from 'src/python-script/python-script.service';
import { OfficePathScript } from '../constants/script-path-offcie.const';
import { ThesisDocumentEnum } from 'src/thesis-management/enums/thesis-document.enum';

export class ExcelStrategy implements OfficeStrategy {
  constructor(private readonly pythonScriptService: PythonScriptService) {}

  async importList<T extends any>(
    file: Express.Multer.File,
    template: JsonMappingListType,
  ): Promise<T[]> {
    Logger.verbose(
      `Importing Excel file ${file.originalname} with template ${JSON.stringify(template)}`,
      'ExcelStrategy.importList',
    );
    const result: T[] = [];
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      if (!template.sheets?.length) {
        Logger.warn(
          `No sheets found in template ${JSON.stringify(template)}`,
          'ExcelStrategy.importList',
        );
        return [];
      }
      for (const sheet of template.sheets) {
        if (!sheet.mapping || !sheet.mapping.columns) continue;
        const names: string[] = [];
        if (!sheet.name) {
          workbook.SheetNames.forEach((name) => {
            if (workbook.Sheets[name]['!hidden'] && workbook.Sheets[name]['!hidden'] !== 0) return; // Skip hidden sheets
            names.push(name);
          });
        } else if (sheet.name.startsWith('*')) {
          const index = parseInt(sheet.name.substring(1));
          if (index < workbook.SheetNames.length) {
            names.push(workbook.SheetNames[index]);
          }
        } else {
          names.push(sheet.name);
        }
        for (const sheetName of names) {
          const workSheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
          if (!workSheet) continue;
          const range = XLSX.utils.decode_range(workSheet['!ref']!);
          let minRow = 1;
          let maxRow = range.e.r + 1;
          if (sheet.mapping.rows && typeof sheet.mapping.rows === 'string') {
            const rows = sheet.mapping.rows.split(':');
            if (rows.length === 2) {
              minRow = rows[0] === '*' ? minRow : parseInt(rows[0]);
              maxRow = rows[1] === '*' ? maxRow : parseInt(rows[1]);
            }
          }
          for (let row = minRow; row <= maxRow; row++) {
            const item: Record<string, any> = {};
            for (const column of sheet.mapping.columns) {
              const cell = workSheet[column.column + row];
              if (!cell) continue;
              let value = cell.v;
              if (typeof value === 'string') value = value.trim();
              if (column.dbField) item[column.dbField] = column.const ?? value;
            }
            result.push(item as T);
          }
        }
      }
    } catch (error) {
      Logger.error(
        `Error importing Excel file ${file.originalname}: ${error.message}`,
        error.stack,
        'ExcelStrategy.importList',
      );
    }
    Logger.verbose(
      `Imported ${result.length} items from Excel file ${file.originalname}`,
      'ExcelStrategy.importList',
    );
    return result;
  }

  async exportList<T>(
    list: T[],
    templateFile: Express.Multer.File,
    template: JsonMappingListType,
  ): Promise<Partial<Express.Multer.File>> {
    Logger.verbose(
      `Exporting list to Excel with template ${JSON.stringify(template)}`,
      'ExcelStrategy.exportList',
    );

    try {
      if (!template.sheets || !template.sheets.length) {
        throw new Error('No sheets found in template');
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(templateFile.buffer);

      for (const sheetConfig of template.sheets) {
        if (!sheetConfig.mapping || !sheetConfig.mapping.columns) continue;

        let sheet: ExcelJS.Worksheet;
        if (!sheetConfig.name) {
          sheet = workbook.worksheets[0];
        } else if (sheetConfig.name.startsWith('*')) {
          const index = parseInt(sheetConfig.name.substring(1));
          sheet = workbook.worksheets[index] || workbook.worksheets[0];
        } else {
          sheet = workbook.getWorksheet(sheetConfig.name) || workbook.worksheets[0];
        }

        if (!sheet) continue;

        let minRow = 1;
        if (sheetConfig.mapping.rows && typeof sheetConfig.mapping.rows === 'string') {
          const rows = sheetConfig.mapping.rows.split(':');
          if (rows.length === 2) {
            minRow = rows[0] === '*' ? minRow : parseInt(rows[0]);
          }
        }

        for (let row = minRow; row < list.length + minRow; row++) {
          const excelRow = sheet.getRow(row);

          for (const column of sheetConfig.mapping.columns) {
            const cell = excelRow.getCell(column.column);
            const prevStyle = { ...cell.style };

            const value =
              column.const ??
              (column.dbField ? (list[row - minRow] as Record<string, any>)[column.dbField] : null);

            cell.value = value ?? '';
            cell.style = prevStyle;
          }

          excelRow.commit();
        }

        if (typeof sheetConfig.visible === 'boolean') {
          sheet.state = sheetConfig.visible ? 'visible' : 'hidden';
        }
        if (sheet.state === 'visible') {
          sheet.views = [{ state: 'normal' }];
        }
      }

      const excelBuffer: Buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      return {
        buffer: excelBuffer,
        originalname: templateFile.originalname.replace(
          /\.xlsx$/,
          `_${new Date().toISOString().replace(/[:.]/g, '_')}.xlsx`,
        ),
        mimetype: templateFile.mimetype,
        size: excelBuffer.length,
      };
    } catch (error) {
      throw new Error(`Error exporting list to Excel: ${error.message}`);
    } finally {
      Logger.verbose(`Exported list to Excel`, 'ExcelStrategy.exportList');
    }
  }

  async exportListV2<T extends unknown>(
    list: T[],
    templateFile: Express.Multer.File,
    template: JsonMappingListType,
  ): Promise<Partial<Express.Multer.File>> {
    Logger.verbose(
      `Exporting list to Excel with template ${JSON.stringify(template)}`,
      'ExcelStrategy.exportList',
    );
    try {
      if (!template.sheets || !template.sheets.length) {
        throw new Error('No sheets found in template');
      }
      const workbook = XLSX.read(templateFile.buffer, {
        type: 'buffer',
      });
      for (const sheet of template.sheets) {
        if (!sheet.mapping || !sheet.mapping.columns) continue;
        const names: string[] = [];
        if (!sheet.name) {
          names.push(workbook.SheetNames[0]);
        } else if (sheet.name.startsWith('*')) {
          const index = parseInt(sheet.name.substring(1));
          if (index < workbook.SheetNames.length) {
            names.push(workbook.SheetNames[index]);
          }
        } else {
          names.push(sheet.name);
        }
        for (const sheetName of names) {
          const workSheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
          if (!workSheet) continue;
          let minRow = 1;
          if (sheet.mapping.rows && typeof sheet.mapping.rows === 'string') {
            const rows = sheet.mapping.rows.split(':');
            if (rows.length === 2) {
              minRow = rows[0] === '*' ? minRow : parseInt(rows[0]);
            }
          }
          let maxCol = 0;
          let maxRow = minRow;
          if (workSheet['!ref']) {
            const range = XLSX.utils.decode_range(workSheet['!ref']);
            maxCol = range.e.c;
            maxRow = range.e.r;
          }
          for (let row = minRow; row < list.length + minRow; row++) {
            for (const column of sheet.mapping.columns) {
              const value =
                column.const ??
                (column.dbField
                  ? (list[row - minRow] as Record<string, any>)[column.dbField]
                  : null);
              workSheet[column.column + row] = {
                v: value ?? '',
                t: typeof value === 'number' ? 'n' : 's',
              };
              if (value) {
                maxCol = Math.max(maxCol, XLSX.utils.decode_col(column.column));
                maxRow = row;
              }
            }
          }
          if (isBoolean(sheet.visible)) {
            workSheet['!hidden'] = sheet.visible ? 0 : 1;
          }
          workSheet['!ref'] = XLSX.utils.encode_range({
            s: { c: 0, r: 0 },
            e: { c: maxCol, r: maxRow },
          });
        }
      }
      const excelBuffer: Buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      return {
        buffer: excelBuffer,
        originalname: templateFile.originalname.replace(
          /\.xlsx$/,
          `_${new Date().toISOString().replace(/[:.]/g, '_')}.xlsx`,
        ),
        mimetype: templateFile.mimetype,
        size: excelBuffer.length,
      };
    } catch (error) {
      throw new Error(`Error exporting list to Excel: ${error.message}`);
    } finally {
      Logger.verbose(`Exported list to Excel`, 'ExcelStrategy.exportList');
    }
  }

  async exportSingle<T extends unknown>(
    data: T,
    templateFile: Partial<Express.Multer.File>,
    template: JsonMappingSingleType,
  ): Promise<Partial<Express.Multer.File>> {
    try {
      Logger.verbose(
        `Exporting single to Excel with template ${JSON.stringify(data)}`,
        'ExcelStrategy.exportSingle',
      );
      if (!template.sheets || !template.sheets.length) {
        throw new Error('No sheets found in template');
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(templateFile.buffer!);

      for (const sheetConfig of template.sheets) {
        if (!sheetConfig.mapping || !sheetConfig.mapping.cells) continue;

        let sheet: ExcelJS.Worksheet;
        if (!sheetConfig.name) {
          sheet = workbook.worksheets[0];
        } else if (sheetConfig.name.startsWith('*')) {
          const index = parseInt(sheetConfig.name.substring(1));
          sheet = workbook.worksheets[index] || workbook.worksheets[0];
        } else {
          sheet = workbook.getWorksheet(sheetConfig.name) || workbook.worksheets[0];
        }

        if (!sheet) continue;

        for (const cell of sheetConfig.mapping.cells) {
          // Check format cell
          // if (cell.cell.match(/^[A-Z]+[1-9]+$/g) === null) continue;
          const excelCell = sheet.getCell(cell.cell);
          const prevStyle = { ...excelCell.style };

          const value =
            cell.const ??
            (cell.dbField
              ? (data as Record<string, any>)[cell.dbField]
              : cell.dbFields
                ? CommonUtils.formatString(
                    cell.dbFields[0],
                    ...cell.dbFields
                      .slice(1)
                      .map((field) => (data as Record<string, any>)[field].toString()),
                  )
                : null);
          excelCell.value = value ?? '';
          excelCell.style = prevStyle;
        }

        if (typeof sheetConfig.visible === 'boolean') {
          sheet.state = sheetConfig.visible ? 'visible' : 'hidden';
        }
        if (sheet.state === 'visible') {
          sheet.views = [{ state: 'normal' }];
        }
      }

      const excelBuffer: Buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      let fileResultName =
        templateFile.originalname?.replace(
          /\.xlsx$/,
          `_${new Date().toISOString().replace(/[:.]/g, '_')}.xlsx`,
        ) || 'export.xlsx';
      if (template.config?.nameFormat) {
        let temp = '';
        template.config.nameFormat.map((s) => {
          if (s.startsWith('?')) {
            temp += (data as Record<string, any>)[s.substring(1)];
          } else {
            temp += s;
          }
        });
        fileResultName = temp.endsWith('.xlsx') ? temp : temp + '.xlsx';
      }
      return {
        buffer: excelBuffer,
        originalname: fileResultName,
        mimetype: templateFile.mimetype,
        size: excelBuffer.length,
      };
    } catch (error) {
      throw new Error(`Error exporting single to Excel: ${error.message}`);
    } finally {
      Logger.verbose(`Exported single to Excel`, 'ExcelStrategy.exportSingle');
    }
  }

  async importSingle<T extends unknown>(
    file: Express.Multer.File,
    template: JsonMappingSingleType,
  ): Promise<T> {
    try {
      Logger.verbose(
        `Importing single from Excel file ${file.originalname} with template ${JSON.stringify(template)}`,
      );
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      if (!template.sheets?.length) {
        Logger.warn(
          `No sheets found in template ${JSON.stringify(template)}`,
          'ExcelStrategy.importSingle',
        );
        throw new Error('No sheets found in template');
      }
      const result: Record<string, any> = {};
      for (const sheet of template.sheets) {
        if (!sheet.mapping || !sheet.mapping.cells) continue;
        const names: string[] = [];
        if (!sheet.name) {
          workbook.SheetNames.forEach((name) => {
            if (workbook.Sheets[name]['!hidden'] && workbook.Sheets[name]['!hidden'] !== 0) return; // Skip hidden sheets
            names.push(name);
          });
        } else if (sheet.name.startsWith('*')) {
          const index = parseInt(sheet.name.substring(1));
          if (index < workbook.SheetNames.length) {
            names.push(workbook.SheetNames[index]);
          }
        } else {
          names.push(sheet.name);
        }
        for (const sheetName of names) {
          const workSheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
          if (!workSheet) continue;
          for (const cell of sheet.mapping.cells) {
            const value = workSheet[cell.cell]?.v;
            if (cell.dbField) result[cell.dbField] = cell.const ?? value;
          }
        }
      }
      return result as T;
    } catch (error) {
      throw new Error(`Error importing single from Excel: ${error.message}`);
    } finally {
      Logger.verbose(
        `Imported single from Excel file ${file.originalname}`,
        'ExcelStrategy.importSingle',
      );
    }
  }

  async importListByScript(
    inputPath: string,
    specificationPath: string,
    classId: string,
  ): Promise<void> {
    try {
      Logger.verbose(
        `Importing list by script with input ${inputPath} and specification ${specificationPath}`,
        'ExcelStrategy.importListByScript',
      );
      const output = await this.pythonScriptService.runPythonScript(OfficePathScript.LIST_TO_DB, [
        '-s',
        specificationPath,
        '-t',
        inputPath,
        '-c',
        classId,
      ]);
      Logger.verbose(output, 'ExcelStrategy.importListByScript');
    } catch (error) {
      throw new Error(`Error importing list by script: ${error.message}`);
    }
  }
  async exportListByScript(
    classId: string,
    studentIds: string[],
    templatePath: string,
    specificationPath: string,
  ): Promise<void> {
    try {
      Logger.verbose(
        `Exporting list by script with template ${templatePath} and specification ${specificationPath}`,
        'ExcelStrategy.exportListByScript',
      );
      const output = await this.pythonScriptService.runPythonScript(OfficePathScript.DB_TO_LIST, [
        '-s',
        specificationPath,
        '-t',
        templatePath,
        '-c',
        classId,
        '-o',
        `data-gen-hub/${classId}/students/output`,
        ...(studentIds?.length ? ['-si', studentIds.join(',')] : []),
      ]);
      Logger.verbose(output, 'ExcelStrategy.exportListByScript');
    } catch (error) {
      throw new Error(`Error exporting list by script: ${error.message}`);
    }
  }
  async exportSingleByScript(
    classId: string,
    studentIds: string[],
    templatePath: string,
    specificationPath: string,
    thesisType: ThesisDocumentEnum,
    extraData?: any,
  ): Promise<void> {
    try {
      Logger.verbose(
        `Exporting single by script with template ${templatePath} and specification ${specificationPath}`,
        'ExcelStrategy.exportSingleByScript',
      );
      const output = await this.pythonScriptService.runPythonScript(OfficePathScript.DB_TO_EXCEL, [
        '-s',
        specificationPath,
        '-t',
        templatePath,
        '-c',
        classId,
        '-o',
        `data-gen-hub/${classId}/${thesisType}/output`,
        ...(extraData ? ['-e', JSON.stringify(extraData)] : []),
        '-b',
        thesisType,
        ...(studentIds?.length ? ['-si', studentIds.join(',')] : []),
      ]);
      Logger.verbose(output, 'ExcelStrategy.exportSingleByScript');
    } catch (error) {
      throw new Error(`Error exporting single by script: ${error.message}`);
    }
  }
  async importSingleByScript(
    inputPath: string,
    specificationPath: string,
    classId: string,
  ): Promise<void> {
    try {
      Logger.verbose(
        `Importing single by script with input ${inputPath} and specification ${specificationPath}`,
        'ExcelStrategy.importSingleByScript',
      );
      const output = await this.pythonScriptService.runPythonScript(OfficePathScript.EXCEL_TO_DB, [
        '-s',
        specificationPath,
        '-t',
        inputPath,
        '-c',
        classId,
      ]);
      Logger.verbose(output, 'ExcelStrategy.importSingleByScript');
    } catch (error) {
      throw new Error(`Error importing single by script: ${error.message}`);
    }
  }
}
