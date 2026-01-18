-- 1. جدول فئات المصروفات
CREATE TABLE public.expense_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. جدول المصروفات
CREATE TABLE public.expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    amount numeric NOT NULL,
    description text NOT NULL,
    expense_date date NOT NULL DEFAULT CURRENT_DATE,
    payment_method text DEFAULT 'cash',
    reference_number text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. جدول عروض الأسعار
CREATE TABLE public.quotations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    quotation_number serial,
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name text,
    customer_phone text,
    total_amount numeric NOT NULL DEFAULT 0,
    discount numeric DEFAULT 0,
    tax_amount numeric DEFAULT 0,
    final_amount numeric NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'draft',
    valid_until date,
    notes text,
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. جدول بنود عروض الأسعار
CREATE TABLE public.quotation_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id uuid REFERENCES public.quotations(id) ON DELETE CASCADE NOT NULL,
    car_id uuid REFERENCES public.cars(id) ON DELETE SET NULL,
    description text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    unit_price numeric NOT NULL,
    total_price numeric NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. جدول مبيعات الأقساط
CREATE TABLE public.installment_sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
    total_amount numeric NOT NULL,
    down_payment numeric NOT NULL DEFAULT 0,
    remaining_amount numeric NOT NULL,
    number_of_installments integer NOT NULL,
    installment_amount numeric NOT NULL,
    start_date date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'active',
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 6. جدول دفعات الأقساط
CREATE TABLE public.installment_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_sale_id uuid REFERENCES public.installment_sales(id) ON DELETE CASCADE NOT NULL,
    payment_number integer NOT NULL,
    due_date date NOT NULL,
    amount numeric NOT NULL,
    paid_amount numeric DEFAULT 0,
    paid_date date,
    status text NOT NULL DEFAULT 'pending',
    payment_method text,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 7. جدول سندات القبض والصرف
CREATE TABLE public.vouchers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    voucher_number serial,
    voucher_type text NOT NULL, -- 'receipt' أو 'payment'
    amount numeric NOT NULL,
    related_to text, -- 'customer', 'supplier', 'expense', 'installment'
    related_id uuid,
    description text NOT NULL,
    voucher_date date NOT NULL DEFAULT CURRENT_DATE,
    payment_method text DEFAULT 'cash',
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories
CREATE POLICY "View expense_categories in company" ON public.expense_categories
    FOR SELECT USING (is_super_admin(auth.uid()) OR company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Manage expense_categories in company" ON public.expense_categories
    FOR ALL USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

-- RLS Policies for expenses
CREATE POLICY "View expenses in company" ON public.expenses
    FOR SELECT USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'reports') OR is_admin(auth.uid()))));

CREATE POLICY "Insert expenses in company" ON public.expenses
    FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid())));

CREATE POLICY "Update expenses in company" ON public.expenses
    FOR UPDATE USING (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid())));

CREATE POLICY "Delete expenses in company" ON public.expenses
    FOR DELETE USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

-- RLS Policies for quotations
CREATE POLICY "View quotations in company" ON public.quotations
    FOR SELECT USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid()))));

CREATE POLICY "Insert quotations in company" ON public.quotations
    FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid())));

CREATE POLICY "Update quotations in company" ON public.quotations
    FOR UPDATE USING (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid())));

CREATE POLICY "Delete quotations in company" ON public.quotations
    FOR DELETE USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

-- RLS Policies for quotation_items
CREATE POLICY "View quotation_items via quotation" ON public.quotation_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND (is_super_admin(auth.uid()) OR (q.company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid()))))));

CREATE POLICY "Manage quotation_items via quotation" ON public.quotation_items
    FOR ALL USING (EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND (is_super_admin(auth.uid()) OR (q.company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid()))))));

-- RLS Policies for installment_sales
CREATE POLICY "View installment_sales in company" ON public.installment_sales
    FOR SELECT USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales') OR has_permission(auth.uid(), 'reports') OR is_admin(auth.uid()))));

CREATE POLICY "Insert installment_sales in company" ON public.installment_sales
    FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid())));

CREATE POLICY "Update installment_sales in company" ON public.installment_sales
    FOR UPDATE USING (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid())));

CREATE POLICY "Delete installment_sales in company" ON public.installment_sales
    FOR DELETE USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

-- RLS Policies for installment_payments
CREATE POLICY "View installment_payments via sale" ON public.installment_payments
    FOR SELECT USING (EXISTS (SELECT 1 FROM installment_sales i WHERE i.id = installment_payments.installment_sale_id AND (is_super_admin(auth.uid()) OR (i.company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales') OR has_permission(auth.uid(), 'reports') OR is_admin(auth.uid()))))));

CREATE POLICY "Manage installment_payments via sale" ON public.installment_payments
    FOR ALL USING (EXISTS (SELECT 1 FROM installment_sales i WHERE i.id = installment_payments.installment_sale_id AND (is_super_admin(auth.uid()) OR (i.company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid()))))));

-- RLS Policies for vouchers
CREATE POLICY "View vouchers in company" ON public.vouchers
    FOR SELECT USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'reports') OR is_admin(auth.uid()))));

CREATE POLICY "Insert vouchers in company" ON public.vouchers
    FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales') OR has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid())));

CREATE POLICY "Update vouchers in company" ON public.vouchers
    FOR UPDATE USING (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()));

CREATE POLICY "Delete vouchers in company" ON public.vouchers
    FOR DELETE USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

-- Insert default expense categories
CREATE OR REPLACE FUNCTION public.create_default_expense_categories(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO expense_categories (company_id, name, description) VALUES
    (p_company_id, 'إيجار', 'إيجار المعرض أو المكتب'),
    (p_company_id, 'رواتب', 'رواتب الموظفين'),
    (p_company_id, 'كهرباء', 'فواتير الكهرباء'),
    (p_company_id, 'ماء', 'فواتير المياه'),
    (p_company_id, 'صيانة', 'صيانة السيارات والمعدات'),
    (p_company_id, 'مستلزمات', 'مستلزمات المعرض'),
    (p_company_id, 'تسويق', 'مصاريف الإعلانات والتسويق'),
    (p_company_id, 'نقل', 'مصاريف النقل والتوصيل'),
    (p_company_id, 'تأمين', 'مصاريف التأمين'),
    (p_company_id, 'أخرى', 'مصاريف متنوعة أخرى')
    ON CONFLICT DO NOTHING;
END;
$$;