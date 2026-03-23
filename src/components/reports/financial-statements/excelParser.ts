/**
 * Financial Statements - Excel Parsing Engine
 * Parses Excel workbooks into structured FinancialData.
 */

import { ExcelWorkbook } from '@/lib/excelUtils';
import { FinancialData, emptyFinancialData } from './types';

// ===== Helper Functions =====
function extractAccountName(row: any[]): string {
  let bestName = '';
  for (const cell of row) {
    const str = String(cell || '').trim();
    if (str.length < 2) continue;
    if (/^[\d,.()-]+$/.test(str)) continue;
    if (['البيان', 'إيضاح', 'ملاحظات', 'note', 'notes'].some(h => str.toLowerCase().includes(h.toLowerCase()))) continue;
    if (str.length > bestName.length && /[\u0600-\u06FF]/.test(str)) {
      bestName = str;
    } else if (!bestName && str.length > 2) {
      bestName = str;
    }
  }
  return bestName;
}

function extractAmount(row: any[]): number {
  let amount = 0;
  for (let i = 0; i < row.length; i++) {
    const cell = row[i];
    let num = 0;
    if (typeof cell === 'number' && !isNaN(cell)) {
      num = cell;
    } else if (typeof cell === 'string') {
      const cleaned = cell.replace(/[,\s]/g, '').replace(/[()]/g, '-');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) num = parsed;
    }
    if (num !== 0) amount = num;
  }
  return amount;
}

function extractNumberFromCell(cell: any): number {
  if (typeof cell === 'number' && !isNaN(cell)) return cell;
  if (typeof cell === 'string') {
    const num = parseFloat(cell.replace(/[^\d.-]/g, ''));
    if (!isNaN(num)) return num;
  }
  return 0;
}

// ===== Section Parsers =====
function parseBalanceSheet(rows: any[][], result: FinancialData) {
  let currentSection = '';
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const rowText = row.map(cell => String(cell || '')).join(' ').trim();

    if (rowText.includes('الموجودات المتداولة') || rowText.includes('الأصول المتداولة') || rowText.includes('أصول متداولة')) { currentSection = 'currentAssets'; continue; }
    if (rowText.includes('الموجودات الغير متداولة') || rowText.includes('الأصول الثابتة') || rowText.includes('موجودات غير متداولة') || rowText.includes('أصول ثابتة')) { currentSection = 'fixedAssets'; continue; }
    if (rowText.includes('المطلوبات المتداولة') || rowText.includes('الخصوم المتداولة') || rowText.includes('خصوم متداولة') || rowText.includes('التزامات متداولة')) { currentSection = 'currentLiabilities'; continue; }
    if (rowText.includes('المطلوبات الغير متداولة') || rowText.includes('الخصوم طويلة الأجل') || rowText.includes('خصوم غير متداولة') || rowText.includes('التزامات طويلة')) { currentSection = 'longTermLiabilities'; continue; }
    if (rowText.includes('حقوق الملكية') || rowText.includes('حقوق المساهمين') || rowText.includes('رأس المال والاحتياطيات')) { currentSection = 'equity'; continue; }

    if (rowText.includes('إجمالي') || rowText.includes('اجمالي') || rowText.includes('مجموع')) {
      const amount = extractAmount(row);
      if (amount !== 0) {
        if (rowText.includes('الموجودات') || rowText.includes('الأصول')) result.balanceSheet.totalAssets = Math.abs(amount);
        else if (rowText.includes('المطلوبات') || rowText.includes('الخصوم') || rowText.includes('الالتزامات')) result.balanceSheet.totalLiabilities = Math.abs(amount);
        else if (rowText.includes('حقوق الملكية') || rowText.includes('حقوق المساهمين')) result.balanceSheet.totalEquity = Math.abs(amount);
      }
      continue;
    }

    const accountName = extractAccountName(row);
    const amount = extractAmount(row);
    if (!accountName || accountName.length < 2) continue;

    switch (currentSection) {
      case 'currentAssets': result.balanceSheet.currentAssets.push({ name: accountName, amount: Math.abs(amount) }); break;
      case 'fixedAssets': result.balanceSheet.fixedAssets.push({ name: accountName, amount: Math.abs(amount) }); break;
      case 'currentLiabilities': result.balanceSheet.currentLiabilities.push({ name: accountName, amount: Math.abs(amount) }); break;
      case 'longTermLiabilities': result.balanceSheet.longTermLiabilities.push({ name: accountName, amount: Math.abs(amount) }); break;
      case 'equity': result.balanceSheet.equity.push({ name: accountName, amount: Math.abs(amount) }); break;
    }
  }
}

