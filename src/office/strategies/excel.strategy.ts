import { Logger } from "@nestjs/common";
import { OfficeStrategy } from "../interfaces/office.interface";
import { JsonMappingListType } from "../types/json-mapping-list.type";
import * as XLSX from 'xlsx';

export class ExcelStrategy implements OfficeStrategy {
  constructor(){}
  
  async importList<T extends any>(file: Express.Multer.File, template: JsonMappingListType): Promise<T[]> {
    Logger.verbose(`Importing Excel file ${file.originalname} with template ${JSON.stringify(template)}`, 'ExcelStrategy.importList');
    const result: T[] = [];
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      if(!template.sheets?.length) {
        Logger.warn(`No sheets found in template ${JSON.stringify(template)}`, 'ExcelStrategy.importList');
        return [];
      }
      for(const sheet of template.sheets) {
        if(!sheet.mapping || !sheet.mapping.columns) continue;
        const names: string[] = [];
        if(!sheet.name) {
          workbook.SheetNames.forEach(name => names.push(name));
        } else if(sheet.name.startsWith('*')) {
          const index = parseInt(sheet.name.substring(1));
          if(index < workbook.SheetNames.length) {
            names.push(workbook.SheetNames[index]);
          }
        } else {
          names.push(sheet.name);
        }
        for(const sheetName of names) {
          const workSheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
          if(!workSheet) continue;
          const range = XLSX.utils.decode_range(workSheet['!ref']!!);
          let minRow = 1;
          let maxRow = range.e.r + 1;
          if(sheet.mapping.rows) {
            const rows = sheet.mapping.rows.split(':');
            if(rows.length === 2) {
              minRow = rows[0] === '*' ? minRow : parseInt(rows[0]);
              maxRow = rows[1] === '*' ? maxRow : parseInt(rows[1]);
            }
          }
          for(let row = minRow; row <= maxRow; row++) {
            const item: Record<string, any> = {};
            for(const column of sheet.mapping.columns) {
              const cell = workSheet[column.column + row];
              if(!cell) continue;
              let value = cell.v;
              if(typeof value === 'string') value = value.trim();
              if(column.dbField) item[column.dbField] = column.const ?? value;
            }
            result.push(item as T);
          }
        }
      }
    } catch (error) {
      Logger.error(`Error importing Excel file ${file.originalname}: ${error.message}`, error.stack, 'ExcelStrategy.importList');
    }
    Logger.verbose(`Imported ${result.length} items from Excel file ${file.originalname}`, 'ExcelStrategy.importList');
    return result;
  }
}