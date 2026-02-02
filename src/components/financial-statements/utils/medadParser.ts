// محلل ملفات Excel من مداد

import * as XLSX from 'xlsx';
import { 
  ComprehensiveFinancialData, 
  emptyFinancialData,
  BalanceSheetData,
  IncomeStatementData,
  CashFlowData,
  EquityChangesData,
  ZakatNote,
  FixedAssetsNote,
  CostOfRevenueNote,
  GeneralAndAdminExpensesNote,
  CashAndBankNote,
  OtherCurrentAssetsNote,
  AccruedExpensesNote,
  RelatedPartyBalancesNote,
  OtherCurrentLiabilitiesNote,
  EmployeeBenefitsNote,
  CapitalNote,
} from '../types';
import { parseArabicNumber, extractAmountFromRow, extractAccountNameFromRow } from './numberFormatting';

// أسماء الأوراق في مداد
const MEDAD_SHEET_NAMES = {
  cover: ['الغلاف', 'الفهرس', 'cover', 'index'],
  balanceSheet: ['المركز المالي', 'الميزانية', 'balance sheet', 'قائمة المركز'],
  incomeStatement: ['الدخل', 'قائمة الدخل', 'income statement', 'الأرباح والخسائر'],
  equityChanges: ['التغيرات', 'حقوق الملكية', 'equity changes', 'قائمة التغير'],
  cashFlow: ['التدفق', 'التدفقات النقدية', 'cash flow'],
  policies: ['السياسات', 'policies'],
  notes: ['النقد وأرصدة', 'ممتلكات ومعدات', 'الدائنون', 'مخصص الزكاة', 'المخصصات ورأس المال', 'تكلفة الإيرادات', 'مصاريف ادارية'],
};

export function parseMedadExcel(workbook: XLSX.WorkBook): ComprehensiveFinancialData {
  const result: ComprehensiveFinancialData = JSON.parse(JSON.stringify(emptyFinancialData));
  
  console.log('📊 Parsing Medad Excel - Sheets:', workbook.SheetNames);
  
  // استخراج اسم الشركة من الغلاف
  const coverSheet = findSheet(workbook, MEDAD_SHEET_NAMES.cover);
  if (coverSheet) {
    extractCompanyInfo(coverSheet, result);
  }
  
  // تحليل قائمة المركز المالي
  const balanceSheet = findSheet(workbook, MEDAD_SHEET_NAMES.balanceSheet);
  if (balanceSheet) {
    parseBalanceSheet(balanceSheet, result);
  }
  
  // تحليل قائمة الدخل
  const incomeSheet = findSheet(workbook, MEDAD_SHEET_NAMES.incomeStatement);
  if (incomeSheet) {
    parseIncomeStatement(incomeSheet, result);
  }
  
  // تحليل قائمة التغيرات في حقوق الملكية
  const equitySheet = findSheet(workbook, MEDAD_SHEET_NAMES.equityChanges);
  if (equitySheet) {
    parseEquityChanges(equitySheet, result);
  }
  
  // تحليل قائمة التدفق النقدي
  const cashFlowSheet = findSheet(workbook, MEDAD_SHEET_NAMES.cashFlow);
  if (cashFlowSheet) {
    parseCashFlow(cashFlowSheet, result);
  }
  
  // تحليل الإيضاحات
  workbook.SheetNames.forEach(sheetName => {
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    parseNoteSheet(sheetName, rows, result);
  });
  
  return result;
}

function findSheet(workbook: XLSX.WorkBook, keywords: string[]): any[][] | null {
  for (const name of workbook.SheetNames) {
    const lowerName = name.toLowerCase();
    if (keywords.some(kw => name.includes(kw) || lowerName.includes(kw.toLowerCase()))) {
      const ws = workbook.Sheets[name];
      return XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    }
  }
  return null;
}

function extractCompanyInfo(rows: any[][], result: ComprehensiveFinancialData) {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row) continue;
    
    const rowText = row.join(' ').trim();
    
    // استخراج اسم الشركة
    if (!result.companyName && rowText.length > 5) {
      const firstCell = String(row[0] || row[1] || '').trim();
      if (firstCell.length > 5 && !firstCell.includes('قائمة') && !firstCell.includes('القوائم')) {
        result.companyName = firstCell;
      }
    }
    
    // استخراج نوع الشركة
    if (rowText.includes('ذات مسئولية محدودة')) {
      result.companyType = 'شركة ذات مسئولية محدودة';
    }
    
    // استخراج التاريخ
    const dateMatch = rowText.match(/(\d{1,2})\s*(ديسمبر|يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر)\s*(\d{4})/);
    if (dateMatch) {
      result.reportDate = `${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3]}م`;
    }
  }
}

