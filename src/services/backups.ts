import { supabase } from "@/integrations/supabase/client";

export interface Backup {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  backup_type: 'manual' | 'automatic';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  file_path: string | null;
  file_size: number | null;
  tables_included: string[];
  records_count: Record<string, number>;
  backup_data: BackupData | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface BackupSchedule {
  id: string;
  company_id: string;
  is_enabled: boolean;
  frequency: 'daily' | 'weekly';
  last_backup_at: string | null;
  next_backup_at: string | null;
  retention_days: number;
  backup_hour: number;
  created_at: string;
  updated_at: string;
}

export interface BackupData {
  customers: any[];
  suppliers: any[];
  cars: any[];
  sales: any[];
  sale_items: any[];
  purchase_batches: any[];
  journal_entries: any[];
  journal_entry_lines: any[];
  account_categories: any[];
  expenses: any[];
  quotations: any[];
  installments: any[];
  vouchers: any[];
  car_transfers: any[];
  partner_dealerships: any[];
}

export async function getBackups(companyId: string): Promise<Backup[]> {
  const { data, error } = await supabase
    .from('backups')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as Backup[];
}

export async function getBackupSchedule(companyId: string): Promise<BackupSchedule | null> {
  const { data, error } = await supabase
    .from('backup_schedules')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as unknown as BackupSchedule | null;
}

export async function createBackup(companyId: string, name: string, description?: string): Promise<Backup> {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Create backup record
  const { data: backup, error: insertError } = await supabase
    .from('backups')
    .insert({
      company_id: companyId,
      name,
      description,
      backup_type: 'manual',
      status: 'in_progress',
      created_by: user?.id
    })
    .select()
    .single();

  if (insertError) throw insertError;

  try {
    // Fetch all data
    const backupData = await fetchAllData(companyId);
    const recordsCount = calculateRecordsCount(backupData);
    const fileSize = new Blob([JSON.stringify(backupData)]).size;

    // Update backup with data
    const { data: updatedBackup, error: updateError } = await supabase
      .from('backups')
      .update({
        status: 'completed',
        backup_data: backupData as any,
        records_count: recordsCount as any,
        file_size: fileSize,
        completed_at: new Date().toISOString()
      })
      .eq('id', backup.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedBackup as unknown as Backup;
  } catch (error) {
    // Mark as failed
    await supabase
      .from('backups')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء النسخة الاحتياطية'
      })
      .eq('id', backup.id);
    throw error;
  }
}

async function fetchAllData(companyId: string): Promise<BackupData> {
  const [
    customers,
    suppliers,
    cars,
    sales,
    saleItems,
    purchaseBatches,
    journalEntries,
    journalEntryLines,
    accountCategories,
    expenses,
    quotations,
    installments,
    vouchers,
    carTransfers,
    partnerDealerships
  ] = await Promise.all([
    supabase.from('customers').select('*').eq('company_id', companyId),
    supabase.from('suppliers').select('*').eq('company_id', companyId),
    supabase.from('cars').select('*').eq('company_id', companyId),
    supabase.from('sales').select('*').eq('company_id', companyId),
    supabase.from('sale_items').select('*, sales!inner(company_id)').eq('sales.company_id', companyId),
    supabase.from('purchase_batches').select('*').eq('company_id', companyId),
    supabase.from('journal_entries').select('*').eq('company_id', companyId),
    supabase.from('journal_entry_lines').select('*, journal_entries!inner(company_id)').eq('journal_entries.company_id', companyId),
    supabase.from('account_categories').select('*').eq('company_id', companyId),
    supabase.from('expenses').select('*').eq('company_id', companyId),
    supabase.from('quotations').select('*').eq('company_id', companyId),
    (supabase as any).from('installments').select('*').eq('company_id', companyId),
    supabase.from('vouchers').select('*').eq('company_id', companyId),
    supabase.from('car_transfers').select('*').eq('company_id', companyId),
    supabase.from('partner_dealerships').select('*').eq('company_id', companyId)
  ]);

  return {
    customers: customers.data || [],
    suppliers: suppliers.data || [],
    cars: cars.data || [],
    sales: sales.data || [],
    sale_items: saleItems.data || [],
    purchase_batches: purchaseBatches.data || [],
    journal_entries: journalEntries.data || [],
    journal_entry_lines: journalEntryLines.data || [],
    account_categories: accountCategories.data || [],
    expenses: expenses.data || [],
    quotations: quotations.data || [],
    installments: installments.data || [],
    vouchers: vouchers.data || [],
    car_transfers: carTransfers.data || [],
    partner_dealerships: partnerDealerships.data || []
  };
}

