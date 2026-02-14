-- Add draft/approved status to sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Update existing sales to 'approved' status (they were already finalized)
UPDATE public.sales SET status = 'approved', approved_at = created_at WHERE status = 'draft';

-- Create trigger to prevent modification of approved sales
CREATE OR REPLACE FUNCTION public.prevent_approved_sale_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow status change from draft to approved
  IF OLD.status = 'draft' AND NEW.status = 'approved' THEN
    RETURN NEW;
  END IF;
  
  -- If sale is approved, block all modifications
  IF OLD.status = 'approved' THEN
    RAISE EXCEPTION 'لا يمكن تعديل فاتورة معتمدة. يمكنك فقط إلغاؤها وإنشاء فاتورة جديدة.';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_approved_sale_update
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_approved_sale_modification();