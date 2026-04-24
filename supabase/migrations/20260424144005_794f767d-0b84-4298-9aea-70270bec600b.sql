CREATE OR REPLACE FUNCTION public.update_posted_journal_entry(
  p_entry_id uuid,
  p_entry_date date DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_lines jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_entry RECORD;
  v_user_company_id uuid;
  v_total_debit numeric := 0;
  v_total_credit numeric := 0;
  v_line jsonb;
BEGIN
  -- AuthN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  -- Load entry
  SELECT id, company_id, is_posted INTO v_entry
  FROM public.journal_entries WHERE id = p_entry_id;

  IF v_entry.id IS NULL THEN
    RAISE EXCEPTION 'ENTRY_NOT_FOUND';
  END IF;

  -- Tenant isolation: actor must belong to the same company (or be super admin)
  SELECT company_id INTO v_user_company_id
  FROM public.profiles WHERE user_id = v_actor;

  IF NOT public.is_super_admin(v_actor)
     AND (v_user_company_id IS NULL OR v_user_company_id <> v_entry.company_id) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  -- Validate balanced
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_total_debit := v_total_debit + COALESCE((v_line->>'debit')::numeric, 0);
    v_total_credit := v_total_credit + COALESCE((v_line->>'credit')::numeric, 0);
  END LOOP;

  IF abs(v_total_debit - v_total_credit) > 0.01 THEN
    RAISE EXCEPTION 'UNBALANCED: debit=% credit=%', v_total_debit, v_total_credit;
  END IF;

  IF jsonb_array_length(p_lines) < 2 THEN
    RAISE EXCEPTION 'INVALID_LINES: at least two lines required';
  END IF;

  -- Enable bypass for protection triggers
  PERFORM set_config('app.force_deleting_invoice', 'on', true);

  -- Replace lines
  DELETE FROM public.journal_entry_lines WHERE journal_entry_id = p_entry_id;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    INSERT INTO public.journal_entry_lines (
      journal_entry_id, account_id, description, debit, credit, company_id
    ) VALUES (
      p_entry_id,
      (v_line->>'account_id')::uuid,
      v_line->>'description',
      COALESCE((v_line->>'debit')::numeric, 0),
      COALESCE((v_line->>'credit')::numeric, 0),
      v_entry.company_id
    );
  END LOOP;

  -- Update header
  UPDATE public.journal_entries
     SET entry_date  = COALESCE(p_entry_date, entry_date),
         description = COALESCE(p_description, description),
         total_debit = v_total_debit,
         total_credit = v_total_credit,
         updated_at  = now()
   WHERE id = p_entry_id;

  -- Disable bypass
  PERFORM set_config('app.force_deleting_invoice', 'off', true);

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', p_entry_id,
    'total_debit', v_total_debit,
    'total_credit', v_total_credit
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_posted_journal_entry(uuid, date, text, jsonb) TO authenticated;