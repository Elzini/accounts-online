-- Create fixed assets table
CREATE TABLE public.fixed_assets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_number SERIAL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    purchase_date DATE NOT NULL,
    purchase_price NUMERIC(15,2) NOT NULL CHECK (purchase_price >= 0),
    salvage_value NUMERIC(15,2) DEFAULT 0 CHECK (salvage_value >= 0),
    useful_life_years INTEGER NOT NULL CHECK (useful_life_years > 0),
    depreciation_method VARCHAR(50) DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'units_of_production')),
    depreciation_rate NUMERIC(5,2),
    accumulated_depreciation NUMERIC(15,2) DEFAULT 0,
    current_value NUMERIC(15,2),
    location VARCHAR(255),
    serial_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'fully_depreciated', 'under_maintenance')),
    disposal_date DATE,
    disposal_value NUMERIC(15,2),
    disposal_notes TEXT,
    account_category_id UUID REFERENCES public.account_categories(id),
    depreciation_account_id UUID REFERENCES public.account_categories(id),
    accumulated_depreciation_account_id UUID REFERENCES public.account_categories(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_depreciation CHECK (accumulated_depreciation <= purchase_price - salvage_value)
);

-- Create depreciation entries table
CREATE TABLE public.depreciation_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    depreciation_amount NUMERIC(15,2) NOT NULL CHECK (depreciation_amount >= 0),
    accumulated_after NUMERIC(15,2) NOT NULL,
    book_value_after NUMERIC(15,2) NOT NULL,
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create asset categories table
CREATE TABLE public.asset_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    default_useful_life INTEGER,
    default_depreciation_method VARCHAR(50) DEFAULT 'straight_line',
    default_depreciation_rate NUMERIC(5,2),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depreciation_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fixed_assets
CREATE POLICY "Users can view fixed assets in their company" 
ON public.fixed_assets FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert fixed assets in their company" 
ON public.fixed_assets FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update fixed assets in their company" 
ON public.fixed_assets FOR UPDATE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete fixed assets in their company" 
ON public.fixed_assets FOR DELETE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for depreciation_entries
CREATE POLICY "Users can view depreciation entries in their company" 
ON public.depreciation_entries FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert depreciation entries in their company" 
ON public.depreciation_entries FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update depreciation entries in their company" 
ON public.depreciation_entries FOR UPDATE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete depreciation entries in their company" 
ON public.depreciation_entries FOR DELETE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for asset_categories
CREATE POLICY "Users can view asset categories in their company" 
ON public.asset_categories FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert asset categories in their company" 
ON public.asset_categories FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update asset categories in their company" 
ON public.asset_categories FOR UPDATE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete asset categories in their company" 
ON public.asset_categories FOR DELETE 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_fixed_assets_updated_at
    BEFORE UPDATE ON public.fixed_assets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_categories_updated_at
    BEFORE UPDATE ON public.asset_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate depreciation
CREATE OR REPLACE FUNCTION public.calculate_depreciation(
    p_purchase_price NUMERIC,
    p_salvage_value NUMERIC,
    p_useful_life_years INTEGER,
    p_depreciation_method VARCHAR,
    p_depreciation_rate NUMERIC DEFAULT NULL,
    p_accumulated_depreciation NUMERIC DEFAULT 0
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_depreciable_base NUMERIC;
    v_annual_depreciation NUMERIC;
    v_book_value NUMERIC;
BEGIN
    v_depreciable_base := p_purchase_price - p_salvage_value;
    v_book_value := p_purchase_price - p_accumulated_depreciation;
    
    CASE p_depreciation_method
        WHEN 'straight_line' THEN
            v_annual_depreciation := v_depreciable_base / p_useful_life_years;
        WHEN 'declining_balance' THEN
            IF p_depreciation_rate IS NULL THEN
                p_depreciation_rate := (2.0 / p_useful_life_years) * 100;
            END IF;
            v_annual_depreciation := v_book_value * (p_depreciation_rate / 100);
            -- Don't depreciate below salvage value
            IF (v_book_value - v_annual_depreciation) < p_salvage_value THEN
                v_annual_depreciation := v_book_value - p_salvage_value;
            END IF;
        ELSE
            v_annual_depreciation := v_depreciable_base / p_useful_life_years;
    END CASE;
    
    -- Don't return negative depreciation
    IF v_annual_depreciation < 0 THEN
        v_annual_depreciation := 0;
    END IF;
    
    RETURN ROUND(v_annual_depreciation, 2);
END;
$$;

-- Insert default asset categories for new companies
CREATE OR REPLACE FUNCTION public.initialize_default_asset_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.asset_categories (company_id, name, default_useful_life, default_depreciation_method, description)
    VALUES 
        (NEW.id, 'مباني وإنشاءات', 25, 'straight_line', 'المباني والإنشاءات'),
        (NEW.id, 'آلات ومعدات', 10, 'straight_line', 'الآلات والمعدات الصناعية'),
        (NEW.id, 'أثاث ومفروشات', 5, 'straight_line', 'الأثاث المكتبي والمفروشات'),
        (NEW.id, 'أجهزة حاسب آلي', 3, 'straight_line', 'أجهزة الكمبيوتر والتقنية'),
        (NEW.id, 'سيارات ومركبات', 5, 'straight_line', 'السيارات والمركبات'),
        (NEW.id, 'تجهيزات مكتبية', 5, 'straight_line', 'التجهيزات المكتبية');
    
    RETURN NEW;
END;
$$;

-- Create trigger to initialize default asset categories for new companies
CREATE TRIGGER initialize_asset_categories_on_company_create
    AFTER INSERT ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.initialize_default_asset_categories();