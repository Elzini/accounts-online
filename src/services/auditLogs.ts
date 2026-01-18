import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id: string;
  company_id: string | null;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export async function fetchAuditLogs(companyId?: string | null): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }

  return (data as AuditLog[]) || [];
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    user_created: 'إنشاء مستخدم',
    user_updated: 'تحديث مستخدم',
    user_deleted: 'حذف مستخدم',
    permission_granted: 'منح صلاحية',
    permission_revoked: 'سحب صلاحية',
  };
  return labels[action] || action;
}

export function getEntityTypeLabel(entityType: string): string {
  const labels: Record<string, string> = {
    user: 'مستخدم',
    user_role: 'صلاحية',
  };
  return labels[entityType] || entityType;
}

export function getPermissionLabel(permission: string): string {
  const labels: Record<string, string> = {
    sales: 'المبيعات',
    purchases: 'المشتريات',
    reports: 'التقارير',
    admin: 'المدير',
    users: 'المستخدمين',
    super_admin: 'مدير النظام',
  };
  return labels[permission] || permission;
}