function parseBalanceSheet(rows: any[][], result: ComprehensiveFinancialData) {
  let currentSection = '';
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const rowText = row.map(c => String(c || '')).join(' ').trim();
    
    // تحديد القسم
    if (rowText.includes('الموجودات المتداولة')) {
      currentSection = 'currentAssets';
      continue;
    }
    if (rowText.includes('الموجودات الغير متداولة') || rowText.includes('موجودات غير متداولة')) {
      currentSection = 'nonCurrentAssets';
      continue;
    }
    if (rowText.includes('المطلوبات المتداولة')) {
      currentSection = 'currentLiabilities';
      continue;
    }
    if (rowText.includes('المطلوبات الغير متداولة') || rowText.includes('مطلوبات غير متداولة')) {
      currentSection = 'nonCurrentLiabilities';
      continue;
    }
    if (rowText.includes('حقوق الملكية')) {
      currentSection = 'equity';
      continue;
    }
    
    // استخراج الإجماليات
    if (rowText.includes('إجمالي') || rowText.includes('مجموع')) {
      const amount = extractAmountFromRow(row);
      const prevAmount = row.length > 3 ? parseArabicNumber(row[row.length - 2]) : undefined;
      
      if (rowText.includes('الموجودات المتداولة')) {
        result.balanceSheet.totalCurrentAssets = Math.abs(amount);
        if (prevAmount) result.balanceSheet.previousTotalCurrentAssets = Math.abs(prevAmount);
      } else if (rowText.includes('الموجودات الغير متداولة') || rowText.includes('موجودات غير متداولة')) {
        result.balanceSheet.totalNonCurrentAssets = Math.abs(amount);
        if (prevAmount) result.balanceSheet.previousTotalNonCurrentAssets = Math.abs(prevAmount);
      } else if (rowText.includes('مجموع الموجودات')) {
        result.balanceSheet.totalAssets = Math.abs(amount);
        if (prevAmount) result.balanceSheet.previousTotalAssets = Math.abs(prevAmount);
      } else if (rowText.includes('المطلوبات المتداولة')) {
        result.balanceSheet.totalCurrentLiabilities = Math.abs(amount);
        if (prevAmount) result.balanceSheet.previousTotalCurrentLiabilities = Math.abs(prevAmount);
      } else if (rowText.includes('المطلوبات الغير متداولة') || rowText.includes('مطلوبات غير متداولة')) {
        result.balanceSheet.totalNonCurrentLiabilities = Math.abs(amount);
        if (prevAmount) result.balanceSheet.previousTotalNonCurrentLiabilities = Math.abs(prevAmount);
      } else if (rowText.includes('مجموع المطلوبات') && !rowText.includes('حقوق')) {
        result.balanceSheet.totalLiabilities = Math.abs(amount);
        if (prevAmount) result.balanceSheet.previousTotalLiabilities = Math.abs(prevAmount);
      } else if (rowText.includes('مجموع حقوق الملكية')) {
        result.balanceSheet.totalEquity = Math.abs(amount);
        if (prevAmount) result.balanceSheet.previousTotalEquity = Math.abs(prevAmount);
      } else if (rowText.includes('المطلوبات وحقوق الملكية')) {
        result.balanceSheet.totalLiabilitiesAndEquity = Math.abs(amount);
        if (prevAmount) result.balanceSheet.previousTotalLiabilitiesAndEquity = Math.abs(prevAmount);
      }
      continue;
    }
    
    // استخراج البنود
    const name = extractAccountNameFromRow(row);
    const amount = extractAmountFromRow(row);
    const prevAmount = row.length > 3 ? parseArabicNumber(row[row.length - 2]) : undefined;
    const noteMatch = rowText.match(/(\d+)/);
    const note = noteMatch ? noteMatch[1] : undefined;
    
    if (!name || name.length < 3) continue;
    if (rowText.includes('البيان') || rowText.includes('إيضاح')) continue;
    
    const item = { name, amount: Math.abs(amount), previousAmount: prevAmount ? Math.abs(prevAmount) : undefined, note };
    
    switch (currentSection) {
      case 'currentAssets':
        result.balanceSheet.currentAssets.push(item);
        break;
      case 'nonCurrentAssets':
        result.balanceSheet.nonCurrentAssets.push(item);
        break;
      case 'currentLiabilities':
        result.balanceSheet.currentLiabilities.push(item);
        break;
      case 'nonCurrentLiabilities':
        result.balanceSheet.nonCurrentLiabilities.push(item);
        break;
      case 'equity':
        result.balanceSheet.equity.push(item);
        break;
    }
  }
}

