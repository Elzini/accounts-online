import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const targetCompanyId = body.company_id;

    // Get all active companies or a specific one
    let companies: { id: string }[] = [];
    if (targetCompanyId) {
      companies = [{ id: targetCompanyId }];
    } else {
      const { data } = await supabase.from('companies').select('id').eq('is_active', true);
      companies = data || [];
    }

    const results: any[] = [];

    for (const company of companies) {
      const companyId = company.id;
      const notifications: any[] = [];

      // Get company users to send notifications to
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('company_id', companyId);
      const userIds = (profiles || []).map(p => p.user_id);
      if (userIds.length === 0) continue;

      // === 1. Overdue Credit Invoices ===
      const overdueDate30 = new Date();
      overdueDate30.setDate(overdueDate30.getDate() - 30);

      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, customer_name, total_amount, invoice_date')
        .eq('company_id', companyId)
        .eq('payment_method', 'credit')
        .neq('status', 'paid')
        .lte('invoice_date', overdueDate30.toISOString().split('T')[0]);

      for (const inv of overdueInvoices || []) {
        const days = Math.floor((Date.now() - new Date(inv.invoice_date).getTime()) / 86400000);
        notifications.push({
          type: 'warning',
          title: `فاتورة متأخرة: ${inv.customer_name}`,
          message: `الفاتورة ${inv.invoice_number || ''} بمبلغ ${Number(inv.total_amount).toLocaleString()} ر.س متأخرة ${days} يوم`,
          entity_type: 'invoice',
          entity_id: inv.id,
          category: 'overdue_invoice',
        });
      }

      // === 2. Overdue Credit Sales (Car Dealership) ===
      const { data: overdueSales } = await supabase
        .from('sales')
        .select('id, sale_number, customer_name, sale_price, sale_date')
        .eq('company_id', companyId)
        .eq('payment_method', 'credit')
        .lte('sale_date', overdueDate30.toISOString().split('T')[0]);

      for (const sale of overdueSales || []) {
        const days = Math.floor((Date.now() - new Date(sale.sale_date).getTime()) / 86400000);
        notifications.push({
          type: 'warning',
          title: `بيع آجل متأخر: ${sale.customer_name}`,
          message: `البيع ${sale.sale_number || ''} بمبلغ ${Number(sale.sale_price).toLocaleString()} ر.س متأخر ${days} يوم`,
          entity_type: 'sale',
          entity_id: sale.id,
          category: 'overdue_sale',
        });
      }

      // === 3. Upcoming Installments (Due in 7 days) ===
      const in7Days = new Date();
      in7Days.setDate(in7Days.getDate() + 7);
      const today = new Date().toISOString().split('T')[0];

      const { data: upcomingInstallments } = await supabase
        .from('installments')
        .select('id, customer_name, amount, due_date')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .gte('due_date', today)
        .lte('due_date', in7Days.toISOString().split('T')[0]);

      for (const inst of upcomingInstallments || []) {
        const daysUntil = Math.floor((new Date(inst.due_date).getTime() - Date.now()) / 86400000);
        notifications.push({
          type: 'info',
          title: `قسط قادم: ${inst.customer_name}`,
          message: `قسط بمبلغ ${Number(inst.amount).toLocaleString()} ر.س مستحق خلال ${daysUntil} يوم (${inst.due_date})`,
          entity_type: 'installment',
          entity_id: inst.id,
          category: 'upcoming_installment',
        });
      }

      // === 4. Overdue Installments ===
      const { data: overdueInstallments } = await supabase
        .from('installments')
        .select('id, customer_name, amount, due_date')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .lt('due_date', today);

      for (const inst of overdueInstallments || []) {
        const days = Math.floor((Date.now() - new Date(inst.due_date).getTime()) / 86400000);
        notifications.push({
          type: 'danger',
          title: `قسط متأخر: ${inst.customer_name}`,
          message: `قسط بمبلغ ${Number(inst.amount).toLocaleString()} ر.س متأخر ${days} يوم`,
          entity_type: 'installment',
          entity_id: inst.id,
          category: 'overdue_installment',
        });
      }

      // === 5. Checks Maturing Soon (7 days) ===
      const { data: maturingChecks } = await supabase
        .from('checks')
        .select('id, check_number, amount, due_date, check_type, drawer_name, payee_name')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .gte('due_date', today)
        .lte('due_date', in7Days.toISOString().split('T')[0]);

      for (const chk of maturingChecks || []) {
        const daysUntil = Math.floor((new Date(chk.due_date).getTime() - Date.now()) / 86400000);
        const name = chk.check_type === 'received' ? chk.drawer_name : chk.payee_name;
        notifications.push({
          type: 'info',
          title: `شيك يستحق قريباً: ${chk.check_number}`,
          message: `شيك ${chk.check_type === 'received' ? 'وارد' : 'صادر'} بمبلغ ${Number(chk.amount).toLocaleString()} ر.س يستحق خلال ${daysUntil} يوم - ${name || ''}`,
          entity_type: 'check',
          entity_id: chk.id,
          category: 'maturing_check',
        });
      }

      // === 6. Low Inventory - Adapt based on company type ===
      // Get company type to customize inventory alerts
      const { data: companyData } = await supabase
        .from('companies')
        .select('company_type')
        .eq('id', companyId)
        .single();

      const companyType = companyData?.company_type || '';
      const isCarDealership = ['car_dealership', 'used_cars', 'new_cars'].includes(companyType);

      if (isCarDealership) {
        const { count: carCount } = await supabase
          .from('cars')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('status', 'available');

        if (carCount !== null && carCount < 5 && carCount >= 0) {
          notifications.push({
            type: carCount === 0 ? 'danger' : 'warning',
            title: 'تنبيه المخزون',
            message: carCount === 0
              ? 'لا توجد سيارات متاحة في المخزون!'
              : `المخزون منخفض: ${carCount} سيارات متاحة فقط`,
            entity_type: 'inventory',
            entity_id: null,
            category: 'low_inventory',
          });
        }
      }

      // === 7. Items Low Stock (Inventory Module) ===
      const { data: lowStockItems } = await supabase
        .from('items_catalog')
        .select('id, name, current_stock, minimum_stock')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .not('minimum_stock', 'is', null);

      for (const item of lowStockItems || []) {
        if (item.current_stock !== null && item.minimum_stock !== null && item.current_stock <= item.minimum_stock) {
          notifications.push({
            type: item.current_stock === 0 ? 'danger' : 'warning',
            title: `نفاد صنف: ${item.name}`,
            message: item.current_stock === 0
              ? `الصنف "${item.name}" نفد من المخزون!`
              : `الصنف "${item.name}" وصل للحد الأدنى (${item.current_stock} من ${item.minimum_stock})`,
            entity_type: 'item',
            entity_id: item.id,
            category: 'low_stock',
          });
        }
      }

      // === 8. Employee Contracts Expiring (30 days) ===
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);

      const { data: expiringContracts } = await supabase
        .from('employee_contracts')
        .select('id, employee_name, contract_type, end_date')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .lte('end_date', in30Days.toISOString().split('T')[0])
        .gte('end_date', today);

      for (const contract of expiringContracts || []) {
        const daysUntil = Math.floor((new Date(contract.end_date).getTime() - Date.now()) / 86400000);
        notifications.push({
          type: 'warning',
          title: `عقد ينتهي قريباً: ${contract.employee_name}`,
          message: `عقد ${contract.contract_type || ''} ينتهي خلال ${daysUntil} يوم (${contract.end_date})`,
          entity_type: 'employee_contract',
          entity_id: contract.id,
          category: 'expiring_contract',
        });
      }

      // === 9. Subscription Renewals (7 days) ===
      const { data: expiringSubscriptions } = await supabase
        .from('subscriptions')
        .select('id, customer_name, plan_name, end_date')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .lte('end_date', in7Days.toISOString().split('T')[0])
        .gte('end_date', today);

      for (const sub of expiringSubscriptions || []) {
        const daysUntil = Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000);
        notifications.push({
          type: 'info',
          title: `اشتراك ينتهي: ${sub.customer_name}`,
          message: `اشتراك "${sub.plan_name}" ينتهي خلال ${daysUntil} يوم`,
          entity_type: 'subscription',
          entity_id: sub.id,
          category: 'expiring_subscription',
        });
      }

      // === Insert notifications (avoid duplicates by checking recent ones) ===
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data: recentNotifs } = await supabase
        .from('notifications')
        .select('entity_id, entity_type')
        .eq('company_id', companyId)
        .gte('created_at', oneDayAgo.toISOString());

      const recentSet = new Set(
        (recentNotifs || []).map(n => `${n.entity_type}:${n.entity_id}`)
      );

      let insertedCount = 0;
      for (const notif of notifications) {
        const key = `${notif.entity_type}:${notif.entity_id}`;
        if (notif.entity_id && recentSet.has(key)) continue; // Skip duplicate

        // Insert for all company users
        for (const userId of userIds) {
          await supabase.from('notifications').insert({
            company_id: companyId,
            user_id: userId,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            entity_type: notif.entity_type,
            entity_id: notif.entity_id,
            is_read: false,
          });
        }
        insertedCount++;
      }

      results.push({
        company_id: companyId,
        total_alerts: notifications.length,
        inserted: insertedCount,
        skipped_duplicates: notifications.length - insertedCount,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      companies_processed: results.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("smart-notifications error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
