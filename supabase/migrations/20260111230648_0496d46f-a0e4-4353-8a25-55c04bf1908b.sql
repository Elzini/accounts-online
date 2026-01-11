-- Fix security: Restrict customers table access to users with sales permission or admin
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
CREATE POLICY "Users with sales or admin can view customers" ON public.customers
  FOR SELECT TO authenticated USING (
    public.has_permission(auth.uid(), 'sales') OR public.is_admin(auth.uid())
  );

-- Fix security: Restrict suppliers table access to users with purchases permission or admin
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
CREATE POLICY "Users with purchases or admin can view suppliers" ON public.suppliers
  FOR SELECT TO authenticated USING (
    public.has_permission(auth.uid(), 'purchases') OR public.is_admin(auth.uid())
  );

-- Fix security: Restrict cars table access to users with purchases permission or admin
DROP POLICY IF EXISTS "Authenticated users can view cars" ON public.cars;
CREATE POLICY "Users with purchases or admin can view cars" ON public.cars
  FOR SELECT TO authenticated USING (
    public.has_permission(auth.uid(), 'purchases') OR 
    public.has_permission(auth.uid(), 'sales') OR 
    public.is_admin(auth.uid())
  );

-- Fix security: Restrict sales table access to users with sales permission or admin
DROP POLICY IF EXISTS "Authenticated users can view sales" ON public.sales;
CREATE POLICY "Users with sales or admin can view sales" ON public.sales
  FOR SELECT TO authenticated USING (
    public.has_permission(auth.uid(), 'sales') OR 
    public.has_permission(auth.uid(), 'reports') OR 
    public.is_admin(auth.uid())
  );

-- Allow admins to view all profiles for user management
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR auth.uid() = user_id);

-- Allow admins to update user roles
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- Function to make first user an admin automatically
CREATE OR REPLACE FUNCTION public.make_first_user_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- If this is the first user, give them all permissions
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, permission) VALUES
      (NEW.user_id, 'admin'),
      (NEW.user_id, 'sales'),
      (NEW.user_id, 'purchases'),
      (NEW.user_id, 'reports'),
      (NEW.user_id, 'users');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to make first user admin
CREATE TRIGGER on_first_user_make_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.make_first_user_admin();