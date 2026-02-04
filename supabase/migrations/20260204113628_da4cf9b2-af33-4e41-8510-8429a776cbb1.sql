
-- Create trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  fiscal_year_id UUID REFERENCES public.fiscal_years(id),
  trip_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_point TEXT NOT NULL,
  trip_date DATE NOT NULL,
  trip_time TIME NOT NULL,
  price NUMERIC(12,2) DEFAULT 0,
  reminder_hours_before INTEGER DEFAULT 24,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create trip passengers table for multiple passengers per trip
CREATE TABLE public.trip_passengers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_passengers ENABLE ROW LEVEL SECURITY;

-- RLS policies for trips
CREATE POLICY "Authenticated users can view company trips"
ON public.trips FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
);

CREATE POLICY "Authenticated users can insert company trips"
ON public.trips FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
);

CREATE POLICY "Authenticated users can update company trips"
ON public.trips FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
);

CREATE POLICY "Authenticated users can delete company trips"
ON public.trips FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND public.strict_company_check(company_id)
  AND (public.has_permission('admin') OR public.is_super_admin(auth.uid()))
);

-- RLS policies for trip passengers
CREATE POLICY "Users can view trip passengers"
ON public.trip_passengers FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.trips t 
    WHERE t.id = trip_id 
    AND public.strict_company_check(t.company_id)
  )
);

CREATE POLICY "Users can insert trip passengers"
ON public.trip_passengers FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.trips t 
    WHERE t.id = trip_id 
    AND public.strict_company_check(t.company_id)
  )
);

CREATE POLICY "Users can update trip passengers"
ON public.trip_passengers FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.trips t 
    WHERE t.id = trip_id 
    AND public.strict_company_check(t.company_id)
  )
);

CREATE POLICY "Users can delete trip passengers"
ON public.trip_passengers FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.trips t 
    WHERE t.id = trip_id 
    AND public.strict_company_check(t.company_id)
  )
);

-- Create updated_at trigger for trips
CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_trips_company_id ON public.trips(company_id);
CREATE INDEX idx_trips_trip_date ON public.trips(trip_date);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trip_passengers_trip_id ON public.trip_passengers(trip_id);
