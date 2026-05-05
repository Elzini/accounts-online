import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ZatcaQrBlock } from '@/components/invoices/ZatcaQrBlock';
import { useZatcaPhase2QR } from '@/hooks/useZatcaPhase2QR';
import { InvoiceTemplateData } from './types';

interface Props { data: InvoiceTemplateData; }

/**
 * Template 7 — ZATCA detailed tax invoice (matches reference image).
 * Header: QR (left) | bilingual title (center) | meta block (right with serial + dates).
 * Two stacked party cards (supplier / customer) with name+IDs and structured address.
 * 6-column items table and a 3-row totals stack.
 */
export const InvoiceTemplate7 = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const {
    invoiceNumber, invoiceDate,
    sellerName, sellerTaxNumber, sellerAddress, sellerCommercialRegister,
    sellerCity, sellerDistrict,
    buyerName, buyerTaxNumber, buyerAddress, buyerCommercialRegister,
    items, subtotal, taxAmount, total,
    taxSettings, invoiceType,
  } = data;

  const formattedDate = format(new Date(invoiceDate), 'yyyy-MM-dd');
  const vatNumber = invoiceType === 'sale' ? (taxSettings?.tax_number || '') : (sellerTaxNumber || '');
  const companyName = taxSettings?.company_name_ar || sellerName;
  const companyStreet = sellerAddress || taxSettings?.national_address || '';
  const companyDistrict = sellerDistrict || '';
  const companyBuilding = (taxSettings as any)?.building_number || '';
  const companyCity = sellerCity || (taxSettings as any)?.city || '';
  const companyPostal = (taxSettings as any)?.postal_code || '';
  const companyCR = sellerCommercialRegister || taxSettings?.commercial_register || '';

  const buyerStreet = buyerAddress || '';
  const buyerCity = (data as any).buyerCity || '';
  const buyerPostal = (data as any).buyerPostal || '';
  const buyerDistrict = (data as any).buyerDistrict || '';
  const buyerBuilding = (data as any).buyerBuilding || '';

  const qrData = useZatcaPhase2QR({
    sellerName: companyName,
    vatNumber: vatNumber || '300000000000003',
    invoiceDateTime: invoiceDate,
    invoiceTotal: total,
    vatAmount: taxAmount,
    invoiceNumber,
    officialQrData: data.officialQrData,
  });

  const fmt = (n: number, dec = 2) =>
    n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-0.5">
      <div className="font-bold text-[12px]">{label}</div>
      <div className="text-[12px]" dir="ltr">{value}</div>
    </div>
  );

  return (
    <div
      ref={ref}
      className="bg-white max-w-[210mm] mx-auto text-black p-6"
      style={{ fontFamily: 'Cairo, Arial, sans-serif', minHeight: '297mm' }}
      dir="rtl"
    >
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6 border border-gray-400 p-4">
        <div className="space-y-1 min-w-[230px]">
          <Row label="الرقم التسلسلي" value={String(invoiceNumber)} />
          <Row label="تاريخ الإصدار" value={formattedDate} />
          <Row label="تاريخ التوريد" value={formattedDate} />
        </div>
        <div className="text-center">
          <div className="text-[20px] font-bold">
            <span dir="ltr">Tax Invoice</span> &nbsp; فاتورة ضريبية
          </div>
        </div>
        <div className="flex justify-end">
          <ZatcaQrBlock value={qrData} size={130} />
        </div>
      </div>

      {/* Supplier card */}
      <div className="border border-gray-400 border-t-0 p-4">
        <div className="font-bold underline mb-2 text-[13px]">بيانات المورد</div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-3">
          <Row label="اسم المورد" value={companyName} />
          <Row label="رقم التسجيل الضريبي" value={vatNumber} />
          <div />
          <Row label="رقم السجل التجاري" value={companyCR} />
        </div>
        <div className="font-bold underline mb-2 text-[13px]">العنوان</div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          <Row label="اسم الشارع" value={companyStreet} />
          <Row label="اسم المدينة" value={companyCity} />
          <Row label="اسم الحي" value={companyDistrict} />
          <Row label="رمز الدولة" value="SA" />
          <Row label="رقم المبنى" value={companyBuilding} />
          <Row label="الرمز البريدي" value={companyPostal} />
        </div>
      </div>

      {/* Customer card */}
      <div className="border border-gray-400 border-t-0 p-4">
        <div className="font-bold underline mb-2 text-[13px]">بيانات العميل</div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-3">
          <Row label="اسم العميل" value={buyerName} />
          <Row label="رقم التسجيل الضريبي" value={buyerTaxNumber || ''} />
          <div />
          <Row label="رقم السجل التجاري" value={buyerCommercialRegister || ''} />
        </div>
        <div className="font-bold underline mb-2 text-[13px]">العنوان</div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          <Row label="اسم الشارع" value={buyerStreet} />
          <Row label="اسم المدينة" value={buyerCity} />
          <Row label="اسم الحي" value={buyerDistrict} />
          <Row label="رمز الدولة" value="SA" />
          <Row label="رقم المبنى" value={buyerBuilding} />
          <Row label="الرمز البريدي" value={buyerPostal} />
        </div>
      </div>

      {/* Items table */}
      <table className="w-full border-collapse text-[12px] mt-0">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-400 p-2">الإجمالي شامل الضريبة</th>
            <th className="border border-gray-400 p-2">مبلغ الضريبة</th>
            <th className="border border-gray-400 p-2">الإجمالي قبل الضريبة</th>
            <th className="border border-gray-400 p-2">سعر الوحدة</th>
            <th className="border border-gray-400 p-2">الكمية</th>
            <th className="border border-gray-400 p-2 text-right">وصف السلعة أو الخدمة</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const lineSub = item.unitPrice * item.quantity;
            const lineTax = item.taxAmount ?? (lineSub * (item.taxRate / 100));
            const lineTotal = lineSub + lineTax;
            return (
              <tr key={i}>
                <td className="border border-gray-400 p-2 text-center">{fmt(lineTotal)}</td>
                <td className="border border-gray-400 p-2 text-center">{fmt(lineTax)}</td>
                <td className="border border-gray-400 p-2 text-center">{fmt(lineSub)}</td>
                <td className="border border-gray-400 p-2 text-center">{fmt(item.unitPrice, 5)}</td>
                <td className="border border-gray-400 p-2 text-center">{fmt(item.quantity)}</td>
                <td className="border border-gray-400 p-2 text-right">{item.description}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-4 w-full">
        <div className="grid grid-cols-[1fr_160px] gap-2 py-1">
          <div className="font-bold text-right pr-4">المبلغ الخاضع للضريبة (غير شامل ضريبة القيمة المضافة)</div>
          <div className="text-right font-bold">{fmt(subtotal)}</div>
        </div>
        <div className="grid grid-cols-[1fr_160px] gap-2 py-1">
          <div className="font-bold text-right pr-4">اجمالي مبلغ ضريبة القيمة المضافة</div>
          <div className="text-right font-bold">{fmt(taxAmount)}</div>
        </div>
        <div className="grid grid-cols-[1fr_160px] gap-2 py-1">
          <div className="font-bold text-right pr-4">اجمالي قيمة الفاتورة (شامل ضريبة القيمة المضافة)</div>
          <div className="text-right font-bold">{fmt(total)}</div>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate7.displayName = 'InvoiceTemplate7';
