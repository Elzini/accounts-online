import { supabase } from '@/integrations/supabase/client';

export interface Quotation {
  id: string;
  company_id: string;
  quotation_number: number;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number;
  discount: number;
  tax_amount: number;
  final_amount: number;
  status: string;
  valid_until: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  car_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  car?: {
    id: string;
    name: string;
    model: string | null;
    chassis_number: string;
  };
}

export type QuotationInsert = Omit<Quotation, 'id' | 'quotation_number' | 'created_at' | 'updated_at' | 'customer' | 'items'>;
export type QuotationItemInsert = Omit<QuotationItem, 'id' | 'created_at' | 'car'>;

export async function fetchQuotations(): Promise<Quotation[]> {
  const { data, error } = await supabase
    .from('quotations')
    .select('*, customer:customers(id, name, phone)')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Quotation[];
}

export async function fetchQuotation(id: string): Promise<Quotation | null> {
  const { data, error } = await supabase
    .from('quotations')
    .select('*, customer:customers(id, name, phone), items:quotation_items(*, car:cars(id, name, model, chassis_number))')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Quotation;
}

export async function addQuotation(quotation: QuotationInsert, items: Omit<QuotationItemInsert, 'quotation_id'>[]): Promise<Quotation> {
  const { data, error } = await supabase
    .from('quotations')
    .insert(quotation)
    .select()
    .single();
  
  if (error) throw error;
  
  if (items.length > 0) {
    const itemsWithQuotationId = items.map(item => ({
      ...item,
      quotation_id: data.id
    }));
    
    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(itemsWithQuotationId);
    
    if (itemsError) throw itemsError;
  }
  
  return data as Quotation;
}

export async function updateQuotation(id: string, updates: Partial<QuotationInsert>): Promise<Quotation> {
  const { data, error } = await supabase
    .from('quotations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Quotation;
}

export async function deleteQuotation(id: string): Promise<void> {
  const { error } = await supabase
    .from('quotations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function convertQuotationToSale(quotationId: string): Promise<void> {
  const { error } = await supabase
    .from('quotations')
    .update({ status: 'converted' })
    .eq('id', quotationId);
  
  if (error) throw error;
}
