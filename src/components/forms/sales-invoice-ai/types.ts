/**
 * Sales Invoice AI Import - Types
 */
export interface ParsedSalesInvoiceData {
  customer_name?: string;
  customer_tax_number?: string;
  customer_phone?: string;
  customer_address?: string;
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
  payment_method?: string;
  notes?: string;
  price_includes_tax?: boolean;
  seller_name?: string;
}

export interface SalesBatchParsedResult {
  index: number;
  fileName: string;
  data: ParsedSalesInvoiceData;
  success: boolean;
  fileObject?: File;
  thumbnailUrl?: string;
}
