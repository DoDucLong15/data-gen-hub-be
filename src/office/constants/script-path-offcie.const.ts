export const OfficePathScript = {
  LIST_TO_DB: process.env.PYTHON_SCRIPT_LIST_TO_DB || '../python-script/list2db.py',
  DB_TO_LIST: process.env.PYTHON_SCRIPT_DB_TO_LIST || '../python-script/db2list.py',
  EXCEL_TO_DB: process.env.PYTHON_SCRIPT_EXCEL_TO_DB || '../python-script/excel2db.py',
  DB_TO_EXCEL: process.env.PYTHON_SCRIPT_DB_TO_EXCEL || '../python-script/db2excel.py',
  DB_TO_WORD: process.env.PYTHON_SCRIPT_DB_TO_WORD || '../python-script/db2docx.py',
};
