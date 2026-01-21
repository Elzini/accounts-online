-- Add invoice_settings column to companies table for invoice customization
ALTER TABLE companies ADD COLUMN IF NOT EXISTS invoice_settings JSONB DEFAULT '{
  "template": "modern",
  "primary_color": "#059669",
  "show_logo": true,
  "show_qr": true,
  "show_terms": true,
  "terms_text": "شكراً لتعاملكم معنا",
  "footer_text": "هذه الفاتورة صادرة وفقاً لنظام الفوترة الإلكترونية في المملكة العربية السعودية"
}'::jsonb;

-- Add invoice_logo_url column for custom invoice logo (separate from company logo)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS invoice_logo_url TEXT;

COMMENT ON COLUMN companies.invoice_settings IS 'إعدادات الفاتورة الإلكترونية: القالب، الألوان، إظهار/إخفاء العناصر';
COMMENT ON COLUMN companies.invoice_logo_url IS 'رابط شعار الفاتورة (منفصل عن شعار الشركة)';