function parseIncomeStatement(rows: any[][], result: ComprehensiveFinancialData) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const rowText = row.map(c => String(c || '')).join(' ').trim();
    const amount = extractAmountFromRow(row);
    const prevAmount = row.length > 3 ? parseArabicNumber(row[row.length - 2]) : undefined;
    
    if (rowText.includes('الإيرادات') && !rowText.includes('تكلفة')) {
      result.incomeStatement.revenue = Math.abs(amount);
      result.incomeStatement.previousRevenue = prevAmount ? Math.abs(prevAmount) : undefined;
    } else if (rowText.includes('تكلفة الإيرادات')) {
      result.incomeStatement.costOfRevenue = Math.abs(amount);
      result.incomeStatement.previousCostOfRevenue = prevAmount ? Math.abs(prevAmount) : undefined;
    } else if (rowText.includes('إجمالي الربح') || rowText.includes('إجمالي الخسارة')) {
      result.incomeStatement.grossProfit = amount;
      result.incomeStatement.previousGrossProfit = prevAmount;
    } else if (rowText.includes('مصاريف عمومية وإدارية')) {
      result.incomeStatement.generalAndAdminExpenses = Math.abs(amount);
      result.incomeStatement.previousGeneralAndAdminExpenses = prevAmount ? Math.abs(prevAmount) : undefined;
    } else if (rowText.includes('ربح العمليات') || rowText.includes('خسارة العمليات')) {
      result.incomeStatement.operatingProfit = amount;
      result.incomeStatement.previousOperatingProfit = prevAmount;
    } else if (rowText.includes('أعباء تمويل') || rowText.includes('تكلفة التمويل')) {
      result.incomeStatement.financingCost = Math.abs(amount);
      result.incomeStatement.previousFinancingCost = prevAmount ? Math.abs(prevAmount) : undefined;
    } else if (rowText.includes('أرباح') && rowText.includes('استبعاد')) {
      result.incomeStatement.gainsLossesFromDisposals = amount;
      result.incomeStatement.previousGainsLossesFromDisposals = prevAmount;
    } else if (rowText.includes('الربح') && rowText.includes('قبل الزكاة')) {
      result.incomeStatement.profitBeforeZakat = amount;
      result.incomeStatement.previousProfitBeforeZakat = prevAmount;
    } else if (rowText.includes('الزكاة') && !rowText.includes('قبل') && !rowText.includes('بعد')) {
      result.incomeStatement.zakat = Math.abs(amount);
      result.incomeStatement.previousZakat = prevAmount ? Math.abs(prevAmount) : undefined;
    } else if (rowText.includes('ربح') && rowText.includes('الفترة') || rowText.includes('صافي الربح')) {
      result.incomeStatement.netProfit = amount;
      result.incomeStatement.previousNetProfit = prevAmount;
    } else if (rowText.includes('إجمالي الدخل الشامل')) {
      result.incomeStatement.totalComprehensiveIncome = amount;
      result.incomeStatement.previousTotalComprehensiveIncome = prevAmount;
    }
  }
  
  // حساب القيم المشتقة
  if (result.incomeStatement.grossProfit === 0) {
    result.incomeStatement.grossProfit = result.incomeStatement.revenue - result.incomeStatement.costOfRevenue;
  }
}

