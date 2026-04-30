import { forwardRef } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { useZatcaPhase2QR } from '@/hooks/useZatcaPhase2QR';
import { numberToArabicWords } from '@/lib/numberToArabicWords';
import logoImage from '@/assets/logo.png';
import { InvoiceTemplateData, defaultInvoiceLabels } from './types';
import { getZatcaPhase2DisplayState } from '@/lib/zatcaPhase2Status';

interface Props { data: InvoiceTemplateData; }

export const InvoiceTemplate1 = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const {
    invoiceNumber, invoiceDate, sellerName, sellerTaxNumber, sellerAddress,
    buyerName, buyerPhone, buyerAddress, buyerTaxNumber,
    items, subtotal, discountAmount = 0, taxAmount, total,
    taxSettings, companyLogoUrl, salesmanName, branchName, invoiceType,
  } = data;
  const L = { ...defaultInvoiceLabels, ...data.customLabels };

  const displayLogo = companyLogoUrl || null;
  const formattedDate = format(new Date(invoiceDate), 'yyyy/MM/dd');
  const taxRate = taxSettings?.tax_rate || 15;
  const vatNumber = invoiceType === 'sale' ? (taxSettings?.tax_number || '') : (sellerTaxNumber || '');

  const qrData = useZatcaPhase2QR({
    sellerName: invoiceType === 'sale' ? (taxSettings?.company_name_ar || sellerName) : sellerName,
    vatNumber: vatNumber || '300000000000003',
    invoiceDateTime: invoiceDate,
    invoiceTotal: total, vatAmount: taxAmount,
    invoiceNumber,
    officialQrData: data.officialQrData,
  });
  const phase2State = getZatcaPhase2DisplayState({ officialQrData: data.officialQrData, zatcaStatus: data.zatcaStatus });

  const itemsWithTax = items.map(item => ({
    ...item,
    taxAmount: item.taxAmount ?? (item.unitPrice * item.quantity * (item.taxRate / 100))
  }));

  const subtotalAfterDiscount = subtotal - discountAmount;

  return (
    <div ref={ref} className="bg-white max-w-[210mm] mx-auto text-black text-sm" style={{ fontFamily: 'Cairo, Arial, sans-serif' }} dir="rtl">
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-800">
        <div className="flex justify-between items-start">
          {displayLogo && (
            <div className="flex items-center gap-3">
              <img src={displayLogo} alt="شعار" className="h-16 w-auto object-contain" />
            </div>
          )}
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold">{taxSettings?.company_name_ar || sellerName}</h1>
            <p className="text-xs text-gray-600">{sellerAddress}</p>
            <p className="text-xs" dir="ltr">Vat : {vatNumber}</p>
          </div>
          <div className="text-left text-xs">
            <QRCodeSVG value={qrData} size={130} level="L" includeMargin={true} />
            <div className={`mt-1 text-center text-[9px] font-bold rounded px-2 py-0.5 ${phase2State.isPhase2Approved ? 'bg-black text-white' : ''}`}>{phase2State.label}</div>
          </div>
        </div>
      </div>

      {/* Invoice Title */}
       <div className="text-center py-2 border-b">
         <h2 className="text-lg font-bold">
           {invoiceType === 'purchase' ? 'فاتورة مشتريات' : L.invoiceTitle} {data.paymentMethod === 'credit' ? '- آجل' : data.paymentMethod === 'bank' ? '- تحويل بنكي' : '- نقدي'}
         </h2>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-0 border-b text-xs">
        <div className="p-2 border-l">
          <div className="flex justify-between"><span className="text-gray-500">Store/Branch المعرض/الفرع</span><span className="font-medium">{branchName || 'الرئيسي'}</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-500">Sales Man مندوب المبيعات</span><span className="font-medium">{salesmanName || '-'}</span></div>
           <div className="flex justify-between mt-1">
             <span className="text-gray-500">{invoiceType === 'purchase' ? 'Supplier المورد' : `${L.buyerLabelEn} ${L.buyerLabel}`}</span>
            <span className="font-medium">{invoiceType === 'purchase' ? sellerName : buyerName}</span>
          </div>
        </div>
        <div className="p-2 border-l">
          <div className="flex justify-between"><span className="text-gray-500">Date التاريخ</span><span className="font-medium">{formattedDate}</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-500">Mobile الجوال</span><span className="font-medium" dir="ltr">{invoiceType === 'purchase' ? (data.sellerPhone || '-') : (buyerPhone || '-')}</span></div>
        </div>
        <div className="p-2">
          <div className="flex justify-between"><span className="text-gray-500">Trans. No. رقم الفاتورة</span><span className="font-bold">{invoiceNumber}</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-500">Voucher No. رقم السند</span><span className="font-bold">{data.voucherNumber || invoiceNumber}</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-500">Address العنوان</span><span className="font-medium">{invoiceType === 'purchase' ? (sellerAddress || '-') : (buyerAddress || '-')}</span></div>
        </div>
      </div>

      {/* VAT Number */}
       <div className="flex justify-between px-4 py-1 border-b text-xs bg-gray-50">
         <span>{invoiceType === 'purchase' ? 'Supplier VAT NO. الرقم الضريبي المورد' : `${L.buyerLabelEn} VAT NO. الرقم الضريبي ${L.buyerLabel}`}</span>
         <span className="font-bold" dir="ltr">{invoiceType === 'purchase' ? (sellerTaxNumber || '-') : (buyerTaxNumber || '-')}</span>
       </div>
      {data.plateNumber && (
        <div className="flex justify-between px-4 py-1 border-b text-xs bg-gray-50">
          <span>{L.plateNumberLabelEn} {L.plateNumberLabel}</span>
          <span className="font-bold">{data.plateNumber}</span>
        </div>
      )}

      {/* Items Table */}
      <table className="w-full text-xs border-collapse">
        <thead>
           <tr className="bg-gray-100 border-b">
             <th className="p-2 border-l text-right">#</th>
             <th className="p-2 border-l text-right">{L.descriptionColumn}</th>
             <th className="p-2 border-l text-center">{L.quantityColumn}</th>
             <th className="p-2 border-l text-center">{L.priceColumn} Price</th>
             <th className="p-2 text-center">{L.totalColumn}</th>
           </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="p-2 border-l text-right">{i + 1}</td>
              <td className="p-2 border-l text-right">{item.description}</td>
              <td className="p-2 border-l text-center">{item.quantity}</td>
              <td className="p-2 border-l text-center">{item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="p-2 text-center">{item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals + QR */}
      <div className="flex border-t">
        <div className="flex-1 p-3">
           <div className="flex justify-between py-1"><span>{L.subtotalLabel}</span><span>{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
           {discountAmount > 0 && (
             <div className="flex justify-between py-1"><span>الاجمالي بعد الخصم</span><span>{subtotalAfterDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
           )}
           <div className="flex justify-between py-1"><span>{L.taxLabel} {taxRate}%</span><span>{taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
           <div className="flex justify-between py-1 font-bold text-base border-t mt-1 pt-2"><span>{L.grandTotalLabel}</span><span>{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        </div>
        <div className="p-3 border-r flex items-center">
          <div>
            <QRCodeSVG value={qrData} size={150} level="L" includeMargin={true} />
            <div className={`mt-1 text-center text-[9px] font-bold rounded px-2 py-0.5 ${phase2State.isPhase2Approved ? 'bg-black text-white' : ''}`}>{phase2State.label}</div>
          </div>
        </div>
      </div>

      {/* Total in words */}
      <div className="border-t p-2 text-xs">
        <div className="flex gap-2">
          <span className="font-bold">Total Amount إجمالي القيمة</span>
          <span>{total.toLocaleString('en', { minimumFractionDigits: 0 })}</span>
        </div>
        <div className="mt-1">{numberToArabicWords(Math.round(total))} ريال فقط لا غير</div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-4 p-4 mt-8 border-t">
        <div className="text-center">
          <div className="border-b border-gray-400 pb-8 mb-1"></div>
          <p className="text-xs text-gray-500">{invoiceType === 'purchase' ? 'Supplier المورد' : `${L.buyerLabelEn} ${L.buyerLabel}`}</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gray-400 pb-8 mb-1"></div>
          <p className="text-xs text-gray-500">Sales Manager مدير المبيعات</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gray-400 pb-8 mb-1"></div>
          <p className="text-xs text-gray-500">Account Manager مدير الحسابات</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-500 border-t p-2">
        <p>{sellerAddress}</p>
        <p className="mt-1">{formattedDate}</p>
      </div>
    </div>
  );
});

InvoiceTemplate1.displayName = 'InvoiceTemplate1';
