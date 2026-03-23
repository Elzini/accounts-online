import { ColumnMapping } from './types';

// تطبيع النص العربي
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/ة/g, 'ه')
    .replace(/[إأآ]/g, 'ا')
    .trim();
}

function matchesArabicPattern(cellText: string, patterns: string[]): boolean {
  const normalizedCell = normalizeArabic(cellText);
  for (const pattern of patterns) {
    if (normalizedCell === normalizeArabic(pattern) || normalizedCell.includes(normalizeArabic(pattern))) return true;
  }
  return false;
}

const TB_COLUMN_MAPPINGS = {
  code: ['رمز الحساب', 'الرمز', 'الكود', 'رقم الحساب', 'code', 'account_code', 'Code', 'رقم', 'الرقم', 'كود', 'رمز', 'م', 'ر', 'رقم حساب', 'Account Code', 'Account No', 'Acc Code', 'No'],
  name: ['اسم الحساب', 'الحساب', 'البيان', 'الوصف', 'name', 'account_name', 'Name', 'اسم', 'حساب', 'وصف', 'Account Name', 'Account', 'Description', 'بيان الحساب', 'اسم', 'المسمى'],
  debit: ['مدين', 'مدين إجمالي', 'مجموع مدين', 'رصيد مدين', 'debit', 'Debit', 'المدين', 'مدين نهائي', 'Debit Balance', 'Dr', 'مدينة', 'مدينه'],
  credit: ['دائن', 'دائن إجمالي', 'مجموع دائن', 'رصيد دائن', 'credit', 'Credit', 'الدائن', 'دائن نهائي', 'Credit Balance', 'Cr', 'دائنة', 'دائنه'],
  movementDebit: ['حركة مدينة', 'حركة مدين', 'مدين الحركة', 'حركه مدينه', 'حركه مدين', 'Movement Debit', 'Dr Movement'],
  movementCredit: ['حركة دائنة', 'حركة دائن', 'دائن الحركة', 'حركه دائنه', 'حركه دائن', 'Movement Credit', 'Cr Movement'],
};

export { TB_COLUMN_MAPPINGS };

const TB_PARENT_HEADERS = {
  closing: ['الصافي', 'الختامي', 'الرصيد النهائي', 'صافي', 'الرصيد الصافي', 'net', 'closing', 'balance', 'الرصيد'],
  movement: ['الحركة', 'حركة', 'movement'],
  opening: ['الرصيد السابق', 'رصيد سابق', 'الافتتاحي', 'opening'],
};

export function findValue(row: any, possibleKeys: string[]): string | null {
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return String(row[key]).trim();
  }
  const rowKeys = Object.keys(row);
  for (const possibleKey of possibleKeys) {
    for (const rowKey of rowKeys) {
      if (rowKey.includes(possibleKey) || possibleKey.includes(rowKey)) {
        if (row[rowKey] !== undefined && row[rowKey] !== null && row[rowKey] !== '') return String(row[rowKey]).trim();
      }
    }
  }
  return null;
}

export function parseNumber(val: string | null | number): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  let str = String(val).trim();
  const isNegative = str.startsWith('(') && str.endsWith(')');
  if (isNegative) str = str.slice(1, -1);
  const cleaned = str.replace(/[^\d.\-,]/g, '').replace(/,/g, '');
  const num = parseFloat(cleaned) || 0;
  return isNegative ? -num : num;
}

function findColumnIndex(headerRow: any[], possibleNames: string[]): number {
  for (let i = 0; i < headerRow.length; i++) {
    const cellVal = String(headerRow[i] ?? '').trim();
    if (!cellVal) continue;
    for (const name of possibleNames) { if (cellVal === name) return i; }
  }
  for (let i = 0; i < headerRow.length; i++) {
    const cellVal = String(headerRow[i] ?? '').trim();
    if (!cellVal || cellVal.length > 30) continue;
    for (const name of possibleNames) { if (cellVal.includes(name)) return i; }
  }
  for (let i = 0; i < headerRow.length; i++) {
    const cellVal = String(headerRow[i] ?? '').trim();
    if (!cellVal || cellVal.length > 5 || cellVal.length < 1) continue;
    for (const name of possibleNames) { if (name.includes(cellVal) && name.length <= 10) return i; }
  }
  return -1;
}

