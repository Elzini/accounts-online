/**
 * Balance Sheet Builder - Constructs balance sheet from classified accounts
 * Extracted from systemFinancialData.ts
 */
import { BalanceSheetData } from '@/components/financial-statements/types';
import { AccountCategory } from '../accounting';
import { ClassifiedAccounts, getBalance } from './accountClassifier';

const currentAssetCodes = ['11', '12', '13'];
const isCurrentAsset = (code: string) => currentAssetCodes.some(c => code.startsWith(c));

const currentLiabilityCodes = ['21', '22'];
const isCurrentLiability = (code: string) => currentLiabilityCodes.some(c => code.startsWith(c));

export function buildBalanceSheet(
  classified: ClassifiedAccounts,
  balances: Map<string, { debit: number; credit: number }>,
  netProfit: number
): BalanceSheetData {
  const bal = (a: AccountCategory) => getBalance(a, balances);

  const currentAssets = classified.assetAccounts
    .filter(a => isCurrentAsset(a.code))
    .map(a => ({ name: a.name, amount: bal(a) }))
    .filter(a => a.amount !== 0);

  const nonCurrentAssets = classified.assetAccounts
    .filter(a => !isCurrentAsset(a.code))
    .map(a => ({ name: a.name, amount: bal(a) }))
    .filter(a => a.amount !== 0);

  const currentLiabilities = classified.liabilityAccounts
    .filter(a => isCurrentLiability(a.code))
    .map(a => ({ name: a.name, amount: bal(a) }))
    .filter(a => a.amount !== 0);

  const nonCurrentLiabilities = classified.liabilityAccounts
    .filter(a => !isCurrentLiability(a.code))
    .map(a => ({ name: a.name, amount: bal(a) }))
    .filter(a => a.amount !== 0);

  const equity = classified.equityAccounts
    .map(a => ({ name: a.name, amount: bal(a) }))
    .filter(a => a.amount !== 0);

  const totalCurrentAssets = currentAssets.reduce((sum, a) => sum + a.amount, 0);
  const totalNonCurrentAssets = nonCurrentAssets.reduce((sum, a) => sum + a.amount, 0);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const totalCurrentLiabilities = currentLiabilities.reduce((sum, l) => sum + l.amount, 0);
  const totalNonCurrentLiabilities = nonCurrentLiabilities.reduce((sum, l) => sum + l.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

  const totalEquityFromAccounts = equity.reduce((sum, e) => sum + e.amount, 0);
  const totalEquity = totalEquityFromAccounts + netProfit;

  return {
    currentAssets,
    totalCurrentAssets,
    nonCurrentAssets,
    totalNonCurrentAssets,
    totalAssets,
    currentLiabilities,
    totalCurrentLiabilities,
    nonCurrentLiabilities,
    totalNonCurrentLiabilities,
    totalLiabilities,
    equity: [
      ...equity,
      { name: 'صافي ربح السنة', amount: netProfit },
    ].filter(e => e.amount !== 0),
    totalEquity,
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
  };
}
