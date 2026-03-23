import { supabase } from '@/integrations/supabase/client';
import { AuditCheckResult } from '../types';

export async function checkSecurityPermissions(companyId: string): Promise<AuditCheckResult[]> {
  const results: AuditCheckResult[] = [];

  const { data: profiles } = await supabase.from('profiles').select('user_id').eq('company_id', companyId);
  if (profiles && profiles.length > 0) {
    const { data: roles } = await supabase.from('user_roles').select('user_id, permission');
    const companyUserIds = new Set(profiles.map(p => p.user_id));
    const companyRoles = (roles || []).filter(r => companyUserIds.has(r.user_id));
    const adminCount = new Set(companyRoles.filter(r => r.permission === 'admin').map(r => r.user_id)).size;
    results.push({ id: 'security-roles', category: 'security', name: 'توزيع الصلاحيات', status: 'pass', message: `${adminCount} مدير، ${profiles.length - adminCount} مستخدم عادي`, severity: 'info' });
    if (profiles.length > 1 && adminCount === profiles.length) {
      results.push({ id: 'security-all-admins', category: 'security', name: 'جميع المستخدمين مدراء', status: 'warning', message: '⚠️ جميع المستخدمين لديهم صلاحيات مدير - يُنصح بتقييد الصلاحيات', severity: 'medium' });
    }
  }

  const { count: auditCount } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('company_id', companyId);
  results.push({ id: 'security-audit-logs', category: 'security', name: 'سجل التدقيق', status: (auditCount || 0) > 0 ? 'pass' : 'warning', message: (auditCount || 0) > 0 ? `✓ ${auditCount} سجل تدقيق` : '⚠️ لا توجد سجلات تدقيق - يُنصح بتفعيل التدقيق', severity: (auditCount || 0) > 0 ? 'info' : 'medium' });

  const { data: lastBackup } = await supabase.from('backups').select('created_at, status').eq('company_id', companyId).eq('status', 'completed').order('created_at', { ascending: false }).limit(1).maybeSingle();
  const daysSinceBackup = lastBackup ? Math.floor((Date.now() - new Date(lastBackup.created_at).getTime()) / (1000 * 60 * 60 * 24)) : null;
  results.push({ id: 'security-backups', category: 'security', name: 'النسخ الاحتياطي', status: daysSinceBackup !== null && daysSinceBackup <= 7 ? 'pass' : 'warning', message: daysSinceBackup !== null ? (daysSinceBackup <= 7 ? `✓ آخر نسخة قبل ${daysSinceBackup} يوم` : `⚠️ آخر نسخة قبل ${daysSinceBackup} يوم - يُنصح بعمل نسخة احتياطية`) : '⚠️ لا توجد نسخ احتياطية', severity: daysSinceBackup !== null && daysSinceBackup <= 7 ? 'info' : 'high' });

  return results;
}
