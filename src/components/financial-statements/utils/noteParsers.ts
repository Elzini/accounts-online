import { 
  ComprehensiveFinancialData, ZakatNote, FixedAssetsNote,
  CostOfRevenueNote, GeneralAndAdminExpensesNote, CashAndBankNote,
  EmployeeBenefitsNote, CapitalNote,
} from '../types';
import { parseArabicNumber, extractAmountFromRow, extractAccountNameFromRow } from './numberFormatting';

export function parseNoteSheetDispatched(sheetName: string, rows: any[][], result: ComprehensiveFinancialData) {
  if (sheetName.includes('الزكاة') || sheetName.includes('مخصص الزكاة')) parseZakatNote(rows, result);
  if (sheetName.includes('تكلفة الإيرادات')) parseCostOfRevenueNote(rows, result);
  if (sheetName.includes('مصاريف') && (sheetName.includes('إدارية') || sheetName.includes('ادارية'))) parseGeneralExpensesNote(rows, result);
  if (sheetName.includes('ممتلكات') || sheetName.includes('معدات')) parseFixedAssetsNote(rows, result);
  if (sheetName.includes('النقد') && sheetName.includes('أرصدة')) parseCashAndBankNote(rows, result);
  if (sheetName.includes('المخصصات') && sheetName.includes('رأس المال')) parseCapitalAndProvisionsNote(rows, result);
}

export function parseZakatNote(rows: any[][], result: ComprehensiveFinancialData) {
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

export function parseCostOfRevenueNote(rows: any[][], result: ComprehensiveFinancialData) {
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

export function parseGeneralExpensesNote(rows: any[][], result: ComprehensiveFinancialData) {
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

export function parseFixedAssetsNote(rows: any[][], result: ComprehensiveFinancialData) {
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

export function parseCashAndBankNote(rows: any[][], result: ComprehensiveFinancialData) {
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

export function parseCapitalAndProvisionsNote(rows: any[][], result: ComprehensiveFinancialData) {
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