function parseIncomeStatement(rows: any[][], result: FinancialData) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const rowText = row.map(cell => String(cell || '')).join(' ').trim();
    const amount = extractAmount(row);

    if ((rowText.includes('الإيرادات') || rowText.includes('المبيعات') || rowText.includes('إيرادات المبيعات')) && !rowText.includes('تكلفة') && !rowText.includes('إجمالي')) {
      result.incomeStatement.revenue = Math.abs(amount);
    } else if (rowText.includes('تكلفة الإيرادات') || rowText.includes('تكلفة المبيعات') || rowText.includes('كلفة المبيعات')) {
      result.incomeStatement.costOfRevenue = Math.abs(amount);
    } else if (rowText.includes('إجمالي الربح') || rowText.includes('مجمل الربح')) {
      result.incomeStatement.grossProfit = amount;
    } else if (rowText.includes('مصاريف') || rowText.includes('مصروفات')) {
      if (rowText.includes('إجمالي') || rowText.includes('مجموع')) {
        result.incomeStatement.totalOperatingExpenses = Math.abs(amount);
      } else {
        const name = extractAccountName(row);
        if (name) result.incomeStatement.operatingExpenses.push({ name, amount: Math.abs(amount) });
      }
    } else if (rowText.includes('ربح العمليات') || rowText.includes('الربح التشغيلي')) {
      result.incomeStatement.operatingProfit = amount;
    } else if (rowText.includes('الربح قبل الزكاة') || rowText.includes('صافي الربح قبل')) {
      result.incomeStatement.profitBeforeZakat = amount;
    } else if ((rowText.includes('مخصص الزكاة') || rowText.includes('زكاة')) && !rowText.includes('قبل') && !rowText.includes('بعد')) {
      result.incomeStatement.zakat = Math.abs(amount);
    } else if (rowText.includes('صافي الربح') || rowText.includes('صافي الدخل')) {
      result.incomeStatement.netProfit = amount;
    }
  }

  if (result.incomeStatement.grossProfit === 0) result.incomeStatement.grossProfit = result.incomeStatement.revenue - result.incomeStatement.costOfRevenue;
  if (result.incomeStatement.totalOperatingExpenses === 0) result.incomeStatement.totalOperatingExpenses = result.incomeStatement.operatingExpenses.reduce((sum, e) => sum + e.amount, 0);
  if (result.incomeStatement.operatingProfit === 0) result.incomeStatement.operatingProfit = result.incomeStatement.grossProfit - result.incomeStatement.totalOperatingExpenses;
  if (result.incomeStatement.profitBeforeZakat === 0) result.incomeStatement.profitBeforeZakat = result.incomeStatement.operatingProfit;
  if (result.incomeStatement.netProfit === 0) result.incomeStatement.netProfit = result.incomeStatement.profitBeforeZakat - result.incomeStatement.zakat;
}

function parseCashFlowStatement(rows: any[][], result: FinancialData) {
  let currentSection = '';
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const rowText = row.map(cell => String(cell || '')).join(' ').trim();
    const amount = extractAmount(row);

    if (rowText.includes('التشغيلية') || rowText.includes('الأنشطة التشغيلية')) { currentSection = 'operating'; continue; }
    if (rowText.includes('الاستثمارية') || rowText.includes('الأنشطة الاستثمارية')) { currentSection = 'investing'; continue; }
    if (rowText.includes('التمويلية') || rowText.includes('الأنشطة التمويلية')) { currentSection = 'financing'; continue; }

    if (rowText.includes('صافي') && rowText.includes('النقدية')) {
      if (currentSection === 'operating') result.cashFlow.totalOperating = amount;
      else if (currentSection === 'investing') result.cashFlow.totalInvesting = amount;
      else if (currentSection === 'financing') result.cashFlow.totalFinancing = amount;
      continue;
    }
    if (rowText.includes('رصيد النقدية') && rowText.includes('بداية')) { result.cashFlow.openingCash = Math.abs(amount); continue; }
    if (rowText.includes('رصيد النقدية') && rowText.includes('نهاية')) { result.cashFlow.closingCash = Math.abs(amount); continue; }

    const name = extractAccountName(row);
    if (!name) continue;
    switch (currentSection) {
      case 'operating': result.cashFlow.operating.push({ name, amount }); break;
      case 'investing': result.cashFlow.investing.push({ name, amount }); break;
      case 'financing': result.cashFlow.financing.push({ name, amount }); break;
    }
  }
  if (result.cashFlow.netChange === 0) result.cashFlow.netChange = result.cashFlow.totalOperating + result.cashFlow.totalInvesting + result.cashFlow.totalFinancing;
}

