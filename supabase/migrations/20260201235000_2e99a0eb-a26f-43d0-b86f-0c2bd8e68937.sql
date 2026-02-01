-- Fix function search path for calculate_depreciation
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
SECURITY INVOKER
SET search_path = public
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
            IF (v_book_value - v_annual_depreciation) < p_salvage_value THEN
                v_annual_depreciation := v_book_value - p_salvage_value;
            END IF;
        ELSE
            v_annual_depreciation := v_depreciable_base / p_useful_life_years;
    END CASE;
    
    IF v_annual_depreciation < 0 THEN
        v_annual_depreciation := 0;
    END IF;
    
    RETURN ROUND(v_annual_depreciation, 2);
END;
$$;