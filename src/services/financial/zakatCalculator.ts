/**
 * Zakat Calculator - ZATCA-compliant Net Assets Method
 * Extracted from systemFinancialData.ts (200+ lines → isolated module)
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { AccountCategory } from '../accounting';
import { ZakatNote } from '@/components/financial-statements/types';
import { ClassifiedAccounts, getBalance, getPositiveCreditBalance, getPositiveDebitBalance } from './accountClassifier';

const ZAKAT_RATE_GREGORIAN = 0.025775; // 365/354 × 2.5%

export interface ZakatResult {
  zakatBase: number;
  zakat: number;
  zakatNote: ZakatNote;
}

export async function calculateZakat(
  classified: ClassifiedAccounts,
  balances: Map<string, { debit: number; credit: number }>,
  profitBeforeZakat: number,
  totalNonCurrentAssets: number,
  companyId: string,
  endDate?: string
): Promise<ZakatResult> {
  const bal = (a: AccountCategory) => getBalance(a, balances);
  const posCr = (a: AccountCategory) => getPositiveCreditBalance(a, balances);
  const posDr = (a: AccountCategory) => getPositiveDebitBalance(a, balances);

  // 1.1 Capital
  const capitalAccounts = classified.equityAccounts.filter(a =>
    (a.name.includes('رأس المال') || a.name.includes('راس المال')) &&
    !a.name.includes('جاري') && !a.name.includes('سحوبات') && !a.name.includes('مسحوبات')
  );
  const capitalValue = capitalAccounts.reduce((sum, a) => sum + posCr(a), 0);

  // 1.2 Reserves
  const reserveAccounts = classified.equityAccounts.filter(a =>
    !a.code.startsWith('31') && !a.name.includes('جاري') && !a.name.includes('سحوبات') &&
    !a.name.includes('أرباح مبقاة') && !a.name.includes('ارباح مبقاة') &&
    !a.name.includes('خسائر مرحلة') && !a.name.includes('خسائر متراكمة') &&
    (a.name.includes('احتياطي') || a.name.includes('احتياط') || a.code.startsWith('33'))
  );
  const reservesTotal = reserveAccounts.reduce((sum, a) => sum + posCr(a), 0);

  // 1.3 Retained Earnings
  const retainedEarningsAccounts = classified.equityAccounts.filter(a =>
    a.name.includes('أرباح مبقاة') || a.name.includes('ارباح مبقاة') ||
    a.name.includes('أرباح محتجزة') || a.name.includes('ارباح محتجزة') ||
    a.code === '3301' || a.code === '3302'
  );
  const retainedEarnings = retainedEarningsAccounts.reduce((sum, a) => sum + bal(a), 0);

  // 1.5 Partners' Current Account (with Hawl check)
  const partnersCurrentInLiabilities = classified.liabilityAccounts.filter(a =>
    a.name.includes('جاري المالك') || a.name.includes('جاري الشريك') ||
    a.name.includes('جاري الشركاء') || a.name.includes('جاري صاحب') ||
    a.name.includes('تمويل جاري') || a.name.includes('قرض الشريك') ||
    a.name.includes('قروض الشركاء') || a.name.includes('سلف من المالك') ||
    a.name.includes('سلف من الشريك') || a.code.startsWith('2108')
  );
  const partnerWithdrawals = classified.equityAccounts.filter(a =>
    a.name.includes('سحوبات') || a.name.includes('مسحوبات') ||
    a.code.startsWith('3106') || a.code.startsWith('312')
  );
  const partnersCurrentInEquity = classified.equityAccounts.filter(a =>
    (a.name.includes('جاري') || a.name.includes('حساب جاري')) &&
    !a.name.includes('سحوبات') && !a.name.includes('مسحوبات')
  );

  const partnersCredits =
    partnersCurrentInLiabilities.reduce((sum, a) => sum + posCr(a), 0) +
    partnersCurrentInEquity.reduce((sum, a) => sum + posCr(a), 0);
  const partnersDebits = partnerWithdrawals.reduce((sum, a) => sum + posDr(a), 0);
  const partnersCurrentFullBalance = Math.max(0, partnersCredits - partnersDebits);

  // Hawl enforcement
  let partnersCurrentTotal = partnersCurrentFullBalance;
  let partnersHawlMonths = partnersCurrentFullBalance > 0 ? 12 : 0;

  if (partnersCurrentFullBalance > 0 && endDate) {
    const allPartnerAccountIds = [
      ...partnersCurrentInLiabilities.map(a => a.id),
      ...partnersCurrentInEquity.map(a => a.id),
      ...partnerWithdrawals.map(a => a.id),
    ];

    if (allPartnerAccountIds.length > 0) {
      const hawlCutoff = new Date(endDate);
      hawlCutoff.setFullYear(hawlCutoff.getFullYear() - 1);
      const hawlCutoffStr = hawlCutoff.toISOString().split('T')[0];

      const { data: partnerMovements, error } = await supabase
        .from('journal_entry_lines')
        .select(`debit, credit, account_id, journal_entry:journal_entries!inner(entry_date, company_id, is_posted)`)
        .eq('journal_entry.company_id', companyId)
        .eq('journal_entry.is_posted', true)
        .lte('journal_entry.entry_date', endDate)
        .in('account_id', allPartnerAccountIds);

      if (error) throw error;

      if (partnerMovements && partnerMovements.length > 0) {
        let eligibleAfterHawl = 0;
        partnerMovements.forEach((line: any) => {
          const entryDate = String((line.journal_entry as any).entry_date || '');
          const movement = (Number(line.credit) || 0) - (Number(line.debit) || 0);
          if (movement > 0) {
            if (entryDate <= hawlCutoffStr) eligibleAfterHawl += movement;
          } else {
            eligibleAfterHawl += movement;
          }
        });
        partnersCurrentTotal = Math.max(0, eligibleAfterHawl);
        partnersHawlMonths = partnersCurrentTotal > 0 ? 12 : 0;
      }
    }
  }

  // 1.6 Provisions
  const provisionAccounts = classified.liabilityAccounts.filter(a =>
    (a.name.includes('مخصص') && !a.name.includes('زكاة')) ||
    a.name.includes('مكافأة نهاية') || a.name.includes('التزامات منافع')
  );
  const provisionsTotal = provisionAccounts.reduce((sum, a) => sum + posCr(a), 0);

  // 1.7 Long-term loans
  const longTermLoans = classified.liabilityAccounts.filter(a =>
    !partnersCurrentInLiabilities.includes(a) &&
    (a.name.includes('قرض طويل') || a.name.includes('تمويل طويل') ||
     a.name.includes('صكوك') || a.code.startsWith('22'))
  );
  const longTermLoansTotal = longTermLoans.reduce((sum, a) => sum + posCr(a), 0);

  const zakatSources = capitalValue + reservesTotal + Math.max(0, retainedEarnings)
    + profitBeforeZakat + partnersCurrentTotal + provisionsTotal + longTermLoansTotal;

  // 2. Deductions
  const longTermInvestments = classified.assetAccounts.filter(a =>
    (a.name.includes('استثمار') && !a.code.startsWith('11')) || a.code.startsWith('12')
  );
  const longTermInvestmentsTotal = longTermInvestments.reduce((sum, a) => sum + bal(a), 0);
  const accumulatedLosses = Math.max(0, -retainedEarnings);

  const prepaidRentAccounts = classified.assetAccounts.filter(a =>
    a.name.includes('إيجار مدفوع') || a.name.includes('ايجار مدفوع') ||
    a.name.includes('إيجار مقدم') || a.name.includes('ايجار مقدم')
  );
  const prepaidRent = prepaidRentAccounts.reduce((sum, a) => sum + bal(a), 0);
  const prepaidRentLongTerm = prepaidRent * (11 / 12);

  const deferredExpenseAccounts = classified.assetAccounts.filter(a =>
    (a.name.includes('مصاريف تأسيس') || a.name.includes('مصروفات مؤجلة') ||
     a.name.includes('مصاريف ما قبل التشغيل')) && !prepaidRentAccounts.includes(a)
  );
  const deferredExpensesTotal = deferredExpenseAccounts.reduce((sum, a) => sum + bal(a), 0);

  const totalDeductions = totalNonCurrentAssets + Math.max(0, longTermInvestmentsTotal)
    + accumulatedLosses + Math.max(0, prepaidRentLongTerm) + Math.max(0, deferredExpensesTotal);

  const zakatBase = zakatSources - totalDeductions;
  const zakat = zakatBase > 0 ? zakatBase * ZAKAT_RATE_GREGORIAN : 0;

  const zakatNote: ZakatNote = {
    profitBeforeZakat,
    adjustmentsOnNetIncome: 0,
    adjustedNetProfit: profitBeforeZakat,
    zakatOnAdjustedProfit: profitBeforeZakat > 0 ? profitBeforeZakat * ZAKAT_RATE_GREGORIAN : 0,
    capital: capitalValue,
    partnersCurrentAccount: partnersCurrentTotal,
    partnersCurrentFullBalance,
    partnersHawlMonths,
    statutoryReserve: reservesTotal,
    employeeBenefitsLiabilities: provisionsTotal,
    zakatBaseSubtotal: zakatSources,
    fixedAssetsNet: totalNonCurrentAssets,
    intangibleAssetsNet: longTermInvestmentsTotal,
    other: 0,
    totalDeductions,
    zakatBase: Math.max(0, zakatBase),
    zakatOnBase: zakat,
    totalZakatProvision: zakat,
    openingBalance: 0,
    provisionForYear: zakat,
    paidDuringYear: 0,
    closingBalance: zakat,
    zakatStatus: zakatBase > 0
      ? `تم احتساب مخصص الزكاة بطريقة صافي الأصول - نسبة ${(ZAKAT_RATE_GREGORIAN * 100).toFixed(4)}% (سنة ميلادية)`
      : 'الوعاء الزكوي سالب - لا تستحق زكاة',
  };

  return { zakatBase, zakat, zakatNote };
}
