/**
 * Procurement Service Hooks
 * Centralized data access for procurement modules.
 * Replaces direct supabase calls in procurement UI components.
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Purchase Orders ──
export function usePurchaseOrders(companyId: string | null, prefix?: string) {
  return useQuery({
    queryKey: ['purchase-orders', companyId, prefix],
    queryFn: async () => {
      let q = supabase.from('purchase_orders').select('*').eq('company_id', companyId!);
      if (prefix) q = q.like('order_number', `${prefix}-%`);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePurchaseOrder(companyId: string | null, queryKeyPrefix?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: {
      order_number: string;
      order_date: string;
      status: string;
      total_amount?: number;
      notes?: string | null;
      supplier_id?: string | null;
      expected_delivery?: string | null;
    }) => {
      const { error } = await supabase.from('purchase_orders').insert({
        company_id: companyId!,
        ...row,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', companyId, queryKeyPrefix] });
    },
  });
}

export function useUpdatePurchaseOrderStatus(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

export function useDeletePurchaseOrder(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

// ── Goods Receipts ──
export function useGoodsReceipts(companyId: string | null) {
  return useQuery({
    queryKey: ['goods-receipts', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('goods_receipts').select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGoodsReceipt(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: { receipt_number: string; receipt_date: string; status: string; notes?: string | null }) => {
      const { error } = await supabase.from('goods_receipts').insert({ company_id: companyId!, ...row });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
    },
  });
}
