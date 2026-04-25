// Edge function for one-time bulk seeding of invoices + journal entries
// Used to seed Café Dakka February 2026 sales (admin-only, service role)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvoiceItem {
  name: string;
  qty: number;
  unit: number;
  total: number;
}
interface InvoiceData {
  idx: number;
  date: string;
  time: string;
  customer: string;
  net: number;
  vat: number;
  total: number;
  items: InvoiceItem[];
}
interface Payload {
  company_id: string;
  fiscal_year_id: string;
  cash_account_id: string;
  revenue_account_id: string;
  vat_account_id: string;
  invoice_prefix: string;
  je_start: number;
  invoices: InvoiceData[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const body: Payload = await req.json();
    const {
      company_id,
      fiscal_year_id,
      cash_account_id,
      revenue_account_id,
      vat_account_id,
      invoice_prefix,
      je_start,
      invoices,
    } = body;

    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      const inv_no = `${invoice_prefix}-${inv.idx}`;
      const je_num = je_start + i;
      const ts = `${inv.date}T${inv.time}+00:00`;

      // 1) Insert invoice
      const { data: invRow, error: invErr } = await supabase
        .from("invoices")
        .insert({
          company_id,
          fiscal_year_id,
          invoice_number: inv_no,
          invoice_type: "sales",
          invoice_date: inv.date,
          customer_name: inv.customer,
          subtotal: inv.net,
          taxable_amount: inv.net,
          vat_rate: 15,
          vat_amount: inv.vat,
          total: inv.total,
          amount_paid: inv.total,
          payment_status: "paid",
          payment_method: "cash",
          status: "issued",
          payment_account_id: cash_account_id,
          price_includes_tax: true,
          notes: "فاتورة نقدية - مقهى دكة",
          created_at: ts,
        })
        .select("id")
        .single();
      if (invErr) {
        errors.push(`inv ${inv_no}: ${invErr.message}`);
        continue;
      }

      // 2) Insert journal entry
      const { data: jeRow, error: jeErr } = await supabase
        .from("journal_entries")
        .insert({
          company_id,
          fiscal_year_id,
          entry_number: je_num,
          entry_date: inv.date,
          description: `قيد فاتورة مبيعات ${inv_no}`,
          total_debit: inv.total,
          total_credit: inv.total,
          is_posted: true,
          reference_type: "invoice_sale",
          reference_id: invRow.id,
          created_at: ts,
        })
        .select("id")
        .single();
      if (jeErr) {
        errors.push(`je ${inv_no}: ${jeErr.message}`);
        continue;
      }

      // 3) Update invoice with je id
      await supabase
        .from("invoices")
        .update({ journal_entry_id: jeRow.id })
        .eq("id", invRow.id);

      // 4) Insert invoice items
      const itemsPayload = inv.items.map((it) => ({
        invoice_id: invRow.id,
        company_id,
        item_description: it.name,
        quantity: it.qty,
        unit_price: it.unit,
        taxable_amount: it.total,
        vat_rate: 15,
        vat_amount: Math.round(it.total * 0.15 * 100) / 100,
        total: Math.round(it.total * 1.15 * 100) / 100,
      }));
      const { error: itemsErr } = await supabase
        .from("invoice_items")
        .insert(itemsPayload);
      if (itemsErr) errors.push(`items ${inv_no}: ${itemsErr.message}`);

      // 5) Insert journal entry lines (cash dr, revenue cr, vat cr)
      const linesPayload = [
        {
          journal_entry_id: jeRow.id,
          company_id,
          account_id: cash_account_id,
          description: `الصندوق - ${inv_no}`,
          debit: inv.total,
          credit: 0,
        },
        {
          journal_entry_id: jeRow.id,
          company_id,
          account_id: revenue_account_id,
          description: `مبيعات المشروبات - ${inv_no}`,
          debit: 0,
          credit: inv.net,
        },
        {
          journal_entry_id: jeRow.id,
          company_id,
          account_id: vat_account_id,
          description: `ضريبة القيمة المضافة - ${inv_no}`,
          debit: 0,
          credit: inv.vat,
        },
      ];
      const { error: linesErr } = await supabase
        .from("journal_entry_lines")
        .insert(linesPayload);
      if (linesErr) errors.push(`lines ${inv_no}: ${linesErr.message}`);

      inserted++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        total: invoices.length,
        errors: errors.slice(0, 20),
        error_count: errors.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
