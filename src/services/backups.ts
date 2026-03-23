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
  // Universal tables
  customers: any[];
  suppliers: any[];
  journal_entries: any[];
  journal_entry_lines: any[];
  account_categories: any[];
  expenses: any[];
  quotations: any[];
  installments: any[];
  vouchers: any[];
  invoices: any[];
  invoice_items: any[];
  // Car dealership specific (optional)
  cars?: any[];
  sales?: any[];
  sale_items?: any[];
  purchase_batches?: any[];
  car_transfers?: any[];
  partner_dealerships?: any[];
}

async function getCompanyType(companyId: string): Promise<string | null> {
  const { data } = await supabase
    .from('companies')
    .select('company_type')
    .eq('id', companyId)
    .maybeSingle();
  return data?.company_type || null;
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
    const backupData = await fetchAllData(companyId);
    const recordsCount = calculateRecordsCount(backupData);
    const fileSize = new Blob([JSON.stringify(backupData)]).size;

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
  const companyType = await getCompanyType(companyId);
  const isCarDealership = getIndustryFeatures(companyType).hasCarInventory;

  // Universal queries
  const universalQueries = [
    supabase.from('customers').select('*').eq('company_id', companyId),
    supabase.from('suppliers').select('*').eq('company_id', companyId),
    supabase.from('journal_entries').select('*').eq('company_id', companyId),
    supabase.from('journal_entry_lines').select('*, journal_entries!inner(company_id)').eq('journal_entries.company_id', companyId),
    supabase.from('account_categories').select('*').eq('company_id', companyId),
    supabase.from('expenses').select('*').eq('company_id', companyId),
    supabase.from('quotations').select('*').eq('company_id', companyId),
    (supabase as any).from('installments').select('*').eq('company_id', companyId),
    supabase.from('vouchers').select('*').eq('company_id', companyId),
    supabase.from('invoices').select('*').eq('company_id', companyId),
    supabase.from('invoice_items').select('*, invoices!inner(company_id)').eq('invoices.company_id', companyId),
  ];

  const [
    customers, suppliers, journalEntries, journalEntryLines,
    accountCategories, expenses, quotations, installments,
    vouchers, invoices, invoiceItems
  ] = await Promise.all(universalQueries);

  const backupData: BackupData = {
    customers: customers.data || [],
    suppliers: suppliers.data || [],
    journal_entries: journalEntries.data || [],
    journal_entry_lines: journalEntryLines.data || [],
    account_categories: accountCategories.data || [],
    expenses: expenses.data || [],
    quotations: quotations.data || [],
    installments: installments.data || [],
    vouchers: vouchers.data || [],
    invoices: invoices.data || [],
    invoice_items: invoiceItems.data || [],
  };

  // Car dealership specific tables
  if (isCarDealership) {
    const [cars, sales, saleItems, purchaseBatches, carTransfers, partnerDealerships] = await Promise.all([
      supabase.from('cars').select('*').eq('company_id', companyId),
      supabase.from('sales').select('*').eq('company_id', companyId),
      supabase.from('sale_items').select('*, sales!inner(company_id)').eq('sales.company_id', companyId),
      supabase.from('purchase_batches').select('*').eq('company_id', companyId),
      supabase.from('car_transfers').select('*').eq('company_id', companyId),
      supabase.from('partner_dealerships').select('*').eq('company_id', companyId),
    ]);

    backupData.cars = cars.data || [];
    backupData.sales = sales.data || [];
    backupData.sale_items = saleItems.data || [];
    backupData.purchase_batches = purchaseBatches.data || [];
    backupData.car_transfers = carTransfers.data || [];
    backupData.partner_dealerships = partnerDealerships.data || [];
  }

  return backupData;
}

function calculateRecordsCount(data: BackupData): Record<string, number> {
  const counts: Record<string, number> = {
    customers: data.customers.length,
    suppliers: data.suppliers.length,
    journal_entries: data.journal_entries.length,
    journal_entry_lines: data.journal_entry_lines.length,
    account_categories: data.account_categories.length,
    expenses: data.expenses.length,
    quotations: data.quotations.length,
    installments: data.installments.length,
    vouchers: data.vouchers.length,
    invoices: data.invoices.length,
    invoice_items: data.invoice_items.length,
  };

  // Car-specific counts (only if present)
  if (data.cars) counts.cars = data.cars.length;
  if (data.sales) counts.sales = data.sales.length;
  if (data.sale_items) counts.sale_items = data.sale_items.length;
  if (data.purchase_batches) counts.purchase_batches = data.purchase_batches.length;
  if (data.car_transfers) counts.car_transfers = data.car_transfers.length;
  if (data.partner_dealerships) counts.partner_dealerships = data.partner_dealerships.length;

  return counts;
}

async function deleteCompanyScopedChildRows(companyId: string) {
  // Delete invoice items
  const { data: invoiceRows } = await supabase
    .from('invoices')
    .select('id')
    .eq('company_id', companyId);
  const invoiceIds = (invoiceRows || []).map((row) => row.id);
  if (invoiceIds.length > 0) {
    await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds);
  }

  // Delete sale items (car dealership)
  const { data: salesRows } = await supabase
    .from('sales')
    .select('id')
    .eq('company_id', companyId);
  const saleIds = (salesRows || []).map((row) => row.id);
  if (saleIds.length > 0) {
    await supabase.from('sale_items').delete().in('sale_id', saleIds);
  }

  // Delete journal entry lines
  const { data: journalRows } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('company_id', companyId);
  const journalIds = (journalRows || []).map((row) => row.id);
  if (journalIds.length > 0) {
    await supabase.from('journal_entry_lines').delete().in('journal_entry_id', journalIds);
  }
}

export async function deleteBackup(backupId: string): Promise<void> {
  const { error } = await supabase
    .from('backups')
    .delete()
    .eq('id', backupId);

  if (error) throw error;
}

export async function restoreBackup(backupId: string, companyId: string): Promise<void> {
  const { data: backup, error } = await supabase
    .from('backups')
    .select('backup_data')
    .eq('id', backupId)
    .single();

  if (error) throw error;
  if (!backup?.backup_data) throw new Error('لا توجد بيانات في النسخة الاحتياطية');

  const backupData = backup.backup_data as unknown as BackupData;
  await restoreData(companyId, backupData);
}

async function restoreData(companyId: string, backupData: BackupData): Promise<void> {
  // Delete existing data (company-scoped only, in FK-safe order)
  await deleteCompanyScopedChildRows(companyId);
  
  // Delete parent tables
  await supabase.from('invoices').delete().eq('company_id', companyId);
  await supabase.from('journal_entries').delete().eq('company_id', companyId);
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

  // Restore data (in correct FK order)
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
  if (backupData.invoices?.length) {
    await supabase.from('invoices').insert(backupData.invoices as any);
  }
  if (backupData.invoice_items?.length) {
    await supabase.from('invoice_items').insert(backupData.invoice_items as any);
  }
  if (backupData.car_transfers?.length) {
    await supabase.from('car_transfers').insert(backupData.car_transfers as any);
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
        
        // Validate backup data structure - check for any valid data
        if (!backupData.customers && !backupData.invoices && !backupData.journal_entries && !backupData.cars) {
          throw new Error('ملف النسخة الاحتياطية غير صالح');
        }

        await restoreData(companyId, backupData);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsText(file);
  });
}
