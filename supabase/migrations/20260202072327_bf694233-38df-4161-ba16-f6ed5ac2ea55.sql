
-- =====================================================
-- FILL GAPS: INVOICES, SESSIONS, PROJECTS, INVENTORY
-- =====================================================

-- =====================================================
-- 1. INVOICES TABLE (Standalone with ZATCA compliance)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Invoice identification
    invoice_number TEXT NOT NULL,
    invoice_type TEXT NOT NULL DEFAULT 'sales' CHECK (invoice_type IN ('sales', 'purchase', 'credit_note', 'debit_note')),
    
    -- Parties
    customer_id UUID REFERENCES public.customers(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    customer_name TEXT,
    customer_vat_number TEXT,
    customer_address TEXT,
    
    -- Dates
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Amounts
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    vat_rate NUMERIC(5,2) DEFAULT 15.00,
    vat_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0,
    
    -- Payment
    amount_paid NUMERIC(15,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue')),
    payment_method TEXT,
    
    -- ZATCA Compliance
    zatca_qr TEXT,
    zatca_invoice_hash TEXT,
    zatca_uuid TEXT,
    zatca_status TEXT DEFAULT 'pending' CHECK (zatca_status IN ('pending', 'reported', 'cleared', 'rejected')),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'sent', 'paid', 'cancelled', 'returned')),
    
    -- References
    sale_id UUID REFERENCES public.sales(id),
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    fiscal_year_id UUID REFERENCES public.fiscal_years(id),
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    UNIQUE(company_id, invoice_number, invoice_type)
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    
    -- Item details
    item_description TEXT NOT NULL,
    item_code TEXT,
    quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'unit',
    unit_price NUMERIC(15,2) NOT NULL,
    
    -- Amounts
    discount_percent NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    taxable_amount NUMERIC(15,2) NOT NULL,
    vat_rate NUMERIC(5,2) DEFAULT 15.00,
    vat_amount NUMERIC(15,2) NOT NULL,
    total NUMERIC(15,2) NOT NULL,
    
    -- References
    car_id UUID REFERENCES public.cars(id),
    inventory_item_id UUID,
    account_id UUID REFERENCES public.account_categories(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "invoices_strict_isolation" ON public.invoices
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

-- RLS for invoice_items via invoice
CREATE POLICY "invoice_items_via_invoice" ON public.invoice_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id
            AND public.strict_company_check(i.company_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id
            AND public.strict_company_check(i.company_id)
        )
    );

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_company ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

-- =====================================================
-- 2. USER SESSIONS TABLE (Advanced tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Session info
    session_token TEXT,
    
    -- Device & Location
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    termination_reason TEXT,
    
    -- Security
    is_suspicious BOOLEAN DEFAULT false,
    risk_score INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS: Users can see their own sessions, admins can see company sessions
CREATE POLICY "sessions_user_access" ON public.user_sessions
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR public.can_access_with_permission(company_id, 'admin')
    );

CREATE POLICY "sessions_insert" ON public.user_sessions
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_update" ON public.user_sessions
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_company ON public.user_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON public.user_sessions(is_active, last_activity);

-- =====================================================
-- 3. PROJECTS TABLE (For contracting companies)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Project identification
    project_number INTEGER NOT NULL,
    project_code TEXT,
    project_name TEXT NOT NULL,
    
    -- Client
    client_id UUID REFERENCES public.customers(id),
    client_name TEXT,
    client_contact TEXT,
    
    -- Contract details
    contract_number TEXT,
    contract_date DATE,
    contract_value NUMERIC(15,2) NOT NULL DEFAULT 0,
    
    -- Location
    location TEXT,
    site_address TEXT,
    
    -- Dates
    start_date DATE,
    expected_end_date DATE,
    actual_end_date DATE,
    
    -- Financial
    cost_to_date NUMERIC(15,2) DEFAULT 0,
    revenue_to_date NUMERIC(15,2) DEFAULT 0,
    profit_to_date NUMERIC(15,2) DEFAULT 0,
    retention_percentage NUMERIC(5,2) DEFAULT 10.00,
    retention_amount NUMERIC(15,2) DEFAULT 0,
    
    -- Completion
    completion_percentage NUMERIC(5,2) DEFAULT 0,
    
    -- Billing
    billed_amount NUMERIC(15,2) DEFAULT 0,
    collected_amount NUMERIC(15,2) DEFAULT 0,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN (
        'planning', 'in_progress', 'on_hold', 'completed', 'cancelled', 'warranty'
    )),
    
    -- Accounts
    wip_account_id UUID REFERENCES public.account_categories(id),
    revenue_account_id UUID REFERENCES public.account_categories(id),
    cost_account_id UUID REFERENCES public.account_categories(id),
    
    -- Metadata
    description TEXT,
    notes TEXT,
    fiscal_year_id UUID REFERENCES public.fiscal_years(id),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(company_id, project_number)
);