function isLikelyHeaderRow(rowStr: string[]): boolean {
  const nonEmptyCells = rowStr.filter(c => c && c.trim().length > 0);
  if (nonEmptyCells.length < 2) return false;
  if (nonEmptyCells.filter(c => c.length > 30).length > nonEmptyCells.length * 0.3) return false;
  if (nonEmptyCells.filter(c => /^[\d,.\-()]+$/.test(c.replace(/\s/g, ''))).length > nonEmptyCells.length * 0.5) return false;
  return true;
}

export function looksLikeAccountCode(val: string): boolean {
  if (!val) return false;
  const cleaned = val.trim();
  if (/^\d+$/.test(cleaned)) return true;
  if (/^[\d.\-/]+$/.test(cleaned) && /\d/.test(cleaned)) return true;
  return false;
}

export function looksLikeAccountName(val: string): boolean {
  if (!val || val.length < 2) return false;
  if (/[\u0600-\u06FF]/.test(val)) return true;
  if (/[a-zA-Z]{2,}/.test(val)) return true;
  return false;
}

function looksLikeFinancialNumber(val: any): boolean {
  if (typeof val === 'number') return true;
  if (!val) return false;
  const str = String(val).trim();
  if (str === '' || str === '-' || str === '0') return true;
  return /[\d]/.test(str);
}

function validateCodeColumn(rawData: any[][], codeCol: number, dataStartRow: number): boolean {
  let validCount = 0;
  const checkRows = Math.min(dataStartRow + 10, rawData.length);
  for (let i = dataStartRow; i < checkRows; i++) {
    const val = String(rawData[i]?.[codeCol] ?? '').trim();
    if (val && looksLikeAccountCode(val)) validCount++;
  }
  return validCount >= 2;
}

function findCodeColumnFromData(rawData: any[][], dataStartRow: number, excludeCols: number[]): number {
  const checkRows = Math.min(dataStartRow + 15, rawData.length);
  const maxCols = Math.max(...rawData.slice(dataStartRow, checkRows).map(r => r?.length ?? 0));
  let bestCol = -1, bestScore = 0;
  for (let col = 0; col < maxCols; col++) {
    if (excludeCols.includes(col)) continue;
    let codeCount = 0;
    for (let row = dataStartRow; row < checkRows; row++) {
      const val = String(rawData[row]?.[col] ?? '').trim();
      if (val && looksLikeAccountCode(val)) codeCount++;
    }
    if (codeCount > bestScore && codeCount >= 2) { bestScore = codeCount; bestCol = col; }
  }
  return bestCol;
}

function findDebitCreditInRow(rowStr: string[]): { debitIndices: number[]; creditIndices: number[]; movDebitIndices: number[]; movCreditIndices: number[] } {
  const debitIndices: number[] = [], creditIndices: number[] = [], movDebitIndices: number[] = [], movCreditIndices: number[] = [];
  for (let i = 0; i < rowStr.length; i++) {
    const cell = rowStr[i];
    if (!cell) continue;
    let isMovement = false;
    if (matchesArabicPattern(cell, TB_COLUMN_MAPPINGS.movementDebit)) { movDebitIndices.push(i); isMovement = true; }
    if (!isMovement && matchesArabicPattern(cell, TB_COLUMN_MAPPINGS.movementCredit)) { movCreditIndices.push(i); isMovement = true; }
    if (isMovement) continue;
    if (matchesArabicPattern(cell, TB_COLUMN_MAPPINGS.debit)) debitIndices.push(i);
    if (matchesArabicPattern(cell, TB_COLUMN_MAPPINGS.credit)) creditIndices.push(i);
  }
  return { debitIndices, creditIndices, movDebitIndices, movCreditIndices };
}

