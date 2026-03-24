/**
 * Module Services - Rentals & Branches
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/untypedFrom';
import { useCompanyId } from '@/hooks/useCompanyId';

// ── Rentals ──
export function useRentalUnits() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['rental-units', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('rental_units').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRentalUnit() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { unitName: string; unitType: string; location: string; monthlyRent: string }) => {
      const { error } = await supabase.from('rental_units').insert({
        company_id: companyId!, unit_name: form.unitName, unit_type: form.unitType,
        location: form.location || null, monthly_rent: Number(form.monthlyRent) || 0, status: 'available',
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rental-units'] }); },
  });
}

export function useDeleteRentalUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rental_units').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rental-units'] }); },
  });
}

// ── Branches ──
export function useBranches() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['branches', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('branches').select('*').eq('company_id', companyId).order('is_main', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveBranch() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }: { id?: string; form: any }) => {
      if (!companyId) throw new Error('No company');
      if (id) {
        const { error } = await supabase.from('branches').update(form).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('branches').insert({ company_id: companyId, ...form });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); },
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); },
  });
}
