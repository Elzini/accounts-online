import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = { recurringGenerated: 0, remindersCreated: 0, errors: [] as string[] };
    const today = new Date().toISOString().split("T")[0];

    // ===== 1. Process Recurring Invoices =====
    const { data: recurringInvoices, error: recErr } = await supabase
      .from("recurring_invoices")
      .select("*")
      .eq("is_active", true)
      .lte("next_due_date", today);

    if (recErr) {
      results.errors.push(`Recurring fetch error: ${recErr.message}`);
    } else if (recurringInvoices && recurringInvoices.length > 0) {
      for (const rec of recurringInvoices) {
        try {
          // Check max occurrences
          if (rec.max_occurrences && rec.generated_count >= rec.max_occurrences) {
            await supabase.from("recurring_invoices").update({ is_active: false }).eq("id", rec.id);
            continue;
          }

          // Create invoice from template
          const invoiceData = {
            company_id: rec.company_id,
            customer_id: rec.customer_id,
            supplier_id: rec.supplier_id,
            invoice_type: rec.invoice_type,
            status: rec.auto_approve ? "approved" : "draft",
            total_amount: rec.total_amount,
            issue_date: today,
            due_date: rec.next_due_date,
            notes: `${rec.notes || ""} [فاتورة دورية تلقائية #${rec.generated_count + 1}]`,
            ...(rec.template_data || {}),
          };

          const { error: invErr } = await supabase.from("invoices").insert(invoiceData);
          if (invErr) {
            results.errors.push(`Invoice create error for ${rec.id}: ${invErr.message}`);
            continue;
          }

          // Calculate next due date
          const nextDate = new Date(rec.next_due_date);
          switch (rec.frequency) {
            case "weekly": nextDate.setDate(nextDate.getDate() + 7); break;
            case "monthly": nextDate.setMonth(nextDate.getMonth() + 1); break;
            case "quarterly": nextDate.setMonth(nextDate.getMonth() + 3); break;
            case "semi_annual": nextDate.setMonth(nextDate.getMonth() + 6); break;
            case "annual": nextDate.setFullYear(nextDate.getFullYear() + 1); break;
          }

          // Check end date
          const isExpired = rec.end_date && nextDate > new Date(rec.end_date);

          await supabase.from("recurring_invoices").update({
            next_due_date: nextDate.toISOString().split("T")[0],
            last_generated_at: new Date().toISOString(),
            generated_count: rec.generated_count + 1,
            is_active: !isExpired,
          }).eq("id", rec.id);

          results.recurringGenerated++;

          // Create notification
          const { data: companyMembers } = await supabase
            .from("company_members")
            .select("user_id")
            .eq("company_id", rec.company_id);

          if (companyMembers) {
            for (const member of companyMembers) {
              await supabase.from("notifications").insert({
                user_id: member.user_id,
                company_id: rec.company_id,
                title: "فاتورة دورية تم إنشاؤها",
                message: `تم إنشاء فاتورة دورية بقيمة ${rec.total_amount} ر.س (${rec.auto_approve ? "معتمدة" : "مسودة"})`,
                type: "info",
              });
            }
          }
        } catch (e) {
          results.errors.push(`Recurring ${rec.id}: ${e instanceof Error ? e.message : "Unknown"}`);
        }
      }
    }

    // ===== 2. Process Collection Reminders =====
    // Get all active reminder rules grouped by company
    const { data: rules, error: rulesErr } = await supabase
      .from("collection_reminder_rules")
      .select("*")
      .eq("is_active", true)
      .order("escalation_level");

    if (rulesErr) {
      results.errors.push(`Rules fetch error: ${rulesErr.message}`);
    } else if (rules && rules.length > 0) {
      // Get unique company IDs
      const companyIds = [...new Set(rules.map((r: any) => r.company_id))];

      for (const compId of companyIds) {
        const companyRules = rules.filter((r: any) => r.company_id === compId);

        // Get overdue invoices for this company
        const { data: overdueInvoices } = await supabase
          .from("invoices")
          .select("id, customer_id, total_amount, due_date, invoice_number, paid_amount")
          .eq("company_id", compId)
          .eq("status", "approved")
          .eq("invoice_type", "sale")
          .lte("due_date", today);

        if (!overdueInvoices || overdueInvoices.length === 0) continue;

        for (const invoice of overdueInvoices) {
          const remainingAmount = (invoice.total_amount || 0) - (invoice.paid_amount || 0);
          if (remainingAmount <= 0) continue;

          const dueDate = new Date(invoice.due_date);
          const todayDate = new Date(today);
          const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

          for (const rule of companyRules) {
            // Check if this rule applies based on days
            if (rule.reminder_type === "overdue" && daysOverdue === rule.days_offset) {
              // Check if reminder already sent for this invoice + rule
              const { data: existing } = await supabase
                .from("collection_reminders")
                .select("id")
                .eq("invoice_id", invoice.id)
                .eq("reminder_type", rule.reminder_type)
                .eq("days_offset", rule.days_offset)
                .eq("escalation_level", rule.escalation_level)
                .limit(1);

              if (existing && existing.length > 0) continue;

              // Create reminder
              const { error: remErr } = await supabase.from("collection_reminders").insert({
                company_id: compId,
                customer_id: invoice.customer_id,
                invoice_id: invoice.id,
                reminder_type: rule.reminder_type,
                days_offset: rule.days_offset,
                amount_due: remainingAmount,
                reminder_method: rule.reminder_method,
                escalation_level: rule.escalation_level,
                status: rule.reminder_method === "notification" ? "sent" : "pending",
                sent_at: rule.reminder_method === "notification" ? new Date().toISOString() : null,
              });

              if (remErr) {
                results.errors.push(`Reminder create error: ${remErr.message}`);
              } else {
                results.remindersCreated++;

                // If notification method, create system notification
                if (rule.reminder_method === "notification") {
                  const { data: members } = await supabase
                    .from("company_members")
                    .select("user_id")
                    .eq("company_id", compId);

                  if (members) {
                    for (const m of members) {
                      await supabase.from("notifications").insert({
                        user_id: m.user_id,
                        company_id: compId,
                        title: `⚠️ تذكير تحصيل - مستوى ${rule.escalation_level}`,
                        message: `فاتورة ${invoice.invoice_number || invoice.id} متأخرة ${daysOverdue} يوم - المبلغ المتبقي: ${remainingAmount.toLocaleString()} ر.س`,
                        type: rule.escalation_level >= 3 ? "danger" : rule.escalation_level >= 2 ? "warning" : "info",
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-automation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
