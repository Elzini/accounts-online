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

    const { company_id, days_overdue = 30 } = await req.json();
    if (!company_id) {
      return new Response(JSON.stringify({ error: "company_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - days_overdue);

    // Get overdue sales (car dealership)
    const { data: overdueSales, error: salesError } = await supabase
      .from('sales')
      .select('id, sale_number, customer_name, sale_price, sale_date, payment_method')
      .eq('company_id', company_id)
      .eq('payment_method', 'credit')
      .lte('sale_date', overdueDate.toISOString().split('T')[0])
      .order('sale_date', { ascending: true });

    // Get overdue invoices (general)
    const { data: overdueInvoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, customer_name, total_amount, invoice_date, payment_method, status')
      .eq('company_id', company_id)
      .eq('payment_method', 'credit')
      .neq('status', 'paid')
      .lte('invoice_date', overdueDate.toISOString().split('T')[0])
      .order('invoice_date', { ascending: true });

    const allOverdue = [
      ...(overdueSales || []).map(s => ({
        type: 'sale',
        number: s.sale_number,
        customer: s.customer_name,
        amount: s.sale_price,
        date: s.sale_date,
        daysOverdue: Math.floor((Date.now() - new Date(s.sale_date).getTime()) / (1000 * 60 * 60 * 24)),
      })),
      ...(overdueInvoices || []).map(inv => ({
        type: 'invoice',
        number: inv.invoice_number,
        customer: inv.customer_name,
        amount: inv.total_amount,
        date: inv.invoice_date,
        daysOverdue: Math.floor((Date.now() - new Date(inv.invoice_date).getTime()) / (1000 * 60 * 60 * 24)),
      })),
    ];

    // Store notifications in the database
    for (const item of allOverdue) {
      await supabase.from('notifications').insert({
        company_id,
        type: 'overdue_invoice',
        title: `فاتورة متأخرة: ${item.customer}`,
        message: `الفاتورة رقم ${item.number} بمبلغ ${item.amount} ر.س متأخرة ${item.daysOverdue} يوم`,
        data: JSON.stringify(item),
        is_read: false,
      }).single();
    }

    return new Response(JSON.stringify({
      success: true,
      totalOverdue: allOverdue.length,
      totalAmount: allOverdue.reduce((sum, i) => sum + (i.amount || 0), 0),
      items: allOverdue,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("overdue-invoices-notify error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
