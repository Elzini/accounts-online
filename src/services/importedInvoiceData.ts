import { supabase } from '@/integrations/supabase/client';

export interface ImportedInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface ImportedInvoiceData {
  id: string;
  company_id: string;
  name: string;
  data: ImportedInvoiceItem[];
  file_name: string | null;
  created_at: string;
  updated_at: string;
}

export async function getImportedInvoiceData(companyId: string): Promise<ImportedInvoiceData[]> {
  const { data, error } = await supabase
    .from('imported_invoice_data')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(item => ({
    ...item,
    data: item.data as unknown as ImportedInvoiceItem[],
  })) as ImportedInvoiceData[];
}

export async function saveImportedInvoiceData(
  companyId: string,
  name: string,
  items: ImportedInvoiceItem[],
  fileName?: string
): Promise<ImportedInvoiceData> {
  const { data, error } = await supabase
    .from('imported_invoice_data')
    .insert({
      company_id: companyId,
      name,
      data: items as unknown as any,
      file_name: fileName || null,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    data: data.data as unknown as ImportedInvoiceItem[],
  } as ImportedInvoiceData;
}

export async function deleteImportedInvoiceData(id: string): Promise<void> {
  const { error } = await supabase
    .from('imported_invoice_data')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Helper function to parse Excel data into invoice items
export function parseExcelToInvoiceItems(excelData: any[]): ImportedInvoiceItem[] {
  return excelData.map(row => {
    // Try to find relevant columns by common names (Arabic/English)
    const description = 
      row['اسم المنتج'] || 
      row['الوصف'] || 
      row['المنتج'] || 
      row['البند'] ||
      row['description'] || 
      row['product'] || 
      row['item'] ||
      Object.values(row)[0] || '';
    
    const quantity = 
      Number(row['الكمية'] || row['quantity'] || row['qty'] || 1);
    
    const unitPrice = 
      Number(row['سعر الوحدة'] || row['السعر'] || row['unit_price'] || row['price'] || 0);
    
    const taxRate = 
      Number(row['نسبة الضريبة'] || row['الضريبة'] || row['tax_rate'] || row['tax'] || 15);

    return {
      description: String(description),
      quantity: isNaN(quantity) ? 1 : quantity,
      unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
      taxRate: isNaN(taxRate) ? 15 : taxRate,
    };
  });
}