-- Project costs table
CREATE TABLE IF NOT EXISTS public.project_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Cost details
    cost_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cost_type TEXT NOT NULL CHECK (cost_type IN (
        'labor', 'materials', 'equipment', 'subcontractor', 'overhead', 'other'
    )),
    description TEXT NOT NULL,
    
    -- Amounts
    quantity NUMERIC(10,3) DEFAULT 1,
    unit_cost NUMERIC(15,2) NOT NULL,
    total_cost NUMERIC(15,2) NOT NULL,
    
    -- References
    supplier_id UUID REFERENCES public.suppliers(id),
    expense_id UUID REFERENCES public.expenses(id),
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    
    -- Approval
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project billings/invoices
CREATE TABLE IF NOT EXISTS public.project_billings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Billing details
    billing_number INTEGER NOT NULL,
    billing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    billing_type TEXT NOT NULL DEFAULT 'progress' CHECK (billing_type IN (
        'advance', 'progress', 'retention', 'final', 'variation'
    )),
    
    -- Amounts
    gross_amount NUMERIC(15,2) NOT NULL,
    deductions NUMERIC(15,2) DEFAULT 0,
    retention_held NUMERIC(15,2) DEFAULT 0,
    vat_amount NUMERIC(15,2) DEFAULT 0,
    net_amount NUMERIC(15,2) NOT NULL,
    
    -- Payment
    amount_received NUMERIC(15,2) DEFAULT 0,
    payment_date DATE,
    
    -- References
    invoice_id UUID REFERENCES public.invoices(id),
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'paid')),
    
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(project_id, billing_number)
);

-- Enable RLS for project tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_billings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "projects_strict_isolation" ON public.projects
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

CREATE POLICY "project_costs_strict_isolation" ON public.project_costs
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

CREATE POLICY "project_billings_strict_isolation" ON public.project_billings
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_company ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_costs_project ON public.project_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_billings_project ON public.project_billings(project_id);

