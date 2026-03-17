import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const {
      change_type = 'system_config',
      affected_module = 'غير محدد',
      description = 'تغيير تم اكتشافه في النظام',
      request_source = 'system',
      previous_value = null,
      new_value = null,
      affected_tables = [],
    } = body;

    // Run impact analysis by counting records in financial tables
    const [salesRes, purchaseRes, journalRes, accountsRes] = await Promise.all([
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('invoice_type', 'sales'),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('invoice_type', 'purchase'),
      supabase.from('journal_entries').select('id', { count: 'exact', head: true }),
      supabase.from('account_categories').select('id', { count: 'exact', head: true }),
    ]);

    const impact_analysis = {
      sales_invoices: salesRes.count || 0,
      purchase_invoices: purchaseRes.count || 0,
      journal_entries: journalRes.count || 0,
      account_balances_affected: accountsRes.count || 0,
      trial_balance_impact: (salesRes.count || 0) + (purchaseRes.count || 0) > 0 ? 'متأثر' : 'لا تأثير',
      vat_reports_impact: (salesRes.count || 0) + (purchaseRes.count || 0) > 0 ? 'يتطلب إعادة احتساب' : 'لا تأثير',
    };

    // Insert the alert
    const { data: alert, error } = await supabase
      .from('system_change_alerts')
      .insert({
        change_type,
        affected_module,
        description,
        request_source,
        previous_value,
        new_value,
        affected_tables,
        impact_analysis,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, alert }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
