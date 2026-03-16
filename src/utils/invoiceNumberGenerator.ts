import { supabase } from "@/integrations/supabase/client";

/**
 * Generates the next sequential invoice number for a company
 * Format: PUR-1, PUR-2, ... for purchases | SAL-1, SAL-2, ... for sales
 */
export async function getNextInvoiceNumber(
  companyId: string,
  invoiceType: 'purchase' | 'sale'
): Promise<string> {
  const prefix = invoiceType === 'purchase' ? 'PUR' : 'SAL';

  // Get the max invoice number for this company and type
  const { data, error } = await (supabase as any)
    .from('invoices')
    .select('invoice_number')
    .eq('company_id', companyId)
    .eq('invoice_type', invoiceType)
    .like('invoice_number', `${prefix}-%`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching invoice numbers:', error);
    return `${prefix}-1`;
  }

  let maxNum = 0;
  if (data && data.length > 0) {
    for (const row of data) {
      const num = row.invoice_number;
      // Extract the number after the prefix: PUR-5 -> 5, PUR-1773691732996-2 -> handle legacy
      const match = num.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    // If no clean sequential numbers found, count existing invoices
    if (maxNum === 0) {
      maxNum = data.length;
    }
  }

  return `${prefix}-${maxNum + 1}`;
}
