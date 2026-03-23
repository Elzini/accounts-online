/**
 * Financial Reports Export Logic - Extracted from FinancialReportsPage
 */
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { usePdfExport } from '@/hooks/usePdfExport';
import { format } from 'date-fns';
import { plainFormat } from '@/components/financial-statements/utils/numberFormatting';

const fmt = (n: number) => plainFormat(n);

export function useFinancialReportsExport(t: any, dateRange: { from?: Date; to?: Date }) {
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  const { exportToPdf } = usePdfExport();

  const getTypeLabel = (type: string): string => {
    const types: Record<string, string> = { assets: t.coa_type_assets, liabilities: t.coa_type_liabilities, equity: t.coa_type_equity, revenue: t.coa_type_revenue, expenses: t.coa_type_expenses };
    return types[type] || type;
  };

  const getReferenceTypeLabel = (type: string | null): string => {
    const types: Record<string, string> = { sale: t.je_type_sales, purchase: t.je_type_purchases, expense: t.je_type_expenses, manual: t.je_type_manual, adjustment: t.je_type_auto, opening: t.fy_opening_entry };
    return type ? types[type] || type : t.gl_general;
  };

  const dateSubtitle = dateRange.from && dateRange.to ? `${t.gl_from} ${format(dateRange.from, 'yyyy/MM/dd')} ${t.gl_to} ${format(dateRange.to, 'yyyy/MM/dd')}` : undefined;

  const dispatch = (type: 'print' | 'excel' | 'pdf', opts: any) => {
    if (type === 'print') printReport(opts);
    else if (type === 'excel') exportToExcel({ ...opts, summaryData: opts.summaryCards?.map((c: any) => ({ label: c.label, value: c.value })) });
    else exportToPdf(opts);
  };

  const exportTrialBalance = (type: 'print' | 'excel' | 'pdf', trialBalance: any) => {
    if (!trialBalance) return;
    const columns = [{ header: t.coa_col_code, key: 'code' }, { header: t.coa_col_name, key: 'name' }, { header: t.je_col_type, key: 'type' }, { header: t.acc_debit, key: 'debit' }, { header: t.acc_credit, key: 'credit' }];
    const data = trialBalance.accounts.map((item: any) => ({ code: item.account.code, name: item.account.name, type: getTypeLabel(item.account.type), debit: item.debit > 0 ? fmt(item.debit) : '-', credit: item.credit > 0 ? fmt(item.credit) : '-' }));
    const summaryCards = [{ label: t.fr_total_debit, value: fmt(trialBalance.totalDebit) + ' ر.س' }, { label: t.fr_total_credit, value: fmt(trialBalance.totalCredit) + ' ر.س' }, { label: t.je_col_status, value: trialBalance.totalDebit === trialBalance.totalCredit ? t.fr_balanced : t.fr_unbalanced }];
    dispatch(type, { title: t.fr_trial_balance, columns, data, summaryCards, fileName: 'trial-balance' });
  };

  const exportComprehensiveTrial = (type: 'print' | 'excel' | 'pdf', comprehensiveTrial: any) => {
    if (!comprehensiveTrial) return;
    const columns = [{ header: t.coa_col_code, key: 'code' }, { header: t.coa_col_name, key: 'name' }, { header: `${t.acc_debit}`, key: 'openingDebit' }, { header: `${t.acc_credit}`, key: 'openingCredit' }, { header: `${t.acc_debit}`, key: 'periodDebit' }, { header: `${t.acc_credit}`, key: 'periodCredit' }, { header: `${t.acc_debit}`, key: 'closingDebit' }, { header: `${t.acc_credit}`, key: 'closingCredit' }];
    const data = comprehensiveTrial.accounts.map((item: any) => ({ code: item.account.code, name: item.account.name, openingDebit: item.openingDebit > 0 ? fmt(item.openingDebit) : '-', openingCredit: item.openingCredit > 0 ? fmt(item.openingCredit) : '-', periodDebit: item.periodDebit > 0 ? fmt(item.periodDebit) : '-', periodCredit: item.periodCredit > 0 ? fmt(item.periodCredit) : '-', closingDebit: item.closingDebit > 0 ? fmt(item.closingDebit) : '-', closingCredit: item.closingCredit > 0 ? fmt(item.closingCredit) : '-' }));
    data.push({ code: '', name: t.total || 'الإجمالي', openingDebit: fmt(comprehensiveTrial.totals.openingDebit), openingCredit: fmt(comprehensiveTrial.totals.openingCredit), periodDebit: fmt(comprehensiveTrial.totals.periodDebit), periodCredit: fmt(comprehensiveTrial.totals.periodCredit), closingDebit: fmt(comprehensiveTrial.totals.closingDebit), closingCredit: fmt(comprehensiveTrial.totals.closingCredit) });
    const summaryCards = [{ label: `رصيد أول المدة - ${t.acc_debit}`, value: fmt(comprehensiveTrial.totals.openingDebit) + ' ر.س' }, { label: `رصيد أول المدة - ${t.acc_credit}`, value: fmt(comprehensiveTrial.totals.openingCredit) + ' ر.س' }, { label: `الحركة - ${t.acc_debit}`, value: fmt(comprehensiveTrial.totals.periodDebit) + ' ر.س' }, { label: `الحركة - ${t.acc_credit}`, value: fmt(comprehensiveTrial.totals.periodCredit) + ' ر.س' }, { label: `رصيد آخر المدة - ${t.acc_debit}`, value: fmt(comprehensiveTrial.totals.closingDebit) + ' ر.س' }, { label: `رصيد آخر المدة - ${t.acc_credit}`, value: fmt(comprehensiveTrial.totals.closingCredit) + ' ر.س' }];
    if (type === 'print') printReport({ title: t.fr_comprehensive_trial, columns, data, summaryCards, columnGroups: [{ label: 'رصيد أول المدة', colSpan: 2 }, { label: t.fr_tab_account_movement || 'الحركة', colSpan: 2 }, { label: t.gl_closing_balance || 'رصيد آخر المدة', colSpan: 2 }] });
    else dispatch(type, { title: t.fr_comprehensive_trial, columns, data, summaryCards, fileName: 'comprehensive-trial-balance' });
  };

  const exportIncomeStatement = (type: 'print' | 'excel' | 'pdf', incomeStatement: any) => {
    if (!incomeStatement) return;
    const columns = [{ header: t.coa_col_code, key: 'code' }, { header: t.coa_col_name, key: 'name' }, { header: t.je_col_type, key: 'type' }, { header: t.acc_balance, key: 'amount' }];
    const data = [...incomeStatement.revenue.map((item: any) => ({ code: item.account.code, name: item.account.name, type: t.coa_type_revenue, amount: fmt(item.amount) })), ...incomeStatement.expenses.map((item: any) => ({ code: item.account.code, name: item.account.name, type: t.coa_type_expenses, amount: fmt(item.amount) }))];
    const summaryCards = [{ label: t.fr_total_revenue, value: fmt(incomeStatement.totalRevenue) + ' ر.س' }, { label: t.fr_total_expenses, value: fmt(incomeStatement.totalExpenses) + ' ر.س' }, { label: t.fr_net_income, value: fmt(incomeStatement.netIncome) + ' ر.س' }];
    dispatch(type, { title: t.fr_income_statement, subtitle: dateSubtitle, columns, data, summaryCards, fileName: 'income-statement' });
  };

  const exportBalanceSheet = (type: 'print' | 'excel' | 'pdf', balanceSheet: any) => {
    if (!balanceSheet) return;
    const columns = [{ header: t.coa_col_code, key: 'code' }, { header: t.coa_col_name, key: 'name' }, { header: t.je_col_type, key: 'category' }, { header: t.acc_balance, key: 'balance' }];
    const data = [...balanceSheet.currentAssets.map((i: any) => ({ code: i.account.code, name: i.account.name, category: t.fr_current_assets, balance: fmt(i.balance) })), ...balanceSheet.fixedAssets.map((i: any) => ({ code: i.account.code, name: i.account.name, category: t.fr_fixed_assets, balance: fmt(i.balance) })), ...balanceSheet.currentLiabilities.map((i: any) => ({ code: i.account.code, name: i.account.name, category: t.fr_current_liabilities, balance: fmt(i.balance) })), ...balanceSheet.longTermLiabilities.map((i: any) => ({ code: i.account.code, name: i.account.name, category: t.fr_long_term_liabilities, balance: fmt(i.balance) })), ...balanceSheet.equity.map((i: any) => ({ code: i.account.code, name: i.account.name, category: t.fr_equity, balance: fmt(i.balance) })), ...(balanceSheet.retainedEarnings !== 0 ? [{ code: '-', name: t.fr_retained_earnings, category: t.fr_equity, balance: fmt(balanceSheet.retainedEarnings) }] : [])];
    const summaryCards = [{ label: t.fr_current_assets, value: fmt(balanceSheet.totalCurrentAssets) + ' ر.س' }, { label: t.fr_fixed_assets, value: fmt(balanceSheet.totalFixedAssets) + ' ر.س' }, { label: t.fr_total_assets, value: fmt(balanceSheet.totalAssets) + ' ر.س' }, { label: t.fr_total_liabilities, value: fmt(balanceSheet.totalLiabilities) + ' ر.س' }, { label: t.fr_total_equity, value: fmt(balanceSheet.totalEquity) + ' ر.س' }];
    dispatch(type, { title: t.fr_balance_sheet, columns, data, summaryCards, fileName: 'balance-sheet' });
  };

  const exportJournalEntries = (type: 'print' | 'excel' | 'pdf', journalEntries: any[]) => {
    if (!journalEntries.length) return;
    const columns = [{ header: t.acc_entry_number, key: 'entry_number' }, { header: t.je_col_date, key: 'date' }, { header: t.je_col_type, key: 'type' }, { header: t.je_col_desc, key: 'description' }, { header: t.acc_debit, key: 'debit' }, { header: t.acc_credit, key: 'credit' }];
    const data = journalEntries.map((entry: any) => ({ entry_number: entry.entry_number, date: entry.entry_date, type: getReferenceTypeLabel(entry.reference_type), description: entry.description, debit: fmt(entry.total_debit), credit: fmt(entry.total_credit) }));
    const totalDebit = journalEntries.reduce((sum: number, e: any) => sum + e.total_debit, 0);
    const totalCredit = journalEntries.reduce((sum: number, e: any) => sum + e.total_credit, 0);
    const summaryCards = [{ label: t.fr_entries_count, value: journalEntries.length.toString() }, { label: t.fr_total_debit, value: fmt(totalDebit) + ' ر.س' }, { label: t.fr_total_credit, value: fmt(totalCredit) + ' ر.س' }];
    dispatch(type, { title: t.fr_journal_entries_report, subtitle: dateSubtitle, columns, data, summaryCards, fileName: 'journal-entries' });
  };

  const exportAccountBalances = (type: 'print' | 'excel' | 'pdf', accountBalances: any[]) => {
    if (!accountBalances.length) return;
    const columns = [{ header: t.coa_col_code, key: 'code' }, { header: t.coa_col_name, key: 'name' }, { header: t.je_col_type, key: 'type' }, { header: t.fr_total_debit, key: 'debit_total' }, { header: t.fr_total_credit, key: 'credit_total' }, { header: t.acc_balance, key: 'balance' }];
    const data = accountBalances.map(item => ({ code: item.account.code, name: item.account.name, type: getTypeLabel(item.account.type), debit_total: fmt(item.debit_total ?? 0), credit_total: fmt(item.credit_total ?? 0), balance: fmt(item.balance ?? 0) }));
    dispatch(type, { title: t.fr_account_balances, columns, data, fileName: 'account-balances' });
  };

  const exportVATSettlement = (type: 'print' | 'excel' | 'pdf', vatSettlement: any) => {
    if (!vatSettlement) return;
    const columns = [{ header: t.acc_entry_number, key: 'entryNumber' }, { header: t.je_col_date, key: 'date' }, { header: t.je_col_type, key: 'type' }, { header: t.je_col_desc, key: 'description' }, { header: t.vat_col_vat, key: 'taxAmount' }];
    const data = vatSettlement.transactions.map((tr: any) => ({ entryNumber: tr.entryNumber, date: tr.date, type: tr.type === 'sales' ? t.vat_output_tax : t.vat_input_tax, description: tr.description, taxAmount: fmt(tr.taxAmount) }));
    const summaryCards = [{ label: t.vat_output_tax, value: fmt(vatSettlement.vatPayable.balance) + ' ر.س' }, { label: t.vat_input_tax, value: fmt(vatSettlement.vatRecoverable.balance) + ' ر.س' }, { label: t.vat_net_vat, value: fmt(Math.abs(vatSettlement.netVAT)) + ' ر.س' }];
    dispatch(type, { title: t.fr_vat_settlement, subtitle: dateSubtitle, columns, data, summaryCards, fileName: 'vat-settlement' });
  };

  return { getTypeLabel, getReferenceTypeLabel, exportTrialBalance, exportComprehensiveTrial, exportIncomeStatement, exportBalanceSheet, exportJournalEntries, exportAccountBalances, exportVATSettlement, fmt };
}
