import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate authorization - accept either secret token or service role key
    const secretToken = Deno.env.get("BACKUP_SECRET_TOKEN");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("X-Backup-Token") || req.headers.get("Authorization")?.replace("Bearer ", "");

    // Allow access if:
    // 1. Valid BACKUP_SECRET_TOKEN is provided
    // 2. Service role key is provided (for cron jobs using service role)
    // 3. Request comes from Supabase internal (cron job via pg_net)
    const isValidSecretToken = secretToken && authHeader === secretToken;
    const isValidServiceRole = serviceRoleKey && authHeader === serviceRoleKey;
    const isInternalCron = req.headers.get("x-supabase-internal") === "true" || 
                           req.headers.get("user-agent")?.includes("Supabase");

    if (!isValidSecretToken && !isValidServiceRole && !isInternalCron) {
      console.error("Unauthorized backup attempt - invalid credentials");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }
    
    console.log("Authorization successful, proceeding with backup...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all companies with enabled backup schedules that are due
    const { data: schedules, error: schedulesError } = await supabase
      .from("backup_schedules")
      .select("*, companies(name)")
      .eq("is_enabled", true)
      .lte("next_backup_at", new Date().toISOString());

    if (schedulesError) {
      throw schedulesError;
    }

    console.log(`Found ${schedules?.length || 0} scheduled backups to process`);

    const results = [];

    for (const schedule of schedules || []) {
      try {
        console.log(`Processing backup for company: ${schedule.company_id}`);

        // Fetch all company data
        const backupData = await fetchCompanyData(supabase, schedule.company_id);
        const recordsCount = calculateRecordsCount(backupData);
        const fileSize = new TextEncoder().encode(JSON.stringify(backupData)).length;

        // Create backup record
        const backupName = `نسخة تلقائية - ${new Date().toLocaleDateString('ar-SA')}`;
        
        const { data: backup, error: backupError } = await supabase
          .from("backups")
          .insert({
            company_id: schedule.company_id,
            name: backupName,
            description: "نسخة احتياطية تلقائية مجدولة",
            backup_type: "automatic",
            status: "completed",
            backup_data: backupData,
            records_count: recordsCount,
            file_size: fileSize,
            completed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (backupError) {
          throw backupError;
        }

        // Calculate next backup time
        const nextBackupAt = calculateNextBackup(schedule.frequency);

        // Update schedule
        await supabase
          .from("backup_schedules")
          .update({
            last_backup_at: new Date().toISOString(),
            next_backup_at: nextBackupAt,
            updated_at: new Date().toISOString()
          })
          .eq("id", schedule.id);

        // Clean up old backups based on retention policy
        await cleanupOldBackups(supabase, schedule.company_id, schedule.retention_days);

        results.push({
          company_id: schedule.company_id,
          status: "success",
          backup_id: backup.id
        });

        console.log(`Backup completed for company: ${schedule.company_id}`);
      } catch (error) {
        console.error(`Backup failed for company ${schedule.company_id}:`, error);
        results.push({
          company_id: schedule.company_id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${results.length} backups`,
        results 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Auto backup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

async function fetchCompanyData(supabase: any, companyId: string) {
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
    supabase.from("customers").select("*").eq("company_id", companyId),
    supabase.from("suppliers").select("*").eq("company_id", companyId),
    supabase.from("cars").select("*").eq("company_id", companyId),
    supabase.from("sales").select("*").eq("company_id", companyId),
    supabase.from("sale_items").select("*, sales!inner(company_id)").eq("sales.company_id", companyId),
    supabase.from("purchase_batches").select("*").eq("company_id", companyId),
    supabase.from("journal_entries").select("*").eq("company_id", companyId),
    supabase.from("journal_entry_lines").select("*, journal_entries!inner(company_id)").eq("journal_entries.company_id", companyId),
    supabase.from("account_categories").select("*").eq("company_id", companyId),
    supabase.from("expenses").select("*").eq("company_id", companyId),
    supabase.from("quotations").select("*").eq("company_id", companyId),
    supabase.from("installments").select("*").eq("company_id", companyId),
    supabase.from("vouchers").select("*").eq("company_id", companyId),
    supabase.from("car_transfers").select("*").eq("company_id", companyId),
    supabase.from("partner_dealerships").select("*").eq("company_id", companyId)
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

function calculateRecordsCount(data: any): Record<string, number> {
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

function calculateNextBackup(frequency: string): string {
  const now = new Date();
  if (frequency === "daily") {
    now.setDate(now.getDate() + 1);
    now.setHours(3, 0, 0, 0); // 3 AM
  } else {
    now.setDate(now.getDate() + 7);
    now.setHours(3, 0, 0, 0); // 3 AM
  }
  return now.toISOString();
}

async function cleanupOldBackups(supabase: any, companyId: string, retentionDays: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const { error } = await supabase
    .from("backups")
    .delete()
    .eq("company_id", companyId)
    .eq("backup_type", "automatic")
    .lt("created_at", cutoffDate.toISOString());

  if (error) {
    console.error(`Failed to cleanup old backups for company ${companyId}:`, error);
  }
}
