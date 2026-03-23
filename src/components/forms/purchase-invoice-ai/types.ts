/**
 * AI Invoice Import - Shared Types
 */

export interface ParsedInvoiceData {
  supplier_name: string;
  supplier_tax_number?: string;
  supplier_phone?: string;
  supplier_address?: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal?: number;
  vat_amount?: number;
  vat_rate?: number;
  total_amount: number;
  discount?: number;
  notes?: string;
  price_includes_tax?: boolean;
}

export interface BatchParsedResult {
  index: number;
  fileName: string;
  data: ParsedInvoiceData;
  success: boolean;
  fileObject?: File;
  thumbnailUrl?: string;
}
