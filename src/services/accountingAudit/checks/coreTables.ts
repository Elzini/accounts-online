import { supabase } from '@/integrations/supabase/client';
import { AuditCheckResult } from '../types';
import { createFixMissingTaxSettings, createFixMissingCOA } from '../../auditFixActions';

export async function checkCoreTables(companyId: string): Promise<AuditCheckResult[]> {
  const results: AuditCheckResult[] = [];

  const { count: accountsCount, error: accErr } = await supabase.from('account_categories').select('*', { count: 'exact', head: true }).eq('company_id', companyId);
  results.push({
    id: 'core-accounts', category: 'database', name: 'جدول شجرة الحسابات',
    status: accErr ? 'fail' : (accountsCount && accountsCount > 0 ? 'pass' : 'warning'),
    message: accErr ? 'خطأ في الوصول لجدول الحسابات' : (accountsCount && accountsCount > 0 ? `تم العثور على ${accountsCount} حساب` : 'لا توجد حسابات - يجب إنشاء شجرة الحسابات'),
    severity: accErr ? 'critical' : (accountsCount && accountsCount > 0 ? 'info' : 'high'),
    fixActions: (!accErr && (!accountsCount || accountsCount === 0)) ? [createFixMissingCOA(companyId, 'car_dealership')] : undefined,
  });

  const { count: jeCount, error: jeErr } = await supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('company_id', companyId);
  results.push({ id: 'core-journal-entries', category: 'database', name: 'جدول القيود اليومية', status: jeErr ? 'fail' : 'pass', message: jeErr ? 'خطأ في الوصول لجدول القيود' : `تم العثور على ${jeCount || 0} قيد`, severity: jeErr ? 'critical' : 'info' });

  const { count: fyCount, error: fyErr } = await supabase.from('fiscal_years').select('*', { count: 'exact', head: true }).eq('company_id', companyId);
  results.push({ id: 'core-fiscal-years', category: 'database', name: 'السنوات المالية', status: fyErr ? 'fail' : (fyCount && fyCount > 0 ? 'pass' : 'warning'), message: fyErr ? 'خطأ في الوصول للسنوات المالية' : (fyCount && fyCount > 0 ? `تم العثور على ${fyCount} سنة مالية` : 'لا توجد سنوات مالية محددة'), severity: fyErr ? 'critical' : (fyCount && fyCount > 0 ? 'info' : 'medium') });

  const { data: taxData, error: taxErr } = await supabase.from('tax_settings').select('*').eq('company_id', companyId).maybeSingle();
  results.push({ id: 'core-tax-settings', category: 'database', name: 'إعدادات الضريبة', status: taxErr ? 'fail' : (taxData ? 'pass' : 'warning'), message: taxErr ? 'خطأ في إعدادات الضريبة' : (taxData ? `الضريبة: ${taxData.tax_rate}%` : 'لم يتم تعيين إعدادات الضريبة'), severity: taxErr ? 'high' : (taxData ? 'info' : 'medium'), fixActions: (!taxErr && !taxData) ? [createFixMissingTaxSettings(companyId)] : undefined });

  const { count: usersCount, error: usersErr } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', companyId);
  results.push({ id: 'core-users', category: 'database', name: 'المستخدمين والصلاحيات', status: usersErr ? 'fail' : 'pass', message: usersErr ? 'خطأ في جدول المستخدمين' : `${usersCount || 0} مستخدم مسجل`, severity: usersErr ? 'critical' : 'info' });

  return results;
}
