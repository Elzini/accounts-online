import { supabase } from '@/hooks/modules/useMiscServices';
import { isAccountType } from '@/utils/accountTypes';
import { AuditCheckResult } from '../types';
import { getIndustryFeatures } from '@/core/engine/industryFeatures';

export async function checkFinancialReports(companyId: string): Promise<AuditCheckResult[]> {
  const results: AuditCheckResult[] = [];

  // Trial Balance
  const { data: trialLines, error: tbErr } = await supabase.from('journal_entry_lines').select('debit, credit, journal_entry:journal_entries!inner(company_id, is_posted)').eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true);
  if (tbErr) {
    results.push({ id: 'reports-trial-balance', category: 'financial-reports', name: 'ميزان المراجعة', status: 'fail', message: 'خطأ في حساب ميزان المراجعة', severity: 'critical' });
  } else {
    const totalDebit = (trialLines || []).reduce((s, l: any) => s + Number(l.debit), 0);
    const totalCredit = (trialLines || []).reduce((s, l: any) => s + Number(l.credit), 0);
    const diff = Math.abs(totalDebit - totalCredit);
    results.push({ id: 'reports-trial-balance', category: 'financial-reports', name: 'ميزان المراجعة', status: diff > 0.01 ? 'fail' : 'pass', message: diff > 0.01 ? `⚠️ ميزان المراجعة غير متوازن! فرق: ${diff.toFixed(2)}` : `✓ ميزان المراجعة متوازن (مدين: ${totalDebit.toFixed(2)} = دائن: ${totalCredit.toFixed(2)})`, severity: diff > 0.01 ? 'critical' : 'info' });
  }

  // Account types check
  const { data: accounts } = await supabase.from('account_categories').select('type').eq('company_id', companyId);
  if (accounts) {
    const hasRevenue = accounts.some(a => isAccountType(a.type, 'revenue'));
    const hasExpenses = accounts.some(a => isAccountType(a.type, 'expense'));
    const hasAssets = accounts.some(a => isAccountType(a.type, 'asset'));
    const hasLiabilities = accounts.some(a => isAccountType(a.type, 'liability'));
    const hasEquity = accounts.some(a => isAccountType(a.type, 'equity'));
    results.push({ id: 'reports-income-accounts', category: 'financial-reports', name: 'حسابات قائمة الدخل', status: hasRevenue && hasExpenses ? 'pass' : 'warning', message: hasRevenue && hasExpenses ? '✓ حسابات الإيرادات والمصروفات موجودة' : `${!hasRevenue ? 'لا توجد حسابات إيرادات. ' : ''}${!hasExpenses ? 'لا توجد حسابات مصروفات.' : ''}`, severity: hasRevenue && hasExpenses ? 'info' : 'high' });
    results.push({ id: 'reports-balance-sheet-accounts', category: 'financial-reports', name: 'حسابات الميزانية العمومية', status: hasAssets && hasLiabilities && hasEquity ? 'pass' : 'warning', message: hasAssets && hasLiabilities && hasEquity ? '✓ حسابات الأصول والالتزامات وحقوق الملكية موجودة' : `مفقود: ${[!hasAssets && 'أصول', !hasLiabilities && 'التزامات', !hasEquity && 'حقوق ملكية'].filter(Boolean).join(', ')}`, severity: hasAssets && hasLiabilities && hasEquity ? 'info' : 'high' });
  }

  // Sales/Purchases linkage
  const { count: carSalesCount } = await supabase.from('sales').select('*', { count: 'exact', head: true }).eq('company_id', companyId);
  const { count: invoiceSalesCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('invoice_type', 'sales');
  const totalSalesCount = (carSalesCount || 0) + (invoiceSalesCount || 0);
  const { count: saleEntriesCount } = await supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('reference_type', ['sale', 'invoice_sale']);
  results.push({ id: 'reports-sales-linkage', category: 'financial-reports', name: 'ربط المبيعات بالقيود المحاسبية', status: totalSalesCount > 0 && (saleEntriesCount || 0) === 0 ? 'warning' : 'pass', message: totalSalesCount > 0 && (saleEntriesCount || 0) === 0 ? `⚠️ ${totalSalesCount} عملية بيع بدون قيود محاسبية مرتبطة` : `${totalSalesCount} مبيعات، ${saleEntriesCount || 0} قيد مرتبط`, severity: totalSalesCount > 0 && (saleEntriesCount || 0) === 0 ? 'high' : 'info' });

  const { count: carPurchasesCount } = await supabase.from('cars').select('*', { count: 'exact', head: true }).eq('company_id', companyId);
  const { count: invoicePurchasesCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('invoice_type', 'purchase');
  const totalPurchasesCount = (carPurchasesCount || 0) + (invoicePurchasesCount || 0);
  const { count: purchaseEntriesCount } = await supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('reference_type', ['purchase', 'invoice_purchase']);
  results.push({ id: 'reports-purchases-linkage', category: 'financial-reports', name: 'ربط المشتريات بالقيود المحاسبية', status: totalPurchasesCount > 0 && (purchaseEntriesCount || 0) === 0 ? 'warning' : 'pass', message: totalPurchasesCount > 0 && (purchaseEntriesCount || 0) === 0 ? `⚠️ ${totalPurchasesCount} عملية شراء بدون قيود محاسبية مرتبطة` : `${totalPurchasesCount} مشتريات، ${purchaseEntriesCount || 0} قيد مرتبط`, severity: totalPurchasesCount > 0 && (purchaseEntriesCount || 0) === 0 ? 'high' : 'info' });

  // VAT
  const { data: taxSettings } = await supabase.from('tax_settings').select('is_active, tax_rate').eq('company_id', companyId).maybeSingle();
  if (taxSettings?.is_active) {
    const { data: vatAccounts } = await supabase.from('account_categories').select('id, code, name').eq('company_id', companyId).or('code.like.%ضريبة%,name.like.%ضريبة%,name.like.%VAT%');
    results.push({ id: 'reports-vat-accounts', category: 'financial-reports', name: 'حسابات الإقرار الضريبي', status: vatAccounts && vatAccounts.length > 0 ? 'pass' : 'warning', message: vatAccounts && vatAccounts.length > 0 ? `✓ تم العثور على ${vatAccounts.length} حساب ضريبي` : '⚠️ الضريبة مفعلة لكن لا توجد حسابات ضريبية في شجرة الحسابات', severity: vatAccounts && vatAccounts.length > 0 ? 'info' : 'high' });
  }

  return results;
}
