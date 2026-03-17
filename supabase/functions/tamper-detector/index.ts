import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Critical financial tables and the fields to hash
const MONITORED_TABLES: Record<string, { hashFields: string[]; companyField: string }> = {
  invoices: {
    hashFields: ["id", "invoice_number", "invoice_type", "subtotal", "discount_amount", "taxable_amount", "vat_rate", "vat_amount", "total", "amount_paid", "status", "customer_id", "supplier_id", "payment_account_id", "invoice_date"],
    companyField: "company_id",
  },
  invoice_items: {
    hashFields: ["id", "invoice_id", "quantity", "unit_price", "discount_percent", "discount_amount", "taxable_amount", "vat_rate", "vat_amount", "total", "account_id"],
    companyField: "", // joined via invoice
  },
  journal_entries: {
    hashFields: ["id", "entry_number", "entry_date", "total_debit", "total_credit", "status", "reference_type", "reference_id"],
    companyField: "company_id",
  },
  journal_entry_lines: {
    hashFields: ["id", "journal_entry_id", "account_id", "debit", "credit", "description"],
    companyField: "", // joined via journal_entry
  },
  account_categories: {
    hashFields: ["id", "code", "name", "type", "is_system"],
    companyField: "company_id",
  },
  checks: {
    hashFields: ["id", "check_number", "check_type", "amount", "status", "due_date", "issue_date", "bank_account_id"],
    companyField: "company_id",
  },
  expenses: {
    hashFields: ["id", "amount", "expense_date", "category_id", "payment_method"],
    companyField: "company_id",
  },
  vouchers: {
    hashFields: ["id", "voucher_number", "voucher_type", "total_amount", "status", "voucher_date"],
    companyField: "company_id",
  },
  app_settings: {
    hashFields: ["id", "key", "value"],
    companyField: "company_id",
  },
};

