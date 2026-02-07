// Safe Excel utility using exceljs library
// Replaces vulnerable xlsx library

import ExcelJS from 'exceljs';

// Interface compatible with xlsx library for easier migration
export interface ExcelWorkbook {
  SheetNames: string[];
  Sheets: Record<string, ExcelSheet>;
}

export interface ExcelSheet {
  name: string;
  data: any[][];
  jsonData: any[];
}

// Utility functions to mimic xlsx API
export const utils = {
  sheet_to_json: <T = any>(sheet: ExcelSheet, options?: { header?: 1 | 'A'; defval?: any; blankrows?: boolean }): T[] => {
    if (options?.header === 1) {
      // Return as 2D array
      if (options?.blankrows === false) {
        return sheet.data.filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined)) as T[];
      }
      return sheet.data as T[];
    }
    // Return as JSON objects
    return sheet.jsonData as T[];
  },
  
  book_new: (): { sheets: Map<string, any[][]>; sheetNames: string[] } => {
    return { sheets: new Map(), sheetNames: [] };
  },
  
  book_append_sheet: (workbook: { sheets: Map<string, any[][]>; sheetNames: string[] }, data: any[][], name: string): void => {
    workbook.sheets.set(name, data);
    workbook.sheetNames.push(name);
  },
  
  json_to_sheet: (data: any[]): any[][] => {
    if (data.length === 0) return [];
    const headers = Object.keys(data[0]);
    const rows = [headers];
    data.forEach(item => {
      rows.push(headers.map(h => item[h]));
    });
    return rows;
  },
  
  aoa_to_sheet: (data: any[][]): any[][] => {
    return data;
  },
};

// Read an Excel file and return parsed workbook data (xlsx-compatible interface)
// Extract primitive value from an ExcelJS cell
function getCellPrimitiveValue(cell: any): any {
  let value = cell.value;
  
  // Handle different cell types
  if (value && typeof value === 'object') {
    if ('richText' in value) {
      value = (value as { richText: { text: string }[] }).richText.map((rt: any) => rt.text).join('');
    } else if ('result' in value) {
      // Formula result
      value = (value as { result: any }).result;
    } else if ('text' in value) {
      // Hyperlink
      value = (value as { text: string }).text;
    }
  }
  
  return value;
}

export async function readExcelFile(arrayBuffer: ArrayBuffer): Promise<ExcelWorkbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  
  const result: ExcelWorkbook = {
    SheetNames: [],
    Sheets: {},
  };
  
  workbook.eachSheet((worksheet) => {
    result.SheetNames.push(worksheet.name);
    
    const data: any[][] = [];
    const jsonData: any[] = [];
    let headers: string[] = [];
    
    // Determine the actual max column count from the worksheet
    const wsColCount = worksheet.columnCount || 20;
    
    // Collect merged cell ranges for proper value propagation
    const mergedRanges: { top: number; left: number; bottom: number; right: number; value: any }[] = [];
    try {
      // ExcelJS stores merges in the worksheet model
      const merges = (worksheet as any).model?.merges || (worksheet as any)._merges || [];
      for (const mergeRange of merges) {
        // mergeRange can be a string like "A1:B2" or an object
        const rangeStr = typeof mergeRange === 'string' ? mergeRange : (mergeRange?.range || mergeRange?.model || String(mergeRange));
        if (typeof rangeStr === 'string' && rangeStr.includes(':')) {
          const parts = rangeStr.split(':');
          const topLeft = worksheet.getCell(parts[0]);
          const bottomRight = worksheet.getCell(parts[1]);
          const masterValue = getCellPrimitiveValue(topLeft);
          mergedRanges.push({
            top: Number(topLeft.row),
            left: Number(topLeft.col),
            bottom: Number(bottomRight.row),
            right: Number(bottomRight.col),
            value: masterValue,
          });
        }
      }
    } catch (e) {
      console.log('📊 Could not read merged cell info:', e);
    }
    
    // Helper to find merged value for a given cell position
    function getMergedValue(rowNum: number, colNum: number): any | undefined {
      for (const range of mergedRanges) {
        if (rowNum >= range.top && rowNum <= range.bottom && colNum >= range.left && colNum <= range.right) {
          return range.value;
        }
      }
      return undefined;
    }
    
    // Track which Excel row numbers we've seen (to handle includeEmpty: false)
    let lastRowNumber = 0;
    
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      // Only process up to a reasonable limit
      if (rowNumber > 5000) return;
      lastRowNumber = rowNumber;
      
      const rowData: any[] = [];
      
      // Use the worksheet column count to ensure we read ALL columns
      const colCount = Math.max(row.cellCount || 0, wsColCount);
      
      for (let colNumber = 1; colNumber <= colCount; colNumber++) {
        const cell = row.getCell(colNumber);
        let value = getCellPrimitiveValue(cell);
        
        // If cell value is empty/null, check if it's part of a merged range
        if (value === '' || value === null || value === undefined) {
          const mergedVal = getMergedValue(rowNumber, colNumber);
          if (mergedVal !== undefined) {
            value = mergedVal;
          }
        }
        
        rowData[colNumber - 1] = value ?? '';
      }
      data.push(rowData);
      
      // Build JSON data (first row as headers)
      if (rowNumber === 1) {
        headers = rowData.map(h => String(h ?? '').trim());
      } else {
        const obj: Record<string, any> = {};
        headers.forEach((header, idx) => {
          if (header) {
            obj[header] = rowData[idx] ?? '';
          }
        });
        if (Object.keys(obj).length > 0) {
          jsonData.push(obj);
        }
      }
    });
    
    result.Sheets[worksheet.name] = {
      name: worksheet.name,
      data,
      jsonData,
    };
  });
  
  return result;
}

