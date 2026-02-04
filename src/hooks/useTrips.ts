import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripPassengers,
  addTripPassenger,
  updateTripPassenger,
  deleteTripPassenger,
  sendTripReminder,
  CreateTripData,
  Trip,
  TripPassenger,
} from '@/services/trips';
import { toast } from 'sonner';

export function useTrips() {
  const { company, companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();

  return useQuery({
    queryKey: ['trips', companyId, selectedFiscalYear?.id],
    queryFn: () => getTrips(companyId!, selectedFiscalYear?.id),
    enabled: !!companyId,
  });
}

export function useTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => getTrip(tripId!),
    enabled: !!tripId,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();

  return useMutation({
    mutationFn: (data: Omit<CreateTripData, 'company_id' | 'fiscal_year_id'>) =>
      createTrip({
        ...data,
        company_id: companyId!,
        fiscal_year_id: selectedFiscalYear?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('تم إضافة الرحلة بنجاح');
    },
    onError: (error) => {
      console.error('Error creating trip:', error);
      toast.error('حدث خطأ أثناء إضافة الرحلة');
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tripId, updates }: { tripId: string; updates: Partial<Trip> }) =>
      updateTrip(tripId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip'] });
      toast.success('تم تحديث الرحلة بنجاح');
    },
    onError: (error) => {
      console.error('Error updating trip:', error);
      toast.error('حدث خطأ أثناء تحديث الرحلة');
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('تم حذف الرحلة بنجاح');
    },
    onError: (error) => {
      console.error('Error deleting trip:', error);
      toast.error('حدث خطأ أثناء حذف الرحلة');
    },
  });
}

// Passengers hooks
export function useTripPassengers(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trip-passengers', tripId],
    queryFn: () => getTripPassengers(tripId!),
    enabled: !!tripId,
  });
}

export function useAddTripPassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tripId, passenger }: { tripId: string; passenger: Omit<TripPassenger, 'id' | 'trip_id' | 'created_at'> }) =>
      addTripPassenger(tripId, passenger),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['trip-passengers', tripId] });
      toast.success('تم إضافة المسافر بنجاح');
    },
    onError: (error) => {
      console.error('Error adding passenger:', error);
      toast.error('حدث خطأ أثناء إضافة المسافر');
    },
  });
}

export function useUpdateTripPassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ passengerId, updates }: { passengerId: string; updates: Partial<TripPassenger> }) =>
      updateTripPassenger(passengerId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-passengers'] });
      toast.success('تم تحديث بيانات المسافر بنجاح');
    },
    onError: (error) => {
      console.error('Error updating passenger:', error);
      toast.error('حدث خطأ أثناء تحديث بيانات المسافر');
    },
  });
}

export function useDeleteTripPassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTripPassenger,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-passengers'] });
      toast.success('تم حذف المسافر بنجاح');
    },
    onError: (error) => {
      console.error('Error deleting passenger:', error);
      toast.error('حدث خطأ أثناء حذف المسافر');
    },
  });
}

// Send reminder hook
export function useSendTripReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendTripReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('تم إرسال التذكير بنجاح');
    },
    onError: (error) => {
      console.error('Error sending reminder:', error);
      toast.error('حدث خطأ أثناء إرسال التذكير');
    },
  });
}
