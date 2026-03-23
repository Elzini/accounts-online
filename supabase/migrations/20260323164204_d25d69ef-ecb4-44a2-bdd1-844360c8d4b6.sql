
-- =============================================
-- Phase 3.1: Drop redundant security/logging tables
-- These are covered by audit_logs table
-- =============================================

-- Drop tamper_detection_events (redundant with audit_logs)
DROP TABLE IF EXISTS public.tamper_detection_events CASCADE;

-- Drop tamper_scan_runs (redundant)
DROP TABLE IF EXISTS public.tamper_scan_runs CASCADE;

-- Drop sensitive_operations_log (0 rows, covered by audit_logs)
DROP TABLE IF EXISTS public.sensitive_operations_log CASCADE;

-- Drop integrity_hashes (operational overhead, tamper detection via audit_log hash chain)
DROP TABLE IF EXISTS public.integrity_hashes CASCADE;

-- Drop data_integrity_checks (covered by accounting health service in-memory)
DROP TABLE IF EXISTS public.data_integrity_checks CASCADE;

-- Drop system_change_log (8 rows, covered by audit_logs)
DROP TABLE IF EXISTS public.system_change_log CASCADE;

-- Drop empty collection tables (0 rows, no active feature)
DROP TABLE IF EXISTS public.collection_reminders CASCADE;
DROP TABLE IF EXISTS public.collection_reminder_rules CASCADE;

-- =============================================
-- Phase 3.2: Add composite indexes for tables missing company_id index
-- =============================================