function resolveDebitCreditColumns(
  debitIndices: number[], creditIndices: number[], parentRow?: string[]
): { debitCol: number; creditCol: number } {
  let debitCol = debitIndices[debitIndices.length - 1];
  let creditCol = creditIndices[creditIndices.length - 1];
  
  if (parentRow) {
    let closingStartCol = -1;
    for (let i = 0; i < parentRow.length; i++) {
      const cell = parentRow[i];
      if (!cell) continue;
      const normalizedCell = normalizeArabic(cell);
      for (const kw of TB_PARENT_HEADERS.closing) {
        if (normalizedCell.includes(normalizeArabic(kw))) { closingStartCol = i; break; }
      }
      if (closingStartCol !== -1) break;
    }
    if (closingStartCol !== -1) {
      const subDebit = debitIndices.find(i => i >= closingStartCol);
      const subCredit = creditIndices.find(i => i >= closingStartCol);
      if (subDebit !== undefined) debitCol = subDebit;
      if (subCredit !== undefined) creditCol = subCredit;
    }
  }
  return { debitCol, creditCol };
}

export function detectColumnMapping(rawData: any[][]): ColumnMapping | null {
  const maxScanRows = Math.min(15, rawData.length);
  
  for (let rowIdx = 0; rowIdx < maxScanRows; rowIdx++) {
    const row = rawData[rowIdx];
    if (!row || row.length < 2) continue;
    const rowStr = row.map((c: any) => String(c ?? '').trim());
    if (!isLikelyHeaderRow(rowStr)) continue;
    
    const nameCol = findColumnIndex(rowStr, TB_COLUMN_MAPPINGS.name);
    if (nameCol === -1) continue;
    
    let codeCol = findColumnIndex(rowStr, TB_COLUMN_MAPPINGS.code);
    let { debitIndices, creditIndices, movDebitIndices, movCreditIndices } = findDebitCreditInRow(rowStr);
    
    let subHeaderRowIdx = rowIdx;
    if (debitIndices.length === 0 || creditIndices.length === 0) {
      const nextRowIdx = rowIdx + 1;
      if (nextRowIdx < rawData.length) {
        const nextRow = rawData[nextRowIdx];
        if (nextRow) {
          const nextRowStr = nextRow.map((c: any) => String(c ?? '').trim());
          const nextResult = findDebitCreditInRow(nextRowStr);
          if (nextResult.debitIndices.length > 0 && nextResult.creditIndices.length > 0) {
            debitIndices = nextResult.debitIndices;
            creditIndices = nextResult.creditIndices;
            if (nextResult.movDebitIndices.length > 0) movDebitIndices = nextResult.movDebitIndices;
            if (nextResult.movCreditIndices.length > 0) movCreditIndices = nextResult.movCreditIndices;
            subHeaderRowIdx = nextRowIdx;
          }
        }
      }
    }
    
    if (debitIndices.length === 0 || creditIndices.length === 0) continue;
    
    const parentRowData = subHeaderRowIdx > 0 
      ? rawData[subHeaderRowIdx - 1]?.map((c: any) => String(c ?? '').trim())
      : (rowIdx > 0 ? rawData[rowIdx - 1]?.map((c: any) => String(c ?? '').trim()) : undefined);
    
    const { debitCol, creditCol } = resolveDebitCreditColumns(debitIndices, creditIndices, parentRowData);
    
    let movementDebitCol = movDebitIndices.length > 0 ? movDebitIndices[0] : -1;
    let movementCreditCol = movCreditIndices.length > 0 ? movCreditIndices[0] : -1;
    
    if (movementDebitCol === -1 || movementCreditCol === -1) {
      const searchRow = subHeaderRowIdx !== rowIdx ? rawData[subHeaderRowIdx]?.map((c: any) => String(c ?? '').trim()) : rowStr;
      if (searchRow) {
        if (movementDebitCol === -1) movementDebitCol = findColumnIndex(searchRow, TB_COLUMN_MAPPINGS.movementDebit);
        if (movementCreditCol === -1) movementCreditCol = findColumnIndex(searchRow, TB_COLUMN_MAPPINGS.movementCredit);
      }
    }
    
    if (movementDebitCol === -1 && parentRowData) {
      for (let i = 0; i < parentRowData.length; i++) {
        const cell = parentRowData[i];
        if (!cell) continue;
        const normalizedCell = normalizeArabic(cell);
        for (const kw of TB_PARENT_HEADERS.movement) {
          if (normalizedCell.includes(normalizeArabic(kw))) {
            const movDebit = debitIndices.find(idx => idx >= i && idx < debitCol);
            const movCredit = creditIndices.find(idx => idx >= i && idx < creditCol);
            if (movDebit !== undefined) movementDebitCol = movDebit;
            if (movCredit !== undefined) movementCreditCol = movCredit;
            break;
          }
        }
      }
    }
    
    const maxReasonableCol = 20;
    if (nameCol > maxReasonableCol || debitCol > maxReasonableCol || creditCol > maxReasonableCol) continue;
    
    const dataStartRow = subHeaderRowIdx + 1;
    const resolvedCodeCol = codeCol !== -1 ? codeCol : 0;
    if (!validateCodeColumn(rawData, resolvedCodeCol, dataStartRow)) {
      const realCodeCol = findCodeColumnFromData(rawData, dataStartRow, [nameCol, debitCol, creditCol]);
      if (realCodeCol !== -1) codeCol = realCodeCol;
    } else {
      if (codeCol === -1) codeCol = 0;
    }
    
    return { codeCol: codeCol !== -1 ? codeCol : -1, nameCol, debitCol, creditCol, movementDebitCol, movementCreditCol, headerRowIndex: rowIdx, dataStartRow };
  }
  
  return autoDetectColumns(rawData);
}

