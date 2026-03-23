/**
 * Module Services - Bookings
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';

export function useBookings() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['bookings', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('bookings').select('*').eq('company_id', companyId!).order('booking_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBooking() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { customerName: string; customerPhone: string; serviceType: string; bookingDate: string; bookingTime: string }) => {
      const { error } = await supabase.from('bookings').insert({
        company_id: companyId!, customer_name: form.customerName,
        customer_phone: form.customerPhone || null, service_type: form.serviceType || null,
        booking_date: form.bookingDate, booking_time: form.bookingTime || null, status: 'confirmed',
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); },
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); },
  });
}