-- =====================================================
-- 4. GENERAL INVENTORY (For trading companies)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Item identification
    item_code TEXT NOT NULL,
    barcode TEXT,
    item_name TEXT NOT NULL,
    item_name_en TEXT,
    
    -- Classification
    category TEXT,
    subcategory TEXT,
    brand TEXT,
    model TEXT,
    
    -- Units
    unit TEXT DEFAULT 'unit',
    secondary_unit TEXT,
    conversion_rate NUMERIC(10,4) DEFAULT 1,
    
    -- Pricing
    cost_price NUMERIC(15,2) DEFAULT 0,
    selling_price NUMERIC(15,2) DEFAULT 0,
    wholesale_price NUMERIC(15,2),
    minimum_price NUMERIC(15,2),
    
    -- Stock levels
    quantity_on_hand NUMERIC(15,3) DEFAULT 0,
    quantity_reserved NUMERIC(15,3) DEFAULT 0,
    quantity_available NUMERIC(15,3) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    
    -- Reorder
    reorder_level NUMERIC(15,3) DEFAULT 0,
    reorder_quantity NUMERIC(15,3) DEFAULT 0,
    maximum_stock NUMERIC(15,3),
    
    -- Valuation
    valuation_method TEXT DEFAULT 'weighted_average' CHECK (valuation_method IN (
        'fifo', 'lifo', 'weighted_average', 'specific'
    )),
    last_cost NUMERIC(15,2),
    average_cost NUMERIC(15,2),
    
    -- Classification
    item_type TEXT DEFAULT 'inventory' CHECK (item_type IN (
        'inventory', 'fixed_asset', 'consumable', 'service'
    )),
    is_active BOOLEAN DEFAULT true,
    is_sellable BOOLEAN DEFAULT true,
    is_purchasable BOOLEAN DEFAULT true,
    
    -- VAT
    vat_rate NUMERIC(5,2) DEFAULT 15.00,
    is_vat_exempt BOOLEAN DEFAULT false,
    
    -- Accounts
    inventory_account_id UUID REFERENCES public.account_categories(id),
    cogs_account_id UUID REFERENCES public.account_categories(id),
    sales_account_id UUID REFERENCES public.account_categories(id),
    
    -- Physical
    weight NUMERIC(10,3),
    dimensions TEXT,
    location TEXT,
    shelf TEXT,
    
    -- Tracking
    has_serial_number BOOLEAN DEFAULT false,
    has_batch_tracking BOOLEAN DEFAULT false,
    has_expiry_date BOOLEAN DEFAULT false,
    
    -- Media
    image_url TEXT,
    
    -- Metadata
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(company_id, item_code)
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    
    -- Movement details
    movement_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    movement_type TEXT NOT NULL CHECK (movement_type IN (
        'purchase', 'sale', 'return_in', 'return_out', 
        'adjustment_in', 'adjustment_out', 'transfer_in', 'transfer_out',
        'production_in', 'production_out', 'opening_balance'
    )),
    
    -- Quantities
    quantity NUMERIC(15,3) NOT NULL,
    unit_cost NUMERIC(15,2),
    total_cost NUMERIC(15,2),
    
    -- Balance after movement
    balance_after NUMERIC(15,3),
    average_cost_after NUMERIC(15,2),
    
    -- References
    reference_type TEXT,
    reference_id UUID,
    invoice_id UUID REFERENCES public.invoices(id),
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    
    -- Tracking
    batch_number TEXT,
    serial_number TEXT,
    expiry_date DATE,
    
    -- Location
    from_location TEXT,
    to_location TEXT,
    
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    warehouse_code TEXT NOT NULL,
    warehouse_name TEXT NOT NULL,
    address TEXT,
    manager TEXT,
    phone TEXT,
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(company_id, warehouse_code)
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "inventory_items_strict_isolation" ON public.inventory_items
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

CREATE POLICY "stock_movements_strict_isolation" ON public.stock_movements
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

