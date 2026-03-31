/**
 * Car Warehouse Inventory Service - chassis image stocktaking
 */
import { supabase } from '@/integrations/supabase/client';

export interface WarehouseCarEntry {
  id: string;
  company_id: string;
  car_type: string;
  car_color: string | null;
  chassis_number: string;
  chassis_image_url: string | null;
  entry_date: string;
  exit_date: string | null;
  price: number | null;
  notes: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchWarehouseCarInventory(companyId: string) {
  const { data, error } = await (supabase as any)
    .from('warehouse_car_inventory')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as WarehouseCarEntry[];
}

export async function addWarehouseCarEntry(companyId: string, entry: {
  car_type: string;
  car_color?: string;
  chassis_number: string;
  chassis_image_url?: string;
  entry_date: string;
  exit_date?: string;
  price?: number;
  notes?: string;
  location?: string;
}) {
  const { error } = await (supabase as any)
    .from('warehouse_car_inventory')
    .insert({
      company_id: companyId,
      ...entry,
    });
  if (error) throw error;
}

export async function updateWarehouseCarEntry(id: string, updates: Partial<{
  car_type: string;
  car_color: string;
  chassis_number: string;
  chassis_image_url: string;
  entry_date: string;
  exit_date: string;
  price: number;
  notes: string;
}>) {
  const { error } = await (supabase as any)
    .from('warehouse_car_inventory')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteWarehouseCarEntry(id: string) {
  const { error } = await (supabase as any)
    .from('warehouse_car_inventory')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function uploadChassisImage(companyId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${companyId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('chassis-images')
    .upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('chassis-images').getPublicUrl(path);
  return data.publicUrl;
}
