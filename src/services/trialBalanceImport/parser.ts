import { readExcelFile } from '@/lib/excelUtils';
import { TrialBalanceRow, ImportedTrialBalance, TrialBalanceValidation } from './types';
import { autoMapAccount } from './mappingRules';
import { detectColumnMapping, findValue, parseNumber, looksLikeAccountCode, looksLikeAccountName, TB_COLUMN_MAPPINGS } from './columnDetection';

export async function parseTrialBalanceFile(file: File): Promise<ImportedTrialBalance> {
  const rows: TrialBalanceRow[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (file.name.endsWith('.csv')) {
    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) throw new Error('الملف فارغ أو لا يحتوي على بيانات كافية');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const rowObj: any = {};
      headers.forEach((h, idx) => { rowObj[h] = values[idx] || ''; });
      
      const code = findValue(rowObj, TB_COLUMN_MAPPINGS.code);
      const name = findValue(rowObj, TB_COLUMN_MAPPINGS.name);
      if (!code || !name) continue;
      
      const debit = parseNumber(findValue(rowObj, TB_COLUMN_MAPPINGS.debit));
      const credit = parseNumber(findValue(rowObj, TB_COLUMN_MAPPINGS.credit));
      const movementDebit = parseNumber(findValue(rowObj, TB_COLUMN_MAPPINGS.movementDebit));
      const movementCredit = parseNumber(findValue(rowObj, TB_COLUMN_MAPPINGS.movementCredit));
      const mappedType = autoMapAccount(code, name);
      
      rows.push({ code, name, debit, credit, movementDebit, movementCredit, mappedType, isAutoMapped: mappedType !== 'unmapped', isValid: true });
    }
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = await readExcelFile(arrayBuffer);
    
    let targetSheet = workbook.Sheets[workbook.SheetNames[0]];
    for (const sheetName of workbook.SheetNames) {
      const nameLower = sheetName.toLowerCase();
      if (nameLower.includes('ميزان') || nameLower.includes('trial') || nameLower.includes('balance')) {
        targetSheet = workbook.Sheets[sheetName];
        break;
      }
    }
    
    const rawData = targetSheet.data;
    const colMapping = detectColumnMapping(rawData);
    
    if (colMapping) {
      const hasCodeCol = colMapping.codeCol !== -1;
      const skipKeywords = ['إجمالي', 'المجموع', 'الإجمالي', 'مجموع', 'total', 'Total', 'المجاميع'];
      
      for (let i = colMapping.dataStartRow; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length < 2) continue;
        
        let code = '';
        if (hasCodeCol) code = String(row[colMapping.codeCol] ?? '').trim();
        
        if (!code || !looksLikeAccountCode(code)) {
          const excludeCols = [colMapping.nameCol, colMapping.debitCol, colMapping.creditCol];
          for (let c = 0; c < row.length; c++) {
            if (excludeCols.includes(c)) continue;
            const val = String(row[c] ?? '').trim();
            if (val && looksLikeAccountCode(val)) { code = val; break; }
          }
        }
        
        const name = String(row[colMapping.nameCol] ?? '').trim();
        if (!code && !name) continue;
        if (skipKeywords.some(kw => name.includes(kw) || code.includes(kw))) continue;
        
        const hasValidCode = looksLikeAccountCode(code);
        const hasValidName = name.length >= 2;
        if (!hasValidCode && !hasValidName) continue;
        if (!hasValidCode && hasValidName) {
          if (parseNumber(row[colMapping.debitCol]) === 0 && parseNumber(row[colMapping.creditCol]) === 0) continue;
        }
        
        const debit = parseNumber(row[colMapping.debitCol]);
        const credit = parseNumber(row[colMapping.creditCol]);
        const movementDebit = colMapping.movementDebitCol !== -1 ? parseNumber(row[colMapping.movementDebitCol]) : 0;
        const movementCredit = colMapping.movementCreditCol !== -1 ? parseNumber(row[colMapping.movementCreditCol]) : 0;
        const mappedType = autoMapAccount(code || '0', name);
        
        rows.push({ code: code || `AUTO-${i}`, name, debit, credit, movementDebit, movementCredit, mappedType, isAutoMapped: mappedType !== 'unmapped', isValid: true });
      }
    } else {
      const data = targetSheet.jsonData;
      for (const row of data) {
        const code = findValue(row, TB_COLUMN_MAPPINGS.code);
        const name = findValue(row, TB_COLUMN_MAPPINGS.name);
        if (!name) continue;
        if (name.includes('إجمالي') || name.includes('المجموع')) continue;
        
        const debit = parseNumber(findValue(row, TB_COLUMN_MAPPINGS.debit));
        const credit = parseNumber(findValue(row, TB_COLUMN_MAPPINGS.credit));
        const movementDebit = parseNumber(findValue(row, TB_COLUMN_MAPPINGS.movementDebit));
        const movementCredit = parseNumber(findValue(row, TB_COLUMN_MAPPINGS.movementCredit));
        const mappedType = autoMapAccount(code || '0', name);
        
        rows.push({ code: code || 'N/A', name, debit, credit, movementDebit, movementCredit, mappedType, isAutoMapped: mappedType !== 'unmapped', isValid: true });
      }
    }
  }
  
  if (rows.length === 0) throw new Error('لم يتم العثور على بيانات في الملف. تأكد من أن الأعمدة تحتوي على: رمز الحساب، اسم الحساب، مدين، دائن');
  
  const unmappedRows = rows.filter(r => r.mappedType === 'unmapped');
  if (unmappedRows.length > 0) warnings.push(`${unmappedRows.length} حساب غير مصنف تلقائياً - يرجى تصنيفها يدوياً`);
  
  // Leaf account detection for balance check
  const allCodes = rows.map(r => r.code.replace(/^AUTO-\d+$/, ''));
  const leafRows = rows.filter(r => {
    const code = r.code;
    if (!code || /^AUTO-\d+$/.test(code)) return true;
    return !allCodes.some(otherCode => otherCode !== code && otherCode.length > code.length && otherCode.startsWith(code));
  });
  
  const totalDebit = leafRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = leafRows.reduce((sum, r) => sum + r.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;
  
  if (!isBalanced) errors.push(`ميزان المراجعة غير متوازن: الفرق = ${difference.toFixed(2)}`);
  
  const parentCount = rows.length - leafRows.length;
  if (parentCount > 0) warnings.push(`تم استبعاد ${parentCount} حساب رئيسي (عنوان) من حساب التوازن لتجنب الحساب المزدوج`);
  
  const validation: TrialBalanceValidation = { isBalanced, totalDebit, totalCredit, difference, missingAccounts: [], warnings, errors };
  return { rows, validation, fileName: file.name, importDate: new Date().toISOString() };
}
