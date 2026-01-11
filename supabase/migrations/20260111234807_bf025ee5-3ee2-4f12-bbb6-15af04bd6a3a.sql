-- Add more settings for section labels and customization
INSERT INTO public.app_settings (key, value) VALUES
  ('dashboard_title', 'لوحة التحكم'),
  ('purchases_title', 'المشتريات'),
  ('sales_title', 'المبيعات'),
  ('customers_title', 'العملاء'),
  ('suppliers_title', 'الموردين'),
  ('reports_title', 'التقارير'),
  ('welcome_message', 'مرحباً بك في نظام إدارة معرض أشبال النمر للسيارات')
ON CONFLICT (key) DO NOTHING;