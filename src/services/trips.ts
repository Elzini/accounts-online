import { supabase } from '@/integrations/supabase/client';

export interface Trip {
  id: string;
  company_id: string;
  fiscal_year_id?: string;
  trip_number: number;
  customer_name: string;
  customer_phone: string;
  destination: string;
  departure_point: string;
  trip_date: string;
  trip_time: string;
  price: number;
  reminder_hours_before: number;
  reminder_datetime?: string;
  reminder_enabled: boolean;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TripPassenger {
  id: string;
  trip_id: string;
  passenger_name: string;
  passenger_phone?: string;
  notes?: string;
  created_at: string;
}

export interface CreateTripData {
  company_id: string;
  fiscal_year_id?: string;
  customer_name: string;
  customer_phone: string;
  destination: string;
  departure_point: string;
  trip_date: string;
  trip_time: string;
  price?: number;
  reminder_hours_before?: number;
  reminder_datetime?: string;
  reminder_enabled?: boolean;
  notes?: string;
  passengers?: Omit<TripPassenger, 'id' | 'trip_id' | 'created_at'>[];
}

export async function getTrips(companyId: string, fiscalYearId?: string) {
  let query = supabase
    .from('trips')
    .select('*')
    .eq('company_id', companyId)
    .order('trip_date', { ascending: true })
    .order('trip_time', { ascending: true });

  if (fiscalYearId) {
    query = query.eq('fiscal_year_id', fiscalYearId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Trip[];
}

export async function getTrip(tripId: string) {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (error) throw error;
  return data as Trip;
}

export async function createTrip(tripData: CreateTripData) {
  const { passengers, ...trip } = tripData;

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('trips')
    .insert({
      ...trip,
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Add passengers if provided
  if (passengers && passengers.length > 0) {
    const passengersWithTripId = passengers.map(p => ({
      ...p,
      trip_id: data.id,
    }));

    const { error: passengersError } = await supabase
      .from('trip_passengers')
      .insert(passengersWithTripId);

    if (passengersError) throw passengersError;
  }

  return data as Trip;
}

export async function updateTrip(tripId: string, updates: Partial<Trip>) {
  const { data, error } = await supabase
    .from('trips')
    .update(updates)
    .eq('id', tripId)
    .select()
    .single();

  if (error) throw error;
  return data as Trip;
}

export async function deleteTrip(tripId: string) {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);

  if (error) throw error;
}

// Passengers functions
export async function getTripPassengers(tripId: string) {
  const { data, error } = await supabase
    .from('trip_passengers')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as TripPassenger[];
}

export async function addTripPassenger(tripId: string, passenger: Omit<TripPassenger, 'id' | 'trip_id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('trip_passengers')
    .insert({
      trip_id: tripId,
      ...passenger,
    })
    .select()
    .single();

  if (error) throw error;
  return data as TripPassenger;
}

export async function updateTripPassenger(passengerId: string, updates: Partial<TripPassenger>) {
  const { data, error } = await supabase
    .from('trip_passengers')
    .update(updates)
    .eq('id', passengerId)
    .select()
    .single();

  if (error) throw error;
  return data as TripPassenger;
}

export async function deleteTripPassenger(passengerId: string) {
  const { error } = await supabase
    .from('trip_passengers')
    .delete()
    .eq('id', passengerId);

  if (error) throw error;
}

// Send reminder manually
export async function sendTripReminder(tripId: string) {
  const { data, error } = await supabase.functions.invoke('send-trip-reminder', {
    body: { tripId },
  });

  if (error) throw error;
  return data;
}
