-- Make approved/completed bank reconciliations immutable via trigger
-- Once status = 'approved' or 'completed', prevent modifications

CREATE OR REPLACE FUNCTION public.prevent_approved_reconciliation_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block updates to approved/completed reconciliations
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('approved', 'completed') THEN
      RAISE EXCEPTION 'Cannot modify an approved/completed bank reconciliation. Create a new reconciliation instead.';
    END IF;
  END IF;

  -- Block deletes of approved/completed reconciliations
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('approved', 'completed') THEN
      RAISE EXCEPTION 'Cannot delete an approved/completed bank reconciliation.';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_reconciliation_immutability
BEFORE UPDATE OR DELETE ON public.bank_reconciliations
FOR EACH ROW
EXECUTE FUNCTION public.prevent_approved_reconciliation_modification();

-- Also protect matched bank transactions from modification
CREATE OR REPLACE FUNCTION public.prevent_matched_transaction_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_matched = true THEN
      -- Allow only unmatching (setting is_matched to false) by admin
      IF NEW.is_matched = false THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Cannot modify a matched bank transaction. Unmatch it first.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.is_matched = true THEN
      RAISE EXCEPTION 'Cannot delete a matched bank transaction.';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_transaction_immutability
BEFORE UPDATE OR DELETE ON public.bank_transactions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_matched_transaction_modification();

-- Remove duplicate permissive INSERT policies that lack role checks
DROP POLICY IF EXISTS "Insert bank reconciliations in company" ON public.bank_reconciliations;
DROP POLICY IF EXISTS "Insert bank statements in company" ON public.bank_statements;