-- Approval & Workflow
CREATE INDEX IF NOT EXISTS idx_approval_requests_company ON public.approval_requests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_company ON public.approval_workflows(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_advanced_projects_company ON public.advanced_projects(company_id, status);

-- Banking
CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_company ON public.bank_reconciliations(company_id, status);

-- Bookings & Bookkeeping
CREATE INDEX IF NOT EXISTS idx_bookings_company ON public.bookings(company_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookkeeping_clients_company ON public.bookkeeping_clients(company_id, status);
CREATE INDEX IF NOT EXISTS idx_bookkeeping_tasks_company ON public.bookkeeping_tasks(company_id, status);

-- CMS & CRM
CREATE INDEX IF NOT EXISTS idx_cms_pages_company ON public.cms_pages(company_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_company ON public.crm_leads(company_id, status);

-- Employee
CREATE INDEX IF NOT EXISTS idx_employee_advances_company ON public.employee_advances(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_company ON public.employee_attendance(company_id, date);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_company ON public.employee_contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_leaves_company ON public.employee_leaves(company_id, status);

-- Finance modules
CREATE INDEX IF NOT EXISTS idx_financing_companies_company ON public.financing_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_company ON public.loyalty_programs(company_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_company ON public.loyalty_points(company_id);

-- HR
CREATE INDEX IF NOT EXISTS idx_hr_device_logs_company ON public.hr_device_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_evaluations_company ON public.hr_evaluations(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_fingerprint_devices_company ON public.hr_fingerprint_devices(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_holidays_company ON public.hr_holidays(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_insurance_records_company ON public.hr_insurance_records(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_training_courses_company ON public.hr_training_courses(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_work_schedules_company ON public.hr_work_schedules(company_id);

-- Projects
CREATE INDEX IF NOT EXISTS idx_project_costs_company ON public.project_costs(company_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_company ON public.project_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_batches_company ON public.purchase_batches(company_id);

-- Real Estate
CREATE INDEX IF NOT EXISTS idx_re_contractors_company ON public.re_contractors(company_id);
CREATE INDEX IF NOT EXISTS idx_re_follow_ups_company ON public.re_follow_ups(company_id);
CREATE INDEX IF NOT EXISTS idx_re_installments_company ON public.re_installments(company_id);
CREATE INDEX IF NOT EXISTS idx_re_progress_billings_company ON public.re_progress_billings(company_id);
CREATE INDEX IF NOT EXISTS idx_re_project_phases_company ON public.re_project_phases(company_id);
CREATE INDEX IF NOT EXISTS idx_re_units_company ON public.re_units(company_id);
CREATE INDEX IF NOT EXISTS idx_re_work_orders_company ON public.re_work_orders(company_id);

-- Rental & Others
CREATE INDEX IF NOT EXISTS idx_rental_units_company ON public.rental_units(company_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_zatca_sandbox_tests_company ON public.zatca_sandbox_tests(company_id);
CREATE INDEX IF NOT EXISTS idx_custody_amount_changes_company ON public.custody_amount_changes(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_portal_tokens_company ON public.customer_portal_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_company ON public.budget_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_formula_variables_company ON public.formula_variables(company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_company ON public.api_keys(company_id);

-- =============================================
-- Phase 3.3: Add company_id auto-propagation triggers
-- Using existing auto_set_child_company_id function
-- =============================================

-- Child tables that need company_id from parent
-- invoice_items → invoices
CREATE OR REPLACE FUNCTION public.auto_propagate_invoice_items_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.invoices WHERE id = NEW.invoice_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_invoice_items_company_id
  BEFORE INSERT ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.auto_propagate_invoice_items_company_id();

-- sale_items → sales
CREATE OR REPLACE FUNCTION public.auto_propagate_sale_items_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.sales WHERE id = NEW.sale_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sale_items_company_id
  BEFORE INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.auto_propagate_sale_items_company_id();

-- journal_entry_lines → journal_entries (already has auto_set_jel_company_id but let's ensure)
CREATE OR REPLACE FUNCTION public.auto_propagate_jel_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.journal_entries WHERE id = NEW.journal_entry_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jel_company_id ON public.journal_entry_lines;
CREATE TRIGGER trg_jel_company_id
  BEFORE INSERT ON public.journal_entry_lines
  FOR EACH ROW EXECUTE FUNCTION public.auto_propagate_jel_company_id();

-- credit_debit_note_lines → credit_debit_notes
CREATE OR REPLACE FUNCTION public.auto_propagate_cdn_lines_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.credit_debit_notes WHERE id = NEW.note_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_cdn_lines_company_id
  BEFORE INSERT ON public.credit_debit_note_lines
  FOR EACH ROW EXECUTE FUNCTION public.auto_propagate_cdn_lines_company_id();

-- budget_lines → budgets
CREATE OR REPLACE FUNCTION public.auto_propagate_budget_lines_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.budgets WHERE id = NEW.budget_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_budget_lines_company_id
  BEFORE INSERT ON public.budget_lines
  FOR EACH ROW EXECUTE FUNCTION public.auto_propagate_budget_lines_company_id();

-- quotation_items → quotations
CREATE OR REPLACE FUNCTION public.auto_propagate_quotation_items_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.quotations WHERE id = NEW.quotation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_quotation_items_company_id
  BEFORE INSERT ON public.quotation_items
  FOR EACH ROW EXECUTE FUNCTION public.auto_propagate_quotation_items_company_id();

-- pos_order_lines → pos_orders
CREATE OR REPLACE FUNCTION public.auto_propagate_pos_lines_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.pos_orders WHERE id = NEW.order_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_pos_lines_company_id
  BEFORE INSERT ON public.pos_order_lines
  FOR EACH ROW EXECUTE FUNCTION public.auto_propagate_pos_lines_company_id();

-- bom_lines → manufacturing_products
CREATE OR REPLACE FUNCTION public.auto_propagate_bom_lines_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.manufacturing_products WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_bom_lines_company_id
  BEFORE INSERT ON public.bom_lines
  FOR EACH ROW EXECUTE FUNCTION public.auto_propagate_bom_lines_company_id();

-- hr_training_attendees → hr_training_courses
CREATE OR REPLACE FUNCTION public.auto_propagate_training_attendees_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.hr_training_courses WHERE id = NEW.course_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_training_attendees_company_id
  BEFORE INSERT ON public.hr_training_attendees
  FOR EACH ROW EXECUTE FUNCTION public.auto_propagate_training_attendees_company_id();
