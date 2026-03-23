import { supabase } from '@/hooks/modules/useMiscServices';
import { IntegrityCheckResult } from './types';

export async function checkTemplateProtection(companyId: string): Promise<IntegrityCheckResult> {
  const issues: string[] = [];

  const { data: settings } = await supabase
    .from('app_settings')
    .select('key, value, updated_at')
    .eq('company_id', companyId);

  if (settings) {
    const now = new Date();
    const staleSettings = settings.filter(s => {
      const updatedAt = new Date(s.updated_at);
      const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 365;
    });

    if (staleSettings.length > 0) {
      issues.push(`${staleSettings.length} إعداد لم يُحدث منذ أكثر من سنة`);
    }
  }

  const localStorageKeys = ['cached_accounts', 'cached_balances', 'old_template_data', 'legacy_data'];
  const foundLegacyKeys: string[] = [];

  try {
    localStorageKeys.forEach(key => {
      if (typeof window !== 'undefined' && localStorage.getItem(key)) {
        foundLegacyKeys.push(key);
      }
    });
  } catch { /* localStorage غير متاح */ }

  if (foundLegacyKeys.length > 0) {
    issues.push(`وجود ${foundLegacyKeys.length} مفتاح قديم في التخزين المحلي: ${foundLegacyKeys.join(', ')}`);
  }

  const { count: accountCount } = await supabase
    .from('account_categories')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  return {
    checkType: 'template_protection',
    checkName: 'حماية مصادر البيانات',
    status: issues.length === 0 ? 'pass' : 'warning',
    details: {
      settingsCount: settings?.length || 0,
      accountsCount: accountCount || 0,
      legacyKeys: foundLegacyKeys,
      issues,
    },
    issuesFound: issues.length,
  };
}