function autoDetectColumns(rawData: any[][]): ColumnMapping | null {
  for (let startRow = 0; startRow < Math.min(15, rawData.length); startRow++) {
    const row = rawData[startRow];
    if (!row || row.length < 3) continue;
    
    let codeCol = -1, nameCol = -1;
    const numericCols: number[] = [];
    
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] ?? '').trim();
      if (!val) continue;
      if (codeCol === -1 && looksLikeAccountCode(val)) codeCol = c;
      else if (nameCol === -1 && looksLikeAccountName(val) && val.length > 3) nameCol = c;
      else if (looksLikeFinancialNumber(row[c]) && typeof row[c] === 'number') numericCols.push(c);
    }
    
    if (codeCol === -1 || nameCol === -1 || numericCols.length < 2) continue;
    
    let matchingRows = 0;
    for (let checkRow = startRow; checkRow < Math.min(startRow + 5, rawData.length); checkRow++) {
      const r = rawData[checkRow];
      if (!r) continue;
      if (looksLikeAccountCode(String(r[codeCol] ?? '').trim()) && looksLikeAccountName(String(r[nameCol] ?? '').trim())) matchingRows++;
    }
    
    if (matchingRows >= 2) {
      return {
        codeCol, nameCol,
        debitCol: numericCols[numericCols.length - 2] ?? numericCols[0],
        creditCol: numericCols[numericCols.length - 1] ?? numericCols[1],
        movementDebitCol: numericCols.length >= 4 ? numericCols[numericCols.length - 4] ?? -1 : -1,
        movementCreditCol: numericCols.length >= 4 ? numericCols[numericCols.length - 3] ?? -1 : -1,
        headerRowIndex: startRow > 0 ? startRow - 1 : startRow,
        dataStartRow: startRow,
      };
    }
  }
  return null;
}
