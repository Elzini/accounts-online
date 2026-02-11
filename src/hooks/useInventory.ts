import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

// ===== Warehouses =====
export function useWarehouses() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['warehouses', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useAddWarehouse() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (w: { warehouse_name: string; warehouse_code?: string; address?: string; manager?: string; phone?: string; is_default?: boolean }) => {
      if (!companyId) throw new Error('No company');
      const { data, error } = await supabase.from('warehouses').insert({ 
        warehouse_name: w.warehouse_name,
        warehouse_code: w.warehouse_code || '',
        company_id: companyId,
        address: w.address,
        manager: w.manager,
        phone: w.phone,
        is_default: w.is_default,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses', companyId] }),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async ({ id, ...w }: { id: string; warehouse_name?: string; warehouse_code?: string; address?: string; manager?: string; phone?: string; is_default?: boolean; is_active?: boolean }) => {
      const { error } = await supabase.from('warehouses').update(w).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses', companyId] }),
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('warehouses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses', companyId] }),
  });
}

// ===== Units of Measure =====
export function useUnits() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['units', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('units_of_measure')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useAddUnit() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (u: { name: string; abbreviation?: string }) => {
      if (!companyId) throw new Error('No company');
      const { data, error } = await supabase.from('units_of_measure').insert({ ...u, company_id: companyId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['units', companyId] }),
  });
}

export function useUpdateUnit() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async ({ id, ...u }: { id: string; name?: string; abbreviation?: string; is_active?: boolean }) => {
      const { error } = await supabase.from('units_of_measure').update(u).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['units', companyId] }),
  });
}

export function useDeleteUnit() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('units_of_measure').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['units', companyId] }),
  });
}

// ===== Item Categories =====
export function useItemCategories() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['item-categories', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('item_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useAddItemCategory() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (c: { name: string; parent_id?: string | null; sort_order?: number }) => {
      if (!companyId) throw new Error('No company');
      const { data, error } = await supabase.from('item_categories').insert({ ...c, company_id: companyId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['item-categories', companyId] }),
  });
}

export function useUpdateItemCategory() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async ({ id, ...c }: { id: string; name?: string; parent_id?: string | null; sort_order?: number; is_active?: boolean }) => {
      const { error } = await supabase.from('item_categories').update(c).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['item-categories', companyId] }),
  });
}

export function useDeleteItemCategory() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('item_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['item-categories', companyId] }),
  });
}

// ===== Items =====
export function useItems() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['items', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('items')
        .select('*, item_categories(name), units_of_measure(name, abbreviation), warehouses(warehouse_name)')
        .eq('company_id', companyId)
        .order('item_number');
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useAddItem() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (item: {
      name: string;
      barcode?: string;
      category_id?: string | null;
      unit_id?: string | null;
      item_type?: string;
      warehouse_id?: string | null;
      cost_price?: number;
      sale_price_1?: number;
      sale_price_2?: number;
      sale_price_3?: number;
      wholesale_price?: number;
      min_quantity?: number;
      max_quantity?: number;
      reorder_level?: number;
      current_quantity?: number;
      opening_quantity?: number;
      commission_rate?: number;
      purchase_discount?: number;
      expiry_date?: string | null;
      notes?: string;
    }) => {
      if (!companyId) throw new Error('No company');
      const { data, error } = await supabase.from('items').insert({ ...item, company_id: companyId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', companyId] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async ({ id, ...item }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from('items').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', companyId] }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', companyId] }),
  });
}