async function computeHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function extractHashFields(record: any, fields: string[]): Record<string, any> {
  const snapshot: Record<string, any> = {};
  for (const field of fields) {
    snapshot[field] = record[field] ?? null;
  }
  return snapshot;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse request
    const body = await req.json().catch(() => ({}));
    const scanType = body.scan_type || "scheduled";
    const triggeredBy = body.triggered_by || null;

    console.log(`[TamperDetector] Starting ${scanType} scan...`);

    // Create scan run record
    const { data: scanRun, error: scanError } = await supabase
      .from("tamper_scan_runs")
      .insert({
        scan_type: scanType,
        triggered_by: triggeredBy,
        status: "running",
      })
      .select()
      .single();

    if (scanError) {
      console.error("Failed to create scan run:", scanError);
      throw scanError;
    }

    let totalChecked = 0;
    let mismatches = 0;
    let newRecords = 0;
    const tamperEvents: any[] = [];

    // Process each monitored table
    for (const [tableName, config] of Object.entries(MONITORED_TABLES)) {
      try {
        console.log(`[TamperDetector] Scanning table: ${tableName}`);

        // Fetch all records from the table
        const { data: records, error: fetchError } = await supabase
          .from(tableName)
          .select("*")
          .limit(10000);

        if (fetchError) {
          console.error(`Error fetching ${tableName}:`, fetchError);
          continue;
        }

        if (!records || records.length === 0) continue;

        // Fetch existing hashes for this table
        const { data: existingHashes } = await supabase
          .from("integrity_hashes")
          .select("record_id, hash_value, fields_snapshot")
          .eq("table_name", tableName);

        const hashMap = new Map(
          (existingHashes || []).map((h: any) => [h.record_id, h])
        );

        const upsertBatch: any[] = [];

        for (const record of records) {
          totalChecked++;
          const snapshot = extractHashFields(record, config.hashFields);
          const hashInput = JSON.stringify(snapshot, Object.keys(snapshot).sort());
          const currentHash = await computeHash(hashInput);
          const companyId = config.companyField ? record[config.companyField] : (record.company_id || "system");

          const existing = hashMap.get(record.id);

          if (existing) {
            // Compare hashes
            if (existing.hash_value !== currentHash) {
              mismatches++;
              console.warn(
                `[TAMPER DETECTED] ${tableName}.${record.id} hash mismatch!`
              );

              // Record tamper event
              tamperEvents.push({
                table_name: tableName,
                record_id: record.id,
                company_id: companyId,
                previous_hash: existing.hash_value,
                current_hash: currentHash,
                severity: ["invoices", "journal_entries", "journal_entry_lines"].includes(tableName)
                  ? "critical"
                  : "high",
                status: "detected",
                fields_before: existing.fields_snapshot,
                fields_after: snapshot,
              });

              // Update hash to current (so we detect NEXT change)
              upsertBatch.push({
                table_name: tableName,
                record_id: record.id,
                company_id: companyId,
                hash_value: currentHash,
                fields_snapshot: snapshot,
                computed_at: new Date().toISOString(),
                is_valid: false,
              });
            } else {
              // Hash matches - mark as verified
              upsertBatch.push({
                table_name: tableName,
                record_id: record.id,
                company_id: companyId,
                hash_value: currentHash,
                fields_snapshot: snapshot,
                verified_at: new Date().toISOString(),
                is_valid: true,
              });
            }
          } else {
            // New record - store initial hash
            newRecords++;
            upsertBatch.push({
              table_name: tableName,
              record_id: record.id,
              company_id: companyId,
              hash_value: currentHash,
              fields_snapshot: snapshot,
              computed_at: new Date().toISOString(),
              is_valid: true,
            });
          }
        }

        // Batch upsert hashes (in chunks of 500)
        for (let i = 0; i < upsertBatch.length; i += 500) {
          const chunk = upsertBatch.slice(i, i + 500);
          const { error: upsertError } = await supabase
            .from("integrity_hashes")
            .upsert(chunk, { onConflict: "table_name,record_id" });

          if (upsertError) {
            console.error(`Error upserting hashes for ${tableName}:`, upsertError);
          }
        }
      } catch (tableError) {
        console.error(`Error processing table ${tableName}:`, tableError);
      }
    }

    // Insert tamper events
    if (tamperEvents.length > 0) {
      // Run impact analysis for each tampered record
      for (const event of tamperEvents) {
        event.impact_analysis = await runImpactAnalysis(
          supabase,
          event.table_name,
          event.record_id,
          event.company_id,
          event.fields_before,
          event.fields_after
        );
      }

      const { error: eventsError } = await supabase
        .from("tamper_detection_events")
        .insert(tamperEvents);

      if (eventsError) {
        console.error("Error inserting tamper events:", eventsError);
      }

      // Log to audit_logs
      for (const event of tamperEvents) {
        await supabase.from("audit_logs").insert({
          action: "tamper_detected",
          entity_type: event.table_name,
          entity_id: event.record_id,
          company_id: event.company_id !== "system" ? event.company_id : null,
          user_id: "00000000-0000-0000-0000-000000000000",
          old_data: event.fields_before,
          new_data: event.fields_after,
        });
      }

      // Create notification for super admins
      await supabase.from("notifications").insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        title: `🚨 تنبيه أمني: اكتشاف ${tamperEvents.length} تعديل غير مصرح به`,
        message: `تم اكتشاف تعديلات مشبوهة في ${[...new Set(tamperEvents.map(e => e.table_name))].join(", ")}. يرجى المراجعة فوراً.`,
        type: "security",
        is_read: false,
      }).then(() => {}).catch(() => {});
    }

    // Update scan run
    await supabase
      .from("tamper_scan_runs")
      .update({
        completed_at: new Date().toISOString(),
        total_records_checked: totalChecked,
        mismatches_found: mismatches,
        new_records_hashed: newRecords,
        status: mismatches > 0 ? "tampering_detected" : "clean",
      })
      .eq("id", scanRun.id);

    const result = {
      scan_id: scanRun.id,
      total_records_checked: totalChecked,
      mismatches_found: mismatches,
      new_records_hashed: newRecords,
      status: mismatches > 0 ? "tampering_detected" : "clean",
      tamper_events: tamperEvents.length,
    };

    console.log(`[TamperDetector] Scan complete:`, JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[TamperDetector] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

async function runImpactAnalysis(
  supabase: any,
  tableName: string,
  recordId: string,
  companyId: string,
  fieldsBefore: any,
  fieldsAfter: any
): Promise<any> {
  const impact: any = {
    affected_areas: [],
    financial_impact: {},
    risk_level: "high",
  };

  try {
    if (tableName === "invoices") {
      // Check impact on trial balance and VAT
      const beforeTotal = Number(fieldsBefore?.total || 0);
      const afterTotal = Number(fieldsAfter?.total || 0);
      const diff = afterTotal - beforeTotal;
      const vatBefore = Number(fieldsBefore?.vat_amount || 0);
      const vatAfter = Number(fieldsAfter?.vat_amount || 0);
      const vatDiff = vatAfter - vatBefore;

      impact.affected_areas = ["فواتير البيع/الشراء", "ميزان المراجعة", "إقرار ضريبة القيمة المضافة", "أرصدة الحسابات"];
      impact.financial_impact = {
        total_difference: diff,
        vat_difference: vatDiff,
        invoice_type: fieldsAfter?.invoice_type,
        status_changed: fieldsBefore?.status !== fieldsAfter?.status,
      };
      impact.risk_level = Math.abs(diff) > 10000 ? "critical" : "high";
    } else if (tableName === "journal_entries" || tableName === "journal_entry_lines") {
      const debitBefore = Number(fieldsBefore?.debit || fieldsBefore?.total_debit || 0);
      const debitAfter = Number(fieldsAfter?.debit || fieldsAfter?.total_debit || 0);
      const creditBefore = Number(fieldsBefore?.credit || fieldsBefore?.total_credit || 0);
      const creditAfter = Number(fieldsAfter?.credit || fieldsAfter?.total_credit || 0);

      impact.affected_areas = ["قيود اليومية", "دفتر الأستاذ", "ميزان المراجعة", "القوائم المالية"];
      impact.financial_impact = {
        debit_difference: debitAfter - debitBefore,
        credit_difference: creditAfter - creditBefore,
        balance_impact: (debitAfter - creditAfter) - (debitBefore - creditBefore),
      };
      impact.risk_level = "critical";
    } else if (tableName === "account_categories") {
      impact.affected_areas = ["شجرة الحسابات", "ميزان المراجعة", "القوائم المالية"];
      impact.risk_level = fieldsBefore?.type !== fieldsAfter?.type ? "critical" : "medium";
    } else if (tableName === "checks") {
      const amountDiff = Number(fieldsAfter?.amount || 0) - Number(fieldsBefore?.amount || 0);
      impact.affected_areas = ["الشيكات", "أرصدة البنوك", "ميزان المراجعة"];
      impact.financial_impact = { amount_difference: amountDiff };
    } else if (tableName === "vouchers") {
      impact.affected_areas = ["سندات القبض/الصرف", "أرصدة الحسابات"];
    } else if (tableName === "expenses") {
      impact.affected_areas = ["المصروفات", "تقرير الأرباح", "ميزان المراجعة"];
    } else if (tableName === "app_settings") {
      impact.affected_areas = ["إعدادات النظام"];
      impact.risk_level = "medium";
    }

    // Count related records affected
    if (companyId && companyId !== "system") {
      const { count: invoiceCount } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);
      
      const { count: jeCount } = await supabase
        .from("journal_entries")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      impact.company_scope = {
        total_invoices: invoiceCount || 0,
        total_journal_entries: jeCount || 0,
      };
    }
  } catch (e) {
    console.error("Impact analysis error:", e);
  }

  return impact;
}
