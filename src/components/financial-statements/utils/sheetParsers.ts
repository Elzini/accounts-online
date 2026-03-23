import { ExcelWorkbook, sheetToArray } from '@/lib/excelUtils';
import { ComprehensiveFinancialData } from '../types';
import { parseArabicNumber, extractAmountFromRow, extractAccountNameFromRow } from './numberFormatting';
import { parseNoteSheetDispatched } from './noteParsers';

export function findSheet(workbook: ExcelWorkbook, keywords: string[]): any[][] | null {
  for (const name of workbook.SheetNames) {
    const lowerName = name.toLowerCase();
    if (keywords.some(kw => name.includes(kw) || lowerName.includes(kw.toLowerCase()))) {
      const ws = workbook.Sheets[name];
      return sheetToArray(ws);
    }
  }
  return null;
}

export function extractCompanyInfo(rows: any[][], result: ComprehensiveFinancialData) {
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

export function parseBalanceSheet(rows: any[][], result: ComprehensiveFinancialData) {
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

export function parseIncomeStatement(rows: any[][], result: ComprehensiveFinancialData) {
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
    } else if (rowText.includes('مصاريف بيع') || rowText.includes('مصاريف تسويق') || rowText.includes('بيع وتسويق')) {
      result.incomeStatement.sellingAndMarketingExpenses = Math.abs(amount);
      result.incomeStatement.previousSellingAndMarketingExpenses = prevAmount ? Math.abs(prevAmount) : undefined;
    } else if (rowText.includes('مصاريف عمومية وإدارية') || rowText.includes('مصاريف إدارية')) {
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

export function parseEquityChanges(rows: any[][], result: ComprehensiveFinancialData) {
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

export function parseCashFlow(rows: any[][], result: ComprehensiveFinancialData) {
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

export function parseNoteSheetDispatched2(sheetName: string, rows: any[][], result: ComprehensiveFinancialData) {
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