function calculateRecordsCount(data: BackupData): Record<string, number> {
  return {
    customers: data.customers.length,
    suppliers: data.suppliers.length,
    cars: data.cars.length,
    sales: data.sales.length,
    sale_items: data.sale_items.length,
    purchase_batches: data.purchase_batches.length,
    journal_entries: data.journal_entries.length,
    journal_entry_lines: data.journal_entry_lines.length,
    account_categories: data.account_categories.length,
    expenses: data.expenses.length,
    quotations: data.quotations.length,
    installments: data.installments.length,
    vouchers: data.vouchers.length,
    car_transfers: data.car_transfers.length,
    partner_dealerships: data.partner_dealerships.length
  };
}

export async function deleteBackup(backupId: string): Promise<void> {
  const { error } = await supabase
    .from('backups')
    .delete()
    .eq('id', backupId);

  if (error) throw error;
}

export async function restoreBackup(backupId: string, companyId: string): Promise<void> {
  // Get backup data
  const { data: backup, error } = await supabase
    .from('backups')
    .select('backup_data')
    .eq('id', backupId)
    .single();

  if (error) throw error;
  if (!backup?.backup_data) throw new Error('لا توجد بيانات في النسخة الاحتياطية');

  const backupData = backup.backup_data as unknown as BackupData;

  // Delete existing data (in correct order to respect foreign keys)
  await supabase.from('journal_entry_lines').delete().eq('journal_entries.company_id', companyId);
  await supabase.from('journal_entries').delete().eq('company_id', companyId);
  await supabase.from('sale_items').delete().eq('sales.company_id', companyId);
  await supabase.from('sales').delete().eq('company_id', companyId);
  await supabase.from('cars').delete().eq('company_id', companyId);
  await supabase.from('purchase_batches').delete().eq('company_id', companyId);
  await supabase.from('expenses').delete().eq('company_id', companyId);
  await supabase.from('quotations').delete().eq('company_id', companyId);
  await (supabase as any).from('installments').delete().eq('company_id', companyId);
  await supabase.from('vouchers').delete().eq('company_id', companyId);
  await supabase.from('car_transfers').delete().eq('company_id', companyId);
  await supabase.from('customers').delete().eq('company_id', companyId);
  await supabase.from('suppliers').delete().eq('company_id', companyId);
  await supabase.from('partner_dealerships').delete().eq('company_id', companyId);
  await supabase.from('account_categories').delete().eq('company_id', companyId);

  // Restore data (in correct order)
  if (backupData.account_categories?.length) {
    await supabase.from('account_categories').insert(backupData.account_categories);
  }
  if (backupData.customers?.length) {
    await supabase.from('customers').insert(backupData.customers);
  }
  if (backupData.suppliers?.length) {
    await supabase.from('suppliers').insert(backupData.suppliers);
  }
  if (backupData.partner_dealerships?.length) {
    await supabase.from('partner_dealerships').insert(backupData.partner_dealerships);
  }
  if (backupData.purchase_batches?.length) {
    await supabase.from('purchase_batches').insert(backupData.purchase_batches);
  }
  if (backupData.cars?.length) {
    await supabase.from('cars').insert(backupData.cars);
  }
  if (backupData.sales?.length) {
    await supabase.from('sales').insert(backupData.sales);
  }
  if (backupData.sale_items?.length) {
    await supabase.from('sale_items').insert(backupData.sale_items);
  }
  if (backupData.journal_entries?.length) {
    await supabase.from('journal_entries').insert(backupData.journal_entries);
  }
  if (backupData.journal_entry_lines?.length) {
    await supabase.from('journal_entry_lines').insert(backupData.journal_entry_lines);
  }
  if (backupData.expenses?.length) {
    await supabase.from('expenses').insert(backupData.expenses);
  }
  if (backupData.quotations?.length) {
    await supabase.from('quotations').insert(backupData.quotations as any);
  }
  if (backupData.installments?.length) {
    await (supabase as any).from('installments').insert(backupData.installments);
  }
  if (backupData.vouchers?.length) {
    await supabase.from('vouchers').insert(backupData.vouchers);
  }
  if (backupData.car_transfers?.length) {
    await supabase.from('car_transfers').insert(backupData.car_transfers);
  }
}

