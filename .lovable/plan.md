## Add new sales invoice template (Template 7) — ZATCA-style detailed tax invoice

Build a new printable invoice template that matches the uploaded image exactly, and make it selectable from the existing template picker so "إنجازات الأجيال" (and any company) can use it.

### Visual layout (matches the screenshot)

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ [QR]      Tax Invoice  فاتورة ضريبية         SI-001693      الرقم التسلسلي │
│                                              2025-06-30     تاريخ الإصدار  │
│                                              2025-06-30     تاريخ التوريد  │
├───────────────────────────────────────────────────────────────────────────┤
│ بيانات المورد                                                              │
│   اسم المورد: ...            رقم التسجيل الضريبي: 30214...                │
│                              رقم السجل التجاري: 11320...                  │
│ العنوان                                                                    │
│   اسم الشارع / اسم الحي / رقم المبنى │ اسم المدينة / رمز الدولة / الرمز البريدي│
├───────────────────────────────────────────────────────────────────────────┤
│ بيانات العميل (same structured layout as supplier)                         │
├───────────────────────────────────────────────────────────────────────────┤
│ وصف السلعة | الكمية | سعر الوحدة | الإجمالي قبل الضريبة | مبلغ الضريبة | الإجمالي شامل الضريبة │
│   بنزين 91 | 20000  | 1.82610   | 36522.00            | 5478.30      | 42000.30             │
├───────────────────────────────────────────────────────────────────────────┤
│                المبلغ الخاضع للضريبة (غير شامل ض.ق.م)        36522.00     │
│                إجمالي مبلغ ضريبة القيمة المضافة             5478.30      │
│                إجمالي قيمة الفاتورة (شامل ض.ق.م)            42000.30     │
└───────────────────────────────────────────────────────────────────────────┘
```

Key visual rules:
- RTL, Cairo font, A4 width, black on white, thin gray borders.
- Header row has 3 columns: QR (right/visual-left), centered bilingual title "Tax Invoice / فاتورة ضريبية", and meta block on the far right with 3 rows: الرقم التسلسلي, تاريخ الإصدار, تاريخ التوريد.
- Two stacked info cards (المورد then العميل) — each with: name + tax/CR numbers on the top, then a 2-column address grid (street/district/building # | city/country code/postal code) with bold underlined section titles "بيانات المورد" / "بيانات العميل" / "العنوان".
- Items table: 6 columns in this order (RTL): الإجمالي شامل الضريبة | مبلغ الضريبة | الإجمالي قبل الضريبة | سعر الوحدة | الكمية | وصف السلعة أو الخدمة. Numbers right-aligned, 2 decimal places (unit price 5 decimals like the screenshot).
- Totals block: 2-column right-aligned, bold labels in Arabic only (no English), no Retention here. Three rows exactly as in image.

### Files to add / change

1. **Create `src/components/invoices/templates/InvoiceTemplate7.tsx`**
   - New forwardRef component using `InvoiceTemplateData`.
   - Reuses `ZatcaQrBlock` + `useZatcaPhase2QR` (same as Template 6) for the QR.
   - Pulls supplier address parts from `taxSettings` (`national_address`, optional `sellerCity`, `sellerDistrict`) + commercial register; falls back to existing fields when split parts aren't available.
   - Pulls buyer address from `buyerAddress`, `buyerCity` if present, `buyerTaxNumber`, `buyerCommercialRegister`.
   - Hardcoded Saudi labels (رمز الدولة = "SA") and shows postal code if present in settings.

2. **Export it** in `src/components/invoices/templates/index.ts`.

3. **Add to type** in `src/components/invoices/templates/types.ts`:
   - Extend `InvoiceTemplateName` union with `'template7'`.

4. **Add to selector** in `src/components/invoices/InvoiceTemplateSelector.tsx`:
   - New entry: id `template7`, name "نموذج الفاتورة الضريبية التفصيلي (ZATCA)", icon 🧾.

5. **Wire in renderer** in `src/components/invoices/InvoicePreviewDialog.tsx`:
   - Import `InvoiceTemplate7` and add `case 'template7': return <InvoiceTemplate7 ... />`.

### Notes

- No DB / backend changes.
- No Retention line on this template (image doesn't include one) — the template ignores `retentionAmount` to keep the layout faithful.
- The template will be available to every company (consistent with how templates 1–6 work). The user just selects it from the existing "اختر نموذج الفاتورة" dialog.