function parseEquityChanges(rows: any[][], result: FinancialData) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const rowText = row.map(cell => String(cell || '')).join(' ').trim();
    if (rowText.includes('رصيد') && rowText.includes('بداية')) {
      result.equityChanges.openingBalance = { capital: extractNumberFromCell(row[1]), reserves: extractNumberFromCell(row[2]), retainedEarnings: extractNumberFromCell(row[3]), total: extractNumberFromCell(row[4]) || extractAmount(row) };
    } else if (rowText.includes('رصيد') && rowText.includes('نهاية')) {
      result.equityChanges.closingBalance = { capital: extractNumberFromCell(row[1]), reserves: extractNumberFromCell(row[2]), retainedEarnings: extractNumberFromCell(row[3]), total: extractNumberFromCell(row[4]) || extractAmount(row) };
    }
  }
}

function parseZakatCalculation(rows: any[][], result: FinancialData) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const rowText = row.map(cell => String(cell || '')).join(' ').trim();
    const amount = extractAmount(row);

    if (rowText.includes('الربح قبل الزكاة') || rowText.includes('صافي الربح قبل')) result.zakatCalculation.profitBeforeZakat = amount;
    else if (rowText.includes('رأس المال') && !rowText.includes('إجمالي')) result.zakatCalculation.capital = Math.abs(amount);
    else if (rowText.includes('احتياطي نظامي') || rowText.includes('الاحتياطي النظامي')) result.zakatCalculation.statutoryReserve = Math.abs(amount);
    else if (rowText.includes('جاري الشركاء') || rowText.includes('حساب جاري')) result.zakatCalculation.partnersCurrentAccount = Math.abs(amount);
    else if (rowText.includes('منافع الموظفين') || rowText.includes('نهاية الخدمة')) result.zakatCalculation.employeeBenefitsLiabilities = Math.abs(amount);
    else if (rowText.includes('أصول ثابتة') || rowText.includes('الموجودات الثابتة')) result.zakatCalculation.fixedAssets = Math.abs(amount);
    else if (rowText.includes('أصول غير ملموسة') || rowText.includes('موجودات غير ملموسة')) result.zakatCalculation.intangibleAssets = Math.abs(amount);
    else if (rowText.includes('الوعاء الزكوي') && !rowText.includes('إجمالي')) result.zakatCalculation.zakatBase = Math.abs(amount);
    else if (rowText.includes('إجمالي الزكاة') || rowText.includes('مخصص الزكاة')) result.zakatCalculation.totalZakat = Math.abs(amount);
  }

  if (result.zakatCalculation.zakatBaseTotal === 0) result.zakatCalculation.zakatBaseTotal = result.zakatCalculation.capital + result.zakatCalculation.statutoryReserve + result.zakatCalculation.employeeBenefitsLiabilities;
  if (result.zakatCalculation.totalDeductions === 0) result.zakatCalculation.totalDeductions = result.zakatCalculation.fixedAssets + result.zakatCalculation.intangibleAssets;
  if (result.zakatCalculation.zakatBase === 0) result.zakatCalculation.zakatBase = Math.max(0, result.zakatCalculation.zakatBaseTotal - result.zakatCalculation.totalDeductions);
  if (result.zakatCalculation.zakatOnBase === 0) result.zakatCalculation.zakatOnBase = result.zakatCalculation.zakatBase * 0.025;
}

