import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function fetchDeviceLogs(deviceId: string) {
  const companyId = await requireCompanyId();
  const { data } = await supabase.from('hr_device_logs' as any).select('*')
    .eq('company_id', companyId).eq('device_id', deviceId)
    .order('created_at', { ascending: false }).limit(100);
  return data || [];
}

export async function insertDeviceLogs(logs: any[]) {
  const { error } = await supabase.from('hr_device_logs').insert(logs);
  if (error) throw error;
}

export async function updateDeviceSyncTime(deviceId: string) {
  await supabase.from('hr_fingerprint_devices').update({
    last_sync_at: new Date().toISOString(),
    sync_status: 'synced',
  }).eq('id', deviceId);
}

export async function upsertAttendance(record: any) {
  await supabase.from('employee_attendance').upsert(record);
}

export async function markLogsProcessed(logIds: string[]) {
  await supabase.from('hr_device_logs').update({ is_processed: true }).in('id', logIds);
}