function parseEquityChanges(rows: any[][], result: ComprehensiveFinancialData) {
  let currentPeriodLabel = '';
  const periods: typeof result.equityChanges.periods = [];
  let currentPeriodRows: { description: string; capital: number; statutoryReserve: number; retainedEarnings: number; total: number }[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const rowText = row.map(c => String(c || '')).join(' ').trim();
    
    // تحديد الفترة
    if (rowText.includes('السنة المنتهية في')) {
      if (currentPeriodLabel && currentPeriodRows.length > 0) {
        periods.push({ label: currentPeriodLabel, rows: [...currentPeriodRows] });
        currentPeriodRows = [];
      }
      const dateMatch = rowText.match(/(\d{1,2}\s*\w+\s*\d{4})/);
      currentPeriodLabel = dateMatch ? `السنة المنتهية في ${dateMatch[1]}` : rowText;
      continue;
    }
    
    // تخطي الرؤوس
    if (rowText.includes('رأس المال') && rowText.includes('احتياطي')) continue;
    
    const description = extractAccountNameFromRow(row);
    if (!description || description.length < 3) continue;
    
    // استخراج القيم
    const values = row.filter(c => typeof c === 'number' || (typeof c === 'string' && !isNaN(parseFloat(c.replace(/[^\d.-]/g, ''))))).map(c => parseArabicNumber(c));
    
    if (values.length >= 4) {
      currentPeriodRows.push({
        description,
        capital: values[0] || 0,
        statutoryReserve: values[1] || 0,
        retainedEarnings: values[2] || 0,
        total: values[3] || 0,
      });
    }
  }
  
  // إضافة الفترة الأخيرة
  if (currentPeriodLabel && currentPeriodRows.length > 0) {
    periods.push({ label: currentPeriodLabel, rows: currentPeriodRows });
  }
  
  result.equityChanges.periods = periods;
}

function parseCashFlow(rows: any[][], result: ComprehensiveFinancialData) {
  let currentSection = '';
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const rowText = row.map(c => String(c || '')).join(' ').trim();
    const amount = extractAmountFromRow(row);
    
    // تحديد القسم
    if (rowText.includes('الأنشطة التشغيلية')) {
      currentSection = 'operating';
      continue;
    }
    if (rowText.includes('الأنشطة الاستثمارية')) {
      currentSection = 'investing';
      continue;
    }
    if (rowText.includes('الأنشطة التمويلية')) {
      currentSection = 'financing';
      continue;
    }
    
    // استخراج البنود
    if (rowText.includes('ربح') && rowText.includes('قبل الزكاة')) {
      result.cashFlow.operatingActivities.profitBeforeZakat = amount;
    } else if (rowText.includes('زكاة مدفوعة')) {
      result.cashFlow.operatingActivities.zakatPaid = Math.abs(amount);
    } else if (rowText.includes('منافع موظفين مدفوعة')) {
      result.cashFlow.operatingActivities.employeeBenefitsPaid = Math.abs(amount);
    } else if (rowText.includes('صافي التدفقات') && rowText.includes('التشغيلية')) {
      result.cashFlow.operatingActivities.netOperatingCashFlow = amount;
    } else if (rowText.includes('صافي التدفقات') && rowText.includes('الاستثمارية')) {
      result.cashFlow.netInvestingCashFlow = amount;
    } else if (rowText.includes('صافي التدفقات') && rowText.includes('التمويلية')) {
      result.cashFlow.netFinancingCashFlow = amount;
    } else if (rowText.includes('صافي الزيادة') || rowText.includes('صافي النقص')) {
      result.cashFlow.netChangeInCash = amount;
    } else if (rowText.includes('النقد') && rowText.includes('بداية')) {
      result.cashFlow.openingCashBalance = Math.abs(amount);
    } else if (rowText.includes('النقد') && rowText.includes('نهاية')) {
      result.cashFlow.closingCashBalance = Math.abs(amount);
    } else {
      const name = extractAccountNameFromRow(row);
      if (name && name.length > 3) {
        if (currentSection === 'operating') {
          if (rowText.includes('التعديلات') || rowText.includes('الاستهلاك') || rowText.includes('مخصصات')) {
            result.cashFlow.operatingActivities.adjustmentsToReconcile.push({ name, amount });
          } else if (rowText.includes('النقص') || rowText.includes('الزيادة') || rowText.includes('موجودات') || rowText.includes('مطلوبات')) {
            result.cashFlow.operatingActivities.changesInWorkingCapital.push({ name, amount });
          }
        } else if (currentSection === 'investing') {
          result.cashFlow.investingActivities.push({ name, amount });
        } else if (currentSection === 'financing') {
          result.cashFlow.financingActivities.push({ name, amount });
        }
      }
    }
  }
}

