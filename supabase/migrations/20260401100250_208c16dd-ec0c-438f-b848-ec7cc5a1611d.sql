UPDATE invoices 
SET subtotal = ROUND(109191.0 / 1.15, 2),
    vat_amount = ROUND(109191.0 - (109191.0 / 1.15), 2),
    total = 109191.0
WHERE id = '49e6fa52-a836-4332-af83-e7bdc279ac2f';