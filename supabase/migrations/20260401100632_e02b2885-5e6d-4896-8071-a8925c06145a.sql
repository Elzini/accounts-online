-- Fix invoice items: treat current taxable_amount as the tax-INCLUSIVE total
UPDATE invoice_items 
SET 
  total = taxable_amount,
  vat_amount = ROUND(taxable_amount - (taxable_amount / 1.15), 2),
  taxable_amount = ROUND(taxable_amount / 1.15, 2),
  unit_price = ROUND((taxable_amount / 1.15) / quantity, 2)
WHERE invoice_id = '49e6fa52-a836-4332-af83-e7bdc279ac2f';