function parseSheetData(rows: any[][], result: FinancialData) {
  let currentSection = '';
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const rowText = row.map(cell => String(cell || '')).join(' ').trim();

    if (i < 5 && !result.companyName && rowText.length > 5 && !rowText.includes('قائمة')) {
      const firstCell = String(row[0] || '').trim();
      if (firstCell.length > 5) result.companyName = firstCell;
    }

    // Section detection
    if (rowText.includes('الموجودات المتداولة') || rowText.includes('الأصول المتداولة')) { currentSection = 'currentAssets'; continue; }
    if (rowText.includes('الموجودات الغير متداولة') || rowText.includes('الأصول الثابتة')) { currentSection = 'fixedAssets'; continue; }
    if (rowText.includes('المطلوبات المتداولة') || rowText.includes('الخصوم المتداولة')) { currentSection = 'currentLiabilities'; continue; }
    if (rowText.includes('المطلوبات الغير متداولة') || rowText.includes('الخصوم طويلة الأجل')) { currentSection = 'longTermLiabilities'; continue; }
    if (rowText.includes('حقوق الملكية')) { currentSection = 'equity'; continue; }
    if (rowText.includes('الإيرادات') || rowText.includes('المبيعات')) { currentSection = 'revenue'; continue; }
    if (rowText.includes('تكلفة الإيرادات') || rowText.includes('تكلفة المبيعات')) { currentSection = 'costOfRevenue'; continue; }
    if (rowText.includes('مصاريف عمومية') || rowText.includes('مصروفات تشغيلية')) { currentSection = 'operatingExpenses'; continue; }
    if (rowText.includes('التدفقات النقدية') && rowText.includes('التشغيلية')) { currentSection = 'operatingCash'; continue; }
    if (rowText.includes('التدفقات النقدية') && rowText.includes('الاستثمارية')) { currentSection = 'investingCash'; continue; }
    if (rowText.includes('التدفقات النقدية') && rowText.includes('التمويلية')) { currentSection = 'financingCash'; continue; }

    if (rowText.includes('إجمالي') || rowText.includes('اجمالي') || rowText.includes('مجموع') || rowText.includes('البيان') || rowText.includes('إيضاح')) {
      const amount = extractAmount(row);
      if (amount !== 0) {
        if (rowText.includes('مجموع الموجودات')) result.balanceSheet.totalAssets = Math.abs(amount);
        else if (rowText.includes('مجموع المطلوبات')) result.balanceSheet.totalLiabilities = Math.abs(amount);
        else if (rowText.includes('مجموع حقوق الملكية')) result.balanceSheet.totalEquity = Math.abs(amount);
        else if (rowText.includes('إجمالي الربح') || rowText.includes('إجمالي الخسارة')) result.incomeStatement.grossProfit = amount;
        else if (rowText.includes('ربح العمليات') || rowText.includes('خسارة العمليات')) result.incomeStatement.operatingProfit = amount;
      }
      continue;
    }

    const accountName = extractAccountName(row);
    const amount = extractAmount(row);
    if (!accountName || amount === 0) continue;

    switch (currentSection) {
      case 'currentAssets': result.balanceSheet.currentAssets.push({ name: accountName, amount: Math.abs(amount) }); break;
      case 'fixedAssets': result.balanceSheet.fixedAssets.push({ name: accountName, amount: Math.abs(amount) }); break;
      case 'currentLiabilities': result.balanceSheet.currentLiabilities.push({ name: accountName, amount: Math.abs(amount) }); break;
      case 'longTermLiabilities': result.balanceSheet.longTermLiabilities.push({ name: accountName, amount: Math.abs(amount) }); break;
      case 'equity': result.balanceSheet.equity.push({ name: accountName, amount: Math.abs(amount) }); break;
      case 'revenue': result.incomeStatement.revenue += Math.abs(amount); break;
      case 'costOfRevenue': result.incomeStatement.costOfRevenue += Math.abs(amount); break;
      case 'operatingExpenses': result.incomeStatement.operatingExpenses.push({ name: accountName, amount: Math.abs(amount) }); break;
      case 'operatingCash': result.cashFlow.operating.push({ name: accountName, amount }); break;
      case 'investingCash': result.cashFlow.investing.push({ name: accountName, amount }); break;
      case 'financingCash': result.cashFlow.financing.push({ name: accountName, amount }); break;
    }
  }

  // Calculate derived values
  result.incomeStatement.grossProfit = result.incomeStatement.revenue - result.incomeStatement.costOfRevenue;
  result.incomeStatement.totalOperatingExpenses = result.incomeStatement.operatingExpenses.reduce((sum, e) => sum + e.amount, 0);
  result.incomeStatement.operatingProfit = result.incomeStatement.grossProfit - result.incomeStatement.totalOperatingExpenses;
  result.incomeStatement.profitBeforeZakat = result.incomeStatement.operatingProfit + result.incomeStatement.otherIncome - result.incomeStatement.otherExpenses;

  // Zakat calculation from equity data
  const capital = result.balanceSheet.equity.find(e => e.name.includes('رأس المال'))?.amount || 0;
  const statutoryReserve = result.balanceSheet.equity.find(e => e.name.includes('احتياطي'))?.amount || 0;
  const partnersCurrentAccount = result.balanceSheet.currentLiabilities.find(l => l.name.includes('جهات ذات علاقة') || l.name.includes('جاري الشركاء'))?.amount || 0;
  const employeeBenefitsLiabilities = result.balanceSheet.longTermLiabilities.find(l => l.name.includes('منافع موظفين') || l.name.includes('نهاية خدمة'))?.amount || 0;
  const fixedAssetsTotal = result.balanceSheet.fixedAssets.reduce((sum, a) => sum + a.amount, 0);
  const intangibleAssets = result.balanceSheet.fixedAssets.find(a => a.name.includes('غير ملموسة') || a.name.includes('برامج'))?.amount || 0;

  const profitBeforeZakat = result.incomeStatement.profitBeforeZakat;
  const adjustedNetProfit = profitBeforeZakat;
  const zakatOnAdjustedProfit = adjustedNetProfit * 0.025;
  const zakatBaseTotal = capital + statutoryReserve + employeeBenefitsLiabilities;
  const totalDeductions = fixedAssetsTotal + intangibleAssets;
  const zakatBase = Math.max(0, zakatBaseTotal - totalDeductions);
  const zakatOnBase = zakatBase * 0.025;
  const totalZakat = Math.max(zakatOnAdjustedProfit, zakatOnBase);

  result.incomeStatement.zakat = totalZakat;
  result.incomeStatement.netProfit = result.incomeStatement.profitBeforeZakat - result.incomeStatement.zakat;

  result.zakatCalculation = {
    profitBeforeZakat, adjustmentsOnNetIncome: 0, adjustedNetProfit, zakatOnAdjustedProfit,
    capital, partnersCurrentAccount, statutoryReserve, employeeBenefitsLiabilities,
    zakatBaseTotal, fixedAssets: fixedAssetsTotal, intangibleAssets, otherDeductions: 0,
    totalDeductions, zakatBase, zakatOnBase, totalZakat,
    openingBalance: 0, provisionAdded: totalZakat, paidDuringYear: 0, closingBalance: totalZakat,
  };

  result.cashFlow.totalOperating = result.cashFlow.operating.reduce((sum, item) => sum + item.amount, 0);
  result.cashFlow.totalInvesting = result.cashFlow.investing.reduce((sum, item) => sum + item.amount, 0);
  result.cashFlow.totalFinancing = result.cashFlow.financing.reduce((sum, item) => sum + item.amount, 0);
  result.cashFlow.netChange = result.cashFlow.totalOperating + result.cashFlow.totalInvesting + result.cashFlow.totalFinancing;
  result.cashFlow.closingCash = result.cashFlow.openingCash + result.cashFlow.netChange;
}