function parseNoteSheet(sheetName: string, rows: any[][], result: ComprehensiveFinancialData) {
  const lowerName = sheetName.toLowerCase();
  
  // إيضاح الزكاة
  if (sheetName.includes('الزكاة') || sheetName.includes('مخصص الزكاة')) {
    parseZakatNote(rows, result);
  }
  
  // إيضاح تكلفة الإيرادات
  if (sheetName.includes('تكلفة الإيرادات')) {
    parseCostOfRevenueNote(rows, result);
  }
  
  // إيضاح المصاريف الإدارية
  if (sheetName.includes('مصاريف') && (sheetName.includes('إدارية') || sheetName.includes('ادارية'))) {
    parseGeneralExpensesNote(rows, result);
  }
  
  // إيضاح الممتلكات والمعدات
  if (sheetName.includes('ممتلكات') || sheetName.includes('معدات')) {
    parseFixedAssetsNote(rows, result);
  }
  
  // إيضاح النقد والبنوك
  if (sheetName.includes('النقد') && sheetName.includes('أرصدة')) {
    parseCashAndBankNote(rows, result);
  }
  
  // إيضاح المخصصات ورأس المال
  if (sheetName.includes('المخصصات') && sheetName.includes('رأس المال')) {
    parseCapitalAndProvisionsNote(rows, result);
  }
}

function parseZakatNote(rows: any[][], result: ComprehensiveFinancialData) {
  const zakat: ZakatNote = {
    profitBeforeZakat: 0,
    adjustmentsOnNetIncome: 0,
    adjustedNetProfit: 0,
    zakatOnAdjustedProfit: 0,
    capital: 0,
    partnersCurrentAccount: 0,
    statutoryReserve: 0,
    employeeBenefitsLiabilities: 0,
    zakatBaseSubtotal: 0,
    fixedAssetsNet: 0,
    intangibleAssetsNet: 0,
    other: 0,
    totalDeductions: 0,
    zakatBase: 0,
    zakatOnBase: 0,
    totalZakatProvision: 0,
    openingBalance: 0,
    provisionForYear: 0,
    paidDuringYear: 0,
    closingBalance: 0,
    zakatStatus: '',
  };
  
  let inProvisionMovement = false;
  
  for (const row of rows) {
    if (!row || row.length === 0) continue;
    
    const rowText = row.map(c => String(c || '')).join(' ').trim();
    const amount = extractAmountFromRow(row);
    
    if (rowText.includes('حركة مخصص الزكاة')) {
      inProvisionMovement = true;
      continue;
    }
    
    if (rowText.includes('الموقف الزكوي')) {
      const statusIdx = rows.indexOf(row);
      if (statusIdx < rows.length - 1) {
        zakat.zakatStatus = rows.slice(statusIdx + 1, statusIdx + 3).map(r => r?.join(' ') || '').join(' ');
      }
      continue;
    }
    
    if (inProvisionMovement) {
      if (rowText.includes('رصيد أول السنة') || rowText.includes('رصيد بداية')) {
        zakat.openingBalance = Math.abs(amount);
      } else if (rowText.includes('مخصص الزكاة المكون') || rowText.includes('المخصص المكون')) {
        zakat.provisionForYear = Math.abs(amount);
      } else if (rowText.includes('المسدد خلال السنة') || rowText.includes('المدفوع')) {
        zakat.paidDuringYear = Math.abs(amount);
      } else if (rowText.includes('الرصيد الختامي') || rowText.includes('رصيد نهاية')) {
        zakat.closingBalance = Math.abs(amount);
      }
    } else {
      if (rowText.includes('الربح') && rowText.includes('قبل الزكاة')) {
        zakat.profitBeforeZakat = amount;
      } else if (rowText.includes('تعديلات على صافي الدخل')) {
        zakat.adjustmentsOnNetIncome = amount;
      } else if (rowText.includes('صافي الربح المعدل')) {
        zakat.adjustedNetProfit = amount;
      } else if (rowText.includes('الزكاة الشرعية طبقاً لصافي الربح')) {
        zakat.zakatOnAdjustedProfit = Math.abs(amount);
      } else if (rowText.includes('رأس المال') && !rowText.includes('إجمالي')) {
        zakat.capital = Math.abs(amount);
      } else if (rowText.includes('جاري الشركاء') || rowText.includes('جاري الشركة')) {
        zakat.partnersCurrentAccount = Math.abs(amount);
      } else if (rowText.includes('احتياطي نظامي')) {
        zakat.statutoryReserve = Math.abs(amount);
      } else if (rowText.includes('التزامات منافع موظفين') || rowText.includes('مخصص نهاية الخدمة')) {
        zakat.employeeBenefitsLiabilities = Math.abs(amount);
      } else if (rowText.includes('المجموع') && !rowText.includes('إجمالي')) {
        zakat.zakatBaseSubtotal = Math.abs(amount);
      } else if (rowText.includes('العقارات والآلات') || rowText.includes('أصول ثابتة')) {
        zakat.fixedAssetsNet = Math.abs(amount);
      } else if (rowText.includes('موجودات غير ملموسة') || rowText.includes('أصول غير ملموسة')) {
        zakat.intangibleAssetsNet = Math.abs(amount);
      } else if (rowText.includes('وعاء الزكاة') && !rowText.includes('طبقاً')) {
        zakat.zakatBase = Math.abs(amount);
      } else if (rowText.includes('مخصص الزكاة الشرعية طبقاً للوعاء')) {
        zakat.zakatOnBase = Math.abs(amount);
      } else if (rowText.includes('إجمالي مخصص الزكاة')) {
        zakat.totalZakatProvision = Math.abs(amount);
      }
    }
  }
  
  // حساب القيم المشتقة
  if (zakat.totalDeductions === 0) {
    zakat.totalDeductions = zakat.fixedAssetsNet + zakat.intangibleAssetsNet + zakat.other;
  }
  
  result.notes.zakat = zakat;
}

