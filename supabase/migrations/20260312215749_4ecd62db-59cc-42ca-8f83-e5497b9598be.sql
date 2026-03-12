
-- Delete the last amount change record
DELETE FROM custody_amount_changes WHERE id = '49a93297-0957-41d1-b80b-c17e5ff21cca';

-- Revert custody amount back to original
UPDATE custodies SET custody_amount = 34837 WHERE id = '5e56b392-1055-40d3-91af-d02bade4aada';
