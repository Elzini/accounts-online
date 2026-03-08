UPDATE menu_configuration SET menu_items = jsonb_set(
  menu_items::jsonb,
  '{5}',
  '{"id": "system", "label": "الإدارة", "visible": true}'::jsonb
) WHERE company_id = 'aafb750f-8c08-4a64-a2b9-bba3b91ebe18';