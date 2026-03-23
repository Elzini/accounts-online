
-- Fix search_path for all new trigger functions
ALTER FUNCTION public.trg_approval_actions_company_id() SET search_path = public;
ALTER FUNCTION public.trg_approval_steps_company_id() SET search_path = public;
ALTER FUNCTION public.trg_bom_lines_company_id() SET search_path = public;
ALTER FUNCTION public.trg_chat_messages_company_id() SET search_path = public;
ALTER FUNCTION public.trg_trip_passengers_company_id() SET search_path = public;
