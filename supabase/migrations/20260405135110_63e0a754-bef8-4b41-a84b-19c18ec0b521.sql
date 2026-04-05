
ALTER TABLE invoice_items DISABLE TRIGGER trg_protect_approved_invoice_items;
ALTER TABLE journal_entries DISABLE TRIGGER trg_protect_posted_journal_entries;
ALTER TABLE invoices DISABLE TRIGGER trg_protect_approved_invoices;

UPDATE invoices SET journal_entry_id = NULL WHERE id IN ('8cae8d7c-aee1-4c39-9feb-315034a53a5f', 'b94b5ae2-d4fa-44ca-8ab6-5cc053f69bb2', '11af380c-64ff-45b3-9a95-69c4cce2ceae');

UPDATE journal_entries SET is_posted = false WHERE id IN ('94a8b8d7-cdd5-4261-b98e-7ccdba3aced4', 'd1d8a1eb-e77d-4b06-a34b-624a57a26205', '1cbde350-541b-46c8-b601-7ff71224da95');

DELETE FROM journal_entry_lines WHERE journal_entry_id IN ('94a8b8d7-cdd5-4261-b98e-7ccdba3aced4', 'd1d8a1eb-e77d-4b06-a34b-624a57a26205', '1cbde350-541b-46c8-b601-7ff71224da95');

DELETE FROM journal_entries WHERE id IN ('94a8b8d7-cdd5-4261-b98e-7ccdba3aced4', 'd1d8a1eb-e77d-4b06-a34b-624a57a26205', '1cbde350-541b-46c8-b601-7ff71224da95');

DELETE FROM invoice_items WHERE invoice_id IN ('8cae8d7c-aee1-4c39-9feb-315034a53a5f', 'b94b5ae2-d4fa-44ca-8ab6-5cc053f69bb2', '11af380c-64ff-45b3-9a95-69c4cce2ceae');

DELETE FROM invoices WHERE id IN ('8cae8d7c-aee1-4c39-9feb-315034a53a5f', 'b94b5ae2-d4fa-44ca-8ab6-5cc053f69bb2', '11af380c-64ff-45b3-9a95-69c4cce2ceae');

ALTER TABLE invoice_items ENABLE TRIGGER trg_protect_approved_invoice_items;
ALTER TABLE journal_entries ENABLE TRIGGER trg_protect_posted_journal_entries;
ALTER TABLE invoices ENABLE TRIGGER trg_protect_approved_invoices;

UPDATE invoices SET invoice_number = 'PUR-12' WHERE id = '153db888-3eb8-47b9-b42f-878b942c3459';
UPDATE invoices SET invoice_number = 'PUR-13' WHERE id = 'a68cff20-c592-4a24-9b84-1c140783c7bd';
UPDATE invoices SET invoice_number = 'PUR-14' WHERE id = '9110502d-60d9-454b-be81-a7c16e782eb8';
UPDATE invoices SET invoice_number = 'PUR-15' WHERE id = 'd36163cd-2b25-43f9-b379-d3cca90724a5';
UPDATE invoices SET invoice_number = 'PUR-16' WHERE id = '63fcf01d-2119-40b2-a578-f6c81df5a93c';
UPDATE invoices SET invoice_number = 'PUR-17' WHERE id = 'c602819a-0184-4128-a76d-a1a7a32c0b12';
UPDATE invoices SET invoice_number = 'PUR-18' WHERE id = 'b1d56680-6a81-4fc5-a21c-bf41fe134f2a';
UPDATE invoices SET invoice_number = 'PUR-19' WHERE id = 'af8653af-4643-4f23-9372-6c7b436cc707';
UPDATE invoices SET invoice_number = 'PUR-20' WHERE id = '7f78dc5e-b41b-4233-974d-f094b75f3e69';
UPDATE invoices SET invoice_number = 'PUR-21' WHERE id = 'a6fd680f-5aef-462f-a947-45df76250dc5';
UPDATE invoices SET invoice_number = 'PUR-22' WHERE id = '765e98d2-9a20-499d-838a-fcb808a34b5b';
UPDATE invoices SET invoice_number = 'PUR-23' WHERE id = 'e830331e-fd1d-40f7-9bb5-936a7985a2ed';
UPDATE invoices SET invoice_number = 'PUR-24' WHERE id = '459b11d5-a05e-4f83-a573-8ebe8461620b';
UPDATE invoices SET invoice_number = 'PUR-25' WHERE id = 'e50f0c55-46ee-4b6e-b8d6-ffcfcb84cc75';
UPDATE invoices SET invoice_number = 'PUR-26' WHERE id = 'b0f9448b-4c7e-40f5-8b9f-7e256637816d';
UPDATE invoices SET invoice_number = 'PUR-27' WHERE id = '4c9c33b8-d466-473e-b9aa-12cf4d7660e5';
UPDATE invoices SET invoice_number = 'PUR-28' WHERE id = '7964fa19-b883-4814-bf60-5ebea6532450';
UPDATE invoices SET invoice_number = 'PUR-29' WHERE id = 'add87ffc-17e6-4751-a32b-193b1d65fb66';
UPDATE invoices SET invoice_number = 'PUR-30' WHERE id = '34b8faae-0a19-4dd9-9565-8199140bd1a2';
UPDATE invoices SET invoice_number = 'PUR-31' WHERE id = '3200b1a6-3ea3-4978-a2b1-f1ef27d1e6cd';
