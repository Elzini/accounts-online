// محلل ملفات Excel من مداد - Orchestrator
import { ExcelWorkbook, sheetToArray } from '@/lib/excelUtils';
import { ComprehensiveFinancialData, emptyFinancialData } from '../types';
import { parseTrialBalanceSheet } from './trialBalanceParser';
import { findSheet, extractCompanyInfo, parseBalanceSheet, parseIncomeStatement, parseEquityChanges, parseCashFlow } from './sheetParsers';
import { parseNoteSheetDispatched } from './noteParsers';

const MEDAD_SHEET_NAMES = {
  cover: ['الغلاف', 'الفهرس', 'cover', 'index'],
  balanceSheet: ['المركز المالي', 'الميزانية', 'balance sheet', 'قائمة المركز'],
  incomeStatement: ['الدخل', 'قائمة الدخل', 'income statement', 'الأرباح والخسائر'],
  equityChanges: ['التغيرات', 'حقوق الملكية', 'equity changes', 'قائمة التغير'],
  cashFlow: ['التدفق', 'التدفقات النقدية', 'cash flow'],
};

export function parseMedadExcel(workbook: ExcelWorkbook): ComprehensiveFinancialData {
  const result: ComprehensiveFinancialData = JSON.parse(JSON.stringify(emptyFinancialData));
  
  const isTrialBalanceFile = workbook.SheetNames.length === 1 || 
    workbook.SheetNames.some(name => name.toLowerCase().includes('report') || name.includes('ميزان'));
  
  if (isTrialBalanceFile) {
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const rows = sheetToArray(ws).filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));
    parseTrialBalanceSheet(rows, result);
    return result;
  }
  
  const coverSheet = findSheet(workbook, MEDAD_SHEET_NAMES.cover);
  if (coverSheet) extractCompanyInfo(coverSheet, result);
  
  const balanceSheet = findSheet(workbook, MEDAD_SHEET_NAMES.balanceSheet);
  if (balanceSheet) parseBalanceSheet(balanceSheet, result);
  
  const incomeSheet = findSheet(workbook, MEDAD_SHEET_NAMES.incomeStatement);
  if (incomeSheet) parseIncomeStatement(incomeSheet, result);
  
  const equitySheet = findSheet(workbook, MEDAD_SHEET_NAMES.equityChanges);
  if (equitySheet) parseEquityChanges(equitySheet, result);
  
  const cashFlowSheet = findSheet(workbook, MEDAD_SHEET_NAMES.cashFlow);
  if (cashFlowSheet) parseCashFlow(cashFlowSheet, result);
  
  workbook.SheetNames.forEach(sheetName => {
    const ws = workbook.Sheets[sheetName];
    const rows = sheetToArray(ws);
    parseNoteSheetDispatched(sheetName, rows, result);
  });
  
  return result;
}

export default parseMedadExcel;