export async function updateBackupSchedule(
  companyId: string, 
  schedule: Partial<BackupSchedule>
): Promise<BackupSchedule> {
  const hour = schedule.backup_hour ?? 3;
  const nextBackupAt = schedule.is_enabled 
    ? calculateNextBackup(schedule.frequency || 'daily', hour)
    : null;

  const { data, error } = await supabase
    .from('backup_schedules')
    .upsert({
      company_id: companyId,
      is_enabled: schedule.is_enabled ?? true,
      frequency: schedule.frequency ?? 'daily',
      retention_days: schedule.retention_days ?? 30,
      backup_hour: hour,
      next_backup_at: nextBackupAt,
      updated_at: new Date().toISOString()
    }, { onConflict: 'company_id' })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as BackupSchedule;
}

function calculateNextBackup(frequency: 'daily' | 'weekly', hour: number = 3): string {
  const now = new Date();
  if (frequency === 'daily') {
    now.setDate(now.getDate() + 1);
  } else {
    now.setDate(now.getDate() + 7);
  }
  now.setHours(hour, 0, 0, 0);
  return now.toISOString();
}

export function downloadBackupAsJson(backup: Backup): void {
  if (!backup.backup_data) {
    throw new Error('لا توجد بيانات في النسخة الاحتياطية');
  }

  const dataStr = JSON.stringify(backup.backup_data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup_${backup.name}_${new Date(backup.created_at).toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function restoreFromLocalFile(
  companyId: string, 
  file: File
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content) as BackupData;
        
        // Validate backup data structure
        if (!backupData.customers && !backupData.cars && !backupData.sales) {
          throw new Error('ملف النسخة الاحتياطية غير صالح');
        }

        // Delete existing data (in correct order to respect foreign keys)
        await supabase.from('journal_entry_lines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('journal_entries').delete().eq('company_id', companyId);
        await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('sales').delete().eq('company_id', companyId);
        await supabase.from('cars').delete().eq('company_id', companyId);
        await supabase.from('purchase_batches').delete().eq('company_id', companyId);
        await supabase.from('expenses').delete().eq('company_id', companyId);
        await supabase.from('quotations').delete().eq('company_id', companyId);
        await (supabase as any).from('installments').delete().eq('company_id', companyId);
        await supabase.from('vouchers').delete().eq('company_id', companyId);
        await supabase.from('car_transfers').delete().eq('company_id', companyId);
        await supabase.from('customers').delete().eq('company_id', companyId);
        await supabase.from('suppliers').delete().eq('company_id', companyId);
        await supabase.from('partner_dealerships').delete().eq('company_id', companyId);
        await supabase.from('account_categories').delete().eq('company_id', companyId);

        // Restore data (in correct order)
        if (backupData.account_categories?.length) {
          await supabase.from('account_categories').insert(backupData.account_categories as any);
        }
        if (backupData.customers?.length) {
          await supabase.from('customers').insert(backupData.customers as any);
        }
        if (backupData.suppliers?.length) {
          await supabase.from('suppliers').insert(backupData.suppliers as any);
        }
        if (backupData.partner_dealerships?.length) {
          await supabase.from('partner_dealerships').insert(backupData.partner_dealerships as any);
        }
        if (backupData.purchase_batches?.length) {
          await supabase.from('purchase_batches').insert(backupData.purchase_batches as any);
        }
        if (backupData.cars?.length) {
          await supabase.from('cars').insert(backupData.cars as any);
        }
        if (backupData.sales?.length) {
          await supabase.from('sales').insert(backupData.sales as any);
        }
        if (backupData.sale_items?.length) {
          await supabase.from('sale_items').insert(backupData.sale_items as any);
        }
        if (backupData.journal_entries?.length) {
          await supabase.from('journal_entries').insert(backupData.journal_entries as any);
        }
        if (backupData.journal_entry_lines?.length) {
          await supabase.from('journal_entry_lines').insert(backupData.journal_entry_lines as any);
        }
        if (backupData.expenses?.length) {
          await supabase.from('expenses').insert(backupData.expenses as any);
        }
        if (backupData.quotations?.length) {
          await supabase.from('quotations').insert(backupData.quotations as any);
        }
        if (backupData.installments?.length) {
          await (supabase as any).from('installments').insert(backupData.installments);
        }
        if (backupData.vouchers?.length) {
          await supabase.from('vouchers').insert(backupData.vouchers as any);
        }
        if (backupData.car_transfers?.length) {
          await supabase.from('car_transfers').insert(backupData.car_transfers as any);
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsText(file);
  });
}
