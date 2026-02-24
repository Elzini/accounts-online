CREATE POLICY "Delete custody changes" ON public.custody_amount_changes
FOR DELETE USING (is_super_admin(auth.uid()) OR company_id = get_user_company_id(auth.uid()));