// ===== Sheet Router =====
function parseSheetByName(sheetName: string, rows: any[][], result: FinancialData) {
  const lowerName = sheetName.toLowerCase();
  const arabicName = sheetName;

  if (arabicName.includes('المركز المالي') || arabicName.includes('الميزانية') || lowerName.includes('balance') || arabicName.includes('قائمة المركز')) {
    parseBalanceSheet(rows, result);
  } else if (arabicName.includes('الدخل') || arabicName.includes('الأرباح والخسائر') || lowerName.includes('income') || arabicName.includes('قائمة الدخل')) {
    parseIncomeStatement(rows, result);
  } else if (arabicName.includes('التدفقات النقدية') || lowerName.includes('cash flow')) {
    parseCashFlowStatement(rows, result);
  } else if (arabicName.includes('حقوق الملكية') || arabicName.includes('التغيرات') || lowerName.includes('equity')) {
    parseEquityChanges(rows, result);
  } else if (arabicName.includes('الزكاة') || arabicName.includes('زكاة') || lowerName.includes('zakat')) {
    parseZakatCalculation(rows, result);
  } else {
    parseSheetData(rows, result);
  }
}

/**
 * Parse an Excel workbook into structured FinancialData.
 */
export function parseFinancialStatements(workbook: ExcelWorkbook): FinancialData {
  const result: FinancialData = JSON.parse(JSON.stringify(emptyFinancialData));

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = worksheet.data;
    parseSheetByName(sheetName, jsonData, result);
  });

  // Calculate totals if not already set
  if (result.balanceSheet.totalAssets === 0) {
    result.balanceSheet.totalAssets = result.balanceSheet.currentAssets.reduce((sum, item) => sum + (item.amount || 0), 0) + result.balanceSheet.fixedAssets.reduce((sum, item) => sum + (item.amount || 0), 0);
  }
  if (result.balanceSheet.totalLiabilities === 0) {
    result.balanceSheet.totalLiabilities = result.balanceSheet.currentLiabilities.reduce((sum, item) => sum + (item.amount || 0), 0) + result.balanceSheet.longTermLiabilities.reduce((sum, item) => sum + (item.amount || 0), 0);
  }
  if (result.balanceSheet.totalEquity === 0) {
    result.balanceSheet.totalEquity = result.balanceSheet.equity.reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  return result;
}
