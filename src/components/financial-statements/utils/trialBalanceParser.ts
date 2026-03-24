/**
 * Trial Balance Parser - Orchestrator
 * Delegates to trialBalanceColumnDetector and trialBalanceClassifier
 */
import { ComprehensiveFinancialData } from '../types';
import { detectTrialBalanceColumns, extractAccountName, extractAccountCode, parseNumber, type ColumnMap } from './trialBalanceColumnDetector';
import { categorizeAccountMedad, buildFinancialStatements, type ClassifiedAccounts } from './trialBalanceClassifier';

// Re-export for backward compatibility
export { normalizeHeaderCell, includesAny, detectTrialBalanceColumns, extractAccountName, extractAccountCode, parseNumber } from './trialBalanceColumnDetector';
export { categorizeAccountMedad, buildFinancialStatements } from './trialBalanceClassifier';

export function parseTrialBalanceSheet(rows: any[][], result: ComprehensiveFinancialData) {
  console.log('📊 Parsing Trial Balance Sheet - Total rows:', rows.length);

  // Extract company info from first rows
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!row) continue;
    const rowText = row.map((c: any) => String(c || '')).join(' ').trim();

    if (!result.companyName && rowText.length > 5) {
      const firstCell = String(row[0] || '').trim();
      if (firstCell.length > 5 && !firstCell.includes('ميزان') && !firstCell.includes('Report') &&
          !firstCell.includes('Vat') && !firstCell.includes('الصفحة')) {
        for (const cell of row) {
          const cellText = String(cell || '').trim();
          if (cellText.length > 5 && !cellText.includes('ميزان') && !cellText.includes('Report')) {
            result.companyName = cellText;
            break;
          }
        }
      }
    }

    const vatMatch = rowText.match(/3\d{14}/);
    if (vatMatch) console.log('📊 Found VAT Number:', vatMatch[0]);

    const dateMatch = rowText.match(/(\d{4}-\d{2}-\d{2})/g);
    if (dateMatch && dateMatch.length >= 1) result.reportDate = dateMatch[dateMatch.length - 1];
  }

  const colMap = detectTrialBalanceColumns(rows);
  console.log('📊 Column Map:', colMap);

  if (colMap.startRow === -1) {
    console.warn('⚠️ Could not detect data columns');
    return;
  }

  const accounts: ClassifiedAccounts = {
    fixedAssets: [], currentAssets: [], currentLiabilities: [],
    equity: [], revenue: [], expenses: [], purchases: [],
  };

  for (let i = colMap.startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const accountName = extractAccountName(row, colMap);
    const accountCode = extractAccountCode(row, colMap);
    const closingDebit = parseNumber(row[colMap.closingDebit]);
    const closingCredit = parseNumber(row[colMap.closingCredit]);

    if (!accountName || accountName.length < 2) continue;
    if (accountName.includes('اسم الحساب') || accountName.includes('البيان')) continue;
    if (accountCode.length === 1) continue;

    const netAmount = Math.abs(closingDebit - closingCredit);
    if (netAmount === 0 && closingDebit === 0 && closingCredit === 0) continue;

    const displayAmount = Math.max(closingDebit, closingCredit);
    const category = categorizeAccountMedad(accountCode, accountName);

    console.log(`📌 ${accountCode} - ${accountName}: ${category} = ${displayAmount.toFixed(2)}`);

    const accountItem = { name: accountName, amount: displayAmount, code: accountCode };
    switch (category) {
      case 'أصول ثابتة': accounts.fixedAssets.push(accountItem); break;
      case 'أصول متداولة': accounts.currentAssets.push(accountItem); break;
      case 'خصوم': accounts.currentLiabilities.push(accountItem); break;
      case 'حقوق ملكية': accounts.equity.push(accountItem); break;
      case 'إيرادات': accounts.revenue.push(accountItem); break;
      case 'مشتريات': accounts.purchases.push(accountItem); break;
      case 'مصروفات': accounts.expenses.push(accountItem); break;
    }
  }

  buildFinancialStatements(accounts, result);

  console.log('📊 Final Result:', {
    totalAssets: result.balanceSheet.totalAssets,
    totalLiabilities: result.balanceSheet.totalLiabilities,
    totalEquity: result.balanceSheet.totalEquity,
    revenue: result.incomeStatement.revenue,
    expenses: result.incomeStatement.generalAndAdminExpenses,
  });
}