function parseCostOfRevenueNote(rows: any[][], result: ComprehensiveFinancialData) {
  const note: CostOfRevenueNote = { items: [], total: 0 };
  
  for (const row of rows) {
    if (!row || row.length === 0) continue;
    
    const rowText = row.map(c => String(c || '')).join(' ').trim();
    if (rowText.includes('البيان') || rowText.includes('السنة المنتهية')) continue;
    
    const name = extractAccountNameFromRow(row);
    const amount = extractAmountFromRow(row);
    const prevAmount = row.length > 3 ? parseArabicNumber(row[row.length - 2]) : undefined;
    
    if (rowText.includes('مجموع') || rowText.includes('إجمالي')) {
      note.total = Math.abs(amount);
      note.previousTotal = prevAmount ? Math.abs(prevAmount) : undefined;
    } else if (name && name.length > 2) {
      note.items.push({ name, amount: Math.abs(amount), previousAmount: prevAmount ? Math.abs(prevAmount) : undefined });
    }
  }
  
  result.notes.costOfRevenue = note;
}

function parseGeneralExpensesNote(rows: any[][], result: ComprehensiveFinancialData) {
  const note: GeneralAndAdminExpensesNote = { items: [], total: 0 };
  
  for (const row of rows) {
    if (!row || row.length === 0) continue;
    
    const rowText = row.map(c => String(c || '')).join(' ').trim();
    if (rowText.includes('البيان') || rowText.includes('السنة المنتهية')) continue;
    
    const name = extractAccountNameFromRow(row);
    const amount = extractAmountFromRow(row);
    const prevAmount = row.length > 3 ? parseArabicNumber(row[row.length - 2]) : undefined;
    
    if (rowText.includes('مجموع') || rowText.includes('المجموع')) {
      note.total = Math.abs(amount);
      note.previousTotal = prevAmount ? Math.abs(prevAmount) : undefined;
    } else if (name && name.length > 2) {
      note.items.push({ name, amount: Math.abs(amount), previousAmount: prevAmount ? Math.abs(prevAmount) : undefined });
    }
  }
  
  result.notes.generalAndAdminExpenses = note;
}