// Wrapper to read file (mimics XLSX.read)
export async function read(data: ArrayBuffer | Uint8Array, options?: { type: string }): Promise<ExcelWorkbook> {
  const arrayBuffer = data instanceof Uint8Array 
    ? new Uint8Array(data).buffer as ArrayBuffer
    : data;
  return readExcelFile(arrayBuffer);
}

// Get sheet data as 2D array (for compatibility with existing code)
export function sheetToArray(sheet: ExcelSheet): any[][] {
  return sheet.data;
}

// Get sheet data as JSON objects (first row as headers)
export function sheetToJson(sheet: ExcelSheet): any[] {
  return sheet.jsonData;
}

// Create a new workbook and export to buffer
export async function createWorkbook(): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Application';
  workbook.created = new Date();
  return workbook;
}

// Add a worksheet with data and return the workbook buffer
export async function createSimpleExcel(
  sheetName: string,
  data: any[][],
  options?: {
    rtl?: boolean;
    columnWidths?: number[];
  }
): Promise<ArrayBuffer> {
  const workbook = await createWorkbook();
  
  const worksheet = workbook.addWorksheet(sheetName.substring(0, 31), {
    views: options?.rtl !== false ? [{ rightToLeft: true }] : undefined,
  });
  
  // Add data
  data.forEach((rowData, rowIndex) => {
    const row = worksheet.getRow(rowIndex + 1);
    rowData.forEach((cellValue, colIndex) => {
      row.getCell(colIndex + 1).value = cellValue;
    });
    row.commit();
  });
  
  // Set column widths
  if (options?.columnWidths) {
    options.columnWidths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });
  } else {
    // Default width
    for (let i = 1; i <= (data[0]?.length || 10); i++) {
      worksheet.getColumn(i).width = 15;
    }
  }
  
  return await workbook.xlsx.writeBuffer();
}

// Download buffer as Excel file
export function downloadExcelBuffer(buffer: ArrayBuffer, fileName: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Write workbook to file
export async function writeFile(
  workbookData: { sheets: Map<string, any[][]>; sheetNames: string[] },
  fileName: string,
  options?: { rtl?: boolean }
): Promise<void> {
  const workbook = await createWorkbook();
  
  workbookData.sheetNames.forEach(sheetName => {
    const data = workbookData.sheets.get(sheetName);
    if (!data) return;
    
    const worksheet = workbook.addWorksheet(sheetName.substring(0, 31), {
      views: options?.rtl !== false ? [{ rightToLeft: true }] : undefined,
    });
    
    data.forEach((rowData, rowIndex) => {
      const row = worksheet.getRow(rowIndex + 1);
      rowData.forEach((cellValue, colIndex) => {
        row.getCell(colIndex + 1).value = cellValue;
      });
      row.commit();
    });
    
    // Default column width
    for (let i = 1; i <= (data[0]?.length || 10); i++) {
      worksheet.getColumn(i).width = 15;
    }
  });
  
  const buffer = await workbook.xlsx.writeBuffer();
  downloadExcelBuffer(buffer, fileName);
}