CREATE POLICY "warehouses_strict_isolation" ON public.warehouses
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_company ON public.inventory_items(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_code ON public.inventory_items(item_code);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON public.stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON public.stock_movements(movement_date);

-- =====================================================
-- 5. APPLY AUDIT TRIGGERS TO NEW TABLES
-- =====================================================

-- Audit trigger for invoices
DROP TRIGGER IF EXISTS audit_invoices ON public.invoices;
CREATE TRIGGER audit_invoices 
    AFTER INSERT OR UPDATE OR DELETE ON public.invoices 
    FOR EACH ROW EXECUTE FUNCTION public.auto_audit_trigger();

-- Audit trigger for projects
DROP TRIGGER IF EXISTS audit_projects ON public.projects;
CREATE TRIGGER audit_projects 
    AFTER INSERT OR UPDATE OR DELETE ON public.projects 
    FOR EACH ROW EXECUTE FUNCTION public.auto_audit_trigger();

-- Audit trigger for inventory_items
DROP TRIGGER IF EXISTS audit_inventory_items ON public.inventory_items;
CREATE TRIGGER audit_inventory_items 
    AFTER INSERT OR UPDATE OR DELETE ON public.inventory_items 
    FOR EACH ROW EXECUTE FUNCTION public.auto_audit_trigger();

-- Audit trigger for stock_movements
DROP TRIGGER IF EXISTS audit_stock_movements ON public.stock_movements;
CREATE TRIGGER audit_stock_movements 
    AFTER INSERT OR UPDATE OR DELETE ON public.stock_movements 
    FOR EACH ROW EXECUTE FUNCTION public.auto_audit_trigger();

-- =====================================================
-- 6. COMPANY BINDING TRIGGERS
-- =====================================================

-- Enforce company binding for invoices
DROP TRIGGER IF EXISTS enforce_company_invoices ON public.invoices;
CREATE TRIGGER enforce_company_invoices 
    BEFORE INSERT OR UPDATE ON public.invoices 
    FOR EACH ROW EXECUTE FUNCTION public.enforce_company_binding();

-- Enforce company binding for projects
DROP TRIGGER IF EXISTS enforce_company_projects ON public.projects;
CREATE TRIGGER enforce_company_projects 
    BEFORE INSERT OR UPDATE ON public.projects 
    FOR EACH ROW EXECUTE FUNCTION public.enforce_company_binding();

-- Enforce company binding for inventory
DROP TRIGGER IF EXISTS enforce_company_inventory_items ON public.inventory_items;
CREATE TRIGGER enforce_company_inventory_items 
    BEFORE INSERT OR UPDATE ON public.inventory_items 
    FOR EACH ROW EXECUTE FUNCTION public.enforce_company_binding();

-- =====================================================
-- 7. AUTO-INCREMENT SEQUENCES
-- =====================================================

-- Function to get next invoice number
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(
    _company_id UUID,
    _invoice_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    prefix TEXT;
BEGIN
    -- Get prefix based on type
    prefix := CASE _invoice_type
        WHEN 'sales' THEN 'INV-'
        WHEN 'purchase' THEN 'PUR-'
        WHEN 'credit_note' THEN 'CR-'
        WHEN 'debit_note' THEN 'DR-'
        ELSE 'DOC-'
    END;

    -- Get next number
    SELECT COALESCE(MAX(
        CAST(REGEXP_REPLACE(invoice_number, '[^0-9]', '', 'g') AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM public.invoices
    WHERE company_id = _company_id
    AND invoice_type = _invoice_type;

    RETURN prefix || LPAD(next_num::TEXT, 6, '0');
END;
$$;

-- Function to get next project number
CREATE OR REPLACE FUNCTION public.get_next_project_number(_company_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(project_number), 0) + 1
    INTO next_num
    FROM public.projects
    WHERE company_id = _company_id;

    RETURN next_num;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_next_invoice_number(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_project_number(UUID) TO authenticated;

-- =====================================================
-- 8. UPDATE STOCK FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    qty_change NUMERIC;
    new_avg_cost NUMERIC;
    current_qty NUMERIC;
    current_total_cost NUMERIC;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Determine quantity change based on movement type
        IF NEW.movement_type IN ('purchase', 'return_in', 'adjustment_in', 'transfer_in', 'production_in', 'opening_balance') THEN
            qty_change := NEW.quantity;
        ELSE
            qty_change := -NEW.quantity;
        END IF;

        -- Get current stock
        SELECT quantity_on_hand, quantity_on_hand * COALESCE(average_cost, 0)
        INTO current_qty, current_total_cost
        FROM public.inventory_items
        WHERE id = NEW.item_id;

        -- Calculate new average cost for incoming stock
        IF qty_change > 0 AND NEW.unit_cost IS NOT NULL THEN
            new_avg_cost := (COALESCE(current_total_cost, 0) + (NEW.quantity * NEW.unit_cost)) 
                           / (COALESCE(current_qty, 0) + NEW.quantity);
        ELSE
            SELECT average_cost INTO new_avg_cost FROM public.inventory_items WHERE id = NEW.item_id;
        END IF;

        -- Update inventory
        UPDATE public.inventory_items
        SET 
            quantity_on_hand = quantity_on_hand + qty_change,
            average_cost = COALESCE(new_avg_cost, average_cost),
            last_cost = CASE WHEN NEW.unit_cost IS NOT NULL THEN NEW.unit_cost ELSE last_cost END,
            updated_at = now()
        WHERE id = NEW.item_id;

        -- Update balance after in movement record
        UPDATE public.stock_movements
        SET 
            balance_after = (SELECT quantity_on_hand FROM public.inventory_items WHERE id = NEW.item_id),
            average_cost_after = new_avg_cost
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

-- Apply trigger
DROP TRIGGER IF EXISTS update_stock_on_movement ON public.stock_movements;
CREATE TRIGGER update_stock_on_movement
    AFTER INSERT ON public.stock_movements
    FOR EACH ROW EXECUTE FUNCTION public.update_inventory_stock();