function parseFixedAssetsNote(rows: any[][], result: ComprehensiveFinancialData) {
  // تحليل مبسط لجدول الأصول الثابتة
  const note: FixedAssetsNote = {
    categories: ['السيارات', 'الآلات والمعدات', 'الأثاث والمفروشات', 'أجهزة كهربائية', 'حاسب آلي', 'تصليحات وتجهيزات'],
    costOpening: [],
    costAdditions: [],
    costDisposals: [],
    costClosing: [],
    depreciationOpening: [],
    depreciationAdditions: [],
    depreciationDisposals: [],
    depreciationClosing: [],
    netBookValueClosing: [],
    netBookValuePreviousClosing: [],
    totals: {
      costOpening: 0,
      costAdditions: 0,
      costDisposals: 0,
      costClosing: 0,
      depreciationOpening: 0,
      depreciationAdditions: 0,
      depreciationDisposals: 0,
      depreciationClosing: 0,
      netBookValueClosing: 0,
      netBookValuePreviousClosing: 0,
    },
  };
  
  result.notes.fixedAssets = note;
}

function parseCashAndBankNote(rows: any[][], result: ComprehensiveFinancialData) {
  const note: CashAndBankNote = { items: [], total: 0 };
  
  for (const row of rows) {
    if (!row || row.length === 0) continue;
    
    const rowText = row.map(c => String(c || '')).join(' ').trim();
    if (rowText.includes('البيان')) continue;
    
    const name = extractAccountNameFromRow(row);
    const amount = extractAmountFromRow(row);
    const prevAmount = row.length > 3 ? parseArabicNumber(row[row.length - 2]) : undefined;
    
    if (rowText.includes('المجموع')) {
      note.total = Math.abs(amount);
      note.previousTotal = prevAmount ? Math.abs(prevAmount) : undefined;
    } else if (name && name.length > 2) {
      note.items.push({ name, amount: Math.abs(amount), previousAmount: prevAmount ? Math.abs(prevAmount) : undefined });
    }
  }
  
  result.notes.cashAndBank = note;
}

function parseCapitalAndProvisionsNote(rows: any[][], result: ComprehensiveFinancialData) {
  let inEmployeeBenefits = false;
  let inCapital = false;
  
  const employeeBenefits: EmployeeBenefitsNote = {
    openingBalance: 0,
    additions: 0,
    payments: 0,
    closingBalance: 0,
  };
  
  const capital: CapitalNote = {
    description: '',
    partners: [],
    totalShares: 0,
    totalValue: 0,
  };
  
  for (const row of rows) {
    if (!row || row.length === 0) continue;
    
    const rowText = row.map(c => String(c || '')).join(' ').trim();
    const amount = extractAmountFromRow(row);
    
    if (rowText.includes('مخصصات منافع موظفين')) {
      inEmployeeBenefits = true;
      inCapital = false;
      continue;
    }
    if (rowText.includes('رأس المال')) {
      inCapital = true;
      inEmployeeBenefits = false;
      continue;
    }
    
    if (inEmployeeBenefits) {
      if (rowText.includes('بداية الفترة')) {
        employeeBenefits.openingBalance = Math.abs(amount);
      } else if (rowText.includes('مكونة')) {
        employeeBenefits.additions = Math.abs(amount);
      } else if (rowText.includes('مدفوعة')) {
        employeeBenefits.payments = Math.abs(amount);
      } else if (rowText.includes('نهاية الفترة')) {
        employeeBenefits.closingBalance = Math.abs(amount);
      }
    }
    
    if (inCapital) {
      if (rowText.includes('حدد رأس مال الشركة')) {
        capital.description = rowText;
      } else if (rowText.includes('اسم الشريك') || rowText.includes('المجموع')) {
        // تخطي الرؤوس والمجاميع
      } else {
        const name = extractAccountNameFromRow(row);
        if (name && name.length > 2) {
          const values = row.filter(c => typeof c === 'number' || (typeof c === 'string' && !isNaN(parseFloat(c.replace(/[^\d.-]/g, ''))))).map(c => parseArabicNumber(c));
          if (values.length >= 3) {
            capital.partners.push({
              name,
              sharesCount: values[0] || 0,
              shareValue: values[1] || 0,
              totalValue: values[2] || 0,
            });
          }
        }
      }
    }
  }
  
  if (employeeBenefits.closingBalance > 0) {
    result.notes.employeeBenefits = employeeBenefits;
  }
  
  if (capital.partners.length > 0) {
    capital.totalShares = capital.partners.reduce((s, p) => s + p.sharesCount, 0);
    capital.totalValue = capital.partners.reduce((s, p) => s + p.totalValue, 0);
    result.notes.capital = capital;
  }
}

export default parseMedadExcel;
