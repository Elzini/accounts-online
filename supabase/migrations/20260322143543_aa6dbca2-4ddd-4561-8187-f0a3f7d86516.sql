-- Merge duplicate suppliers for company be98c761-377f-41c0-ac43-27d2707295ca

-- 1. مؤسسة غصون التجارية: merge 9d21 -> 85dd (keep 85dd as it has 28 invoices)
UPDATE invoices SET supplier_id = '85dd6751-b70d-4041-9b46-d3207988f1c2' 
WHERE supplier_id = '9d217353-20ed-4f81-a359-04fed4a377ba';

UPDATE checks SET supplier_id = '85dd6751-b70d-4041-9b46-d3207988f1c2' 
WHERE supplier_id = '9d217353-20ed-4f81-a359-04fed4a377ba';

UPDATE purchase_orders SET supplier_id = '85dd6751-b70d-4041-9b46-d3207988f1c2' 
WHERE supplier_id = '9d217353-20ed-4f81-a359-04fed4a377ba';

UPDATE cars SET supplier_id = '85dd6751-b70d-4041-9b46-d3207988f1c2' 
WHERE supplier_id = '9d217353-20ed-4f81-a359-04fed4a377ba';

UPDATE credit_debit_notes SET supplier_id = '85dd6751-b70d-4041-9b46-d3207988f1c2' 
WHERE supplier_id = '9d217353-20ed-4f81-a359-04fed4a377ba';

UPDATE recurring_invoices SET supplier_id = '85dd6751-b70d-4041-9b46-d3207988f1c2' 
WHERE supplier_id = '9d217353-20ed-4f81-a359-04fed4a377ba';

UPDATE purchase_batches SET supplier_id = '85dd6751-b70d-4041-9b46-d3207988f1c2' 
WHERE supplier_id = '9d217353-20ed-4f81-a359-04fed4a377ba';

UPDATE goods_receipts SET supplier_id = '85dd6751-b70d-4041-9b46-d3207988f1c2' 
WHERE supplier_id = '9d217353-20ed-4f81-a359-04fed4a377ba';

UPDATE project_costs SET supplier_id = '85dd6751-b70d-4041-9b46-d3207988f1c2' 
WHERE supplier_id = '9d217353-20ed-4f81-a359-04fed4a377ba';

DELETE FROM supplier_portal_tokens WHERE supplier_id = '9d217353-20ed-4f81-a359-04fed4a377ba';
DELETE FROM suppliers WHERE id = '9d217353-20ed-4f81-a359-04fed4a377ba';

-- 2. مؤسسة لمسة فنون الابداع: keep 5471, delete 7ac8 and 23cf (both have 0 invoices)
DELETE FROM supplier_portal_tokens WHERE supplier_id IN ('7ac816ad-54b9-4f96-87b5-222145764be9', '23cf6212-4548-4bee-991a-de5eeff762e2');
DELETE FROM suppliers WHERE id IN ('7ac816ad-54b9-4f96-87b5-222145764be9', '23cf6212-4548-4bee-991a-de5eeff762e2');