-- Create enum for user roles
CREATE TYPE public.user_permission AS ENUM ('sales', 'purchases', 'reports', 'admin', 'users');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table for permissions (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission user_permission NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, permission)
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  id_number TEXT,
  registration_number TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  id_number TEXT,
  registration_number TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create cars table (inventory)
CREATE TABLE public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_number SERIAL NOT NULL,
  chassis_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  model TEXT,
  color TEXT,
  purchase_price DECIMAL(12,2) NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number SERIAL NOT NULL,
  car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL NOT NULL,
  sale_price DECIMAL(12,2) NOT NULL,
  seller_name TEXT,
  commission DECIMAL(12,2) DEFAULT 0,
  other_expenses DECIMAL(12,2) DEFAULT 0,
  profit DECIMAL(12,2) NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission user_permission)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND permission = _permission
  )
$$;

-- Create function to check if user has admin permission
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND permission = 'admin'
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles RLS policies (only admins can manage)
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Customers RLS policies
CREATE POLICY "Authenticated users can view customers" ON public.customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users with sales or admin can insert customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (
    public.has_permission(auth.uid(), 'sales') OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users with sales or admin can update customers" ON public.customers
  FOR UPDATE TO authenticated USING (
    public.has_permission(auth.uid(), 'sales') OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete customers" ON public.customers
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Suppliers RLS policies
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users with purchases or admin can insert suppliers" ON public.suppliers
  FOR INSERT TO authenticated WITH CHECK (
    public.has_permission(auth.uid(), 'purchases') OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users with purchases or admin can update suppliers" ON public.suppliers
  FOR UPDATE TO authenticated USING (
    public.has_permission(auth.uid(), 'purchases') OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete suppliers" ON public.suppliers
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Cars RLS policies
CREATE POLICY "Authenticated users can view cars" ON public.cars
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users with purchases or admin can insert cars" ON public.cars
  FOR INSERT TO authenticated WITH CHECK (
    public.has_permission(auth.uid(), 'purchases') OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users with purchases or admin can update cars" ON public.cars
  FOR UPDATE TO authenticated USING (
    public.has_permission(auth.uid(), 'purchases') OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete cars" ON public.cars
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Sales RLS policies
CREATE POLICY "Authenticated users can view sales" ON public.sales
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users with sales or admin can insert sales" ON public.sales
  FOR INSERT TO authenticated WITH CHECK (
    public.has_permission(auth.uid(), 'sales') OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users with sales or admin can update sales" ON public.sales
  FOR UPDATE TO authenticated USING (
    public.has_permission(auth.uid(), 'sales') OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete sales" ON public.sales
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cars_updated_at
  BEFORE UPDATE ON public.cars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'username', new.email));
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();