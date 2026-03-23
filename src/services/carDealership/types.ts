/**
 * Car Dealership - Shared Types
 */
import type { Database } from '@/integrations/supabase/types';

export type Car = Database['public']['Tables']['cars']['Row'];
export type CarInsert = Database['public']['Tables']['cars']['Insert'];
export type CarUpdate = Database['public']['Tables']['cars']['Update'];
export type Sale = Database['public']['Tables']['sales']['Row'];
export type SaleInsert = Database['public']['Tables']['sales']['Insert'];
export type SaleUpdate = Database['public']['Tables']['sales']['Update'];
export type PurchaseBatch = Database['public']['Tables']['purchase_batches']['Row'];
export type PurchaseBatchInsert = Database['public']['Tables']['purchase_batches']['Insert'];
export type SaleItem = Database['public']['Tables']['sale_items']['Row'];
export type SaleItemInsert = Database['public']['Tables']['sale_items']['Insert'];

export interface CarWithSaleInfo extends Omit<CarInsert, 'batch_id'> {
  sale_price?: number;
}

export interface MultiCarSaleData {
  customer_id: string;
  seller_name?: string;
  commission?: number;
  other_expenses?: number;
  sale_date: string;
  payment_account_id?: string;
  cars: Array<{
    car_id: string;
    sale_price: number;
    purchase_price: number;
  }>;
}
