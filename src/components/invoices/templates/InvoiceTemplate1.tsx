import { forwardRef, useMemo } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { generateZatcaQRData, formatDateTimeForZatca } from '@/lib/zatcaQR';
import { numberToArabicWords } from '@/lib/numberToArabicWords';
import logoImage from '@/assets/logo.png';
import { InvoiceTemplateData } from './types';

interface Props { data: InvoiceTemplateData; }

export const InvoiceTemplate1 = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const {
    invoiceNumber, invoiceDate, sellerName, sellerTaxNumber, sellerAddress,
    buyerName, buyerPhone, buyerAddress, buyerTaxNumber,
    items, subtotal, discountAmount = 0, taxAmount, total,
    taxSettings, companyLogoUrl, salesmanName, branchName, invoiceType,
  } = data;

  const displayLogo = companyLogoUrl || logoImage;
  const formattedDate = format(new Date(invoiceDate), 'yyyy/MM/dd');
  const taxRate = taxSettings?.tax_rate || 15;
  const vatNumber = invoiceType === 'sale' ? (taxSettings?.tax_number || '') : (sellerTaxNumber || '');

  const qrData = useMemo(() => generateZatcaQRData({
    sellerName: invoiceType === 'sale' ? (taxSettings?.company_name_ar || sellerName) : sellerName,
    vatNumber: vatNumber || '300000000000003',
    invoiceDateTime: formatDateTimeForZatca(invoiceDate),
    invoiceTotal: total, vatAmount: taxAmount,
  }), [sellerName, vatNumber, invoiceDate, total, taxAmount]);

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
          <div className="flex items-center gap-3">
            <img src={displayLogo} alt="شعار" className="h-16 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).src = logoImage; }} />
          </div>
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold">{taxSettings?.company_name_ar || sellerName}</h1>
            <p className="text-xs text-gray-600">{sellerAddress}</p>
            <p className="text-xs" dir="ltr">Vat : {vatNumber}</p>
          </div>
          <div className="text-left text-xs">
            <QRCodeSVG value={qrData} size={60} level="M" />
          </div>
        </div>
      </div>

      {/* Invoice Title */}
      <div className="text-center py-2 border-b">
        <h2 className="text-lg font-bold">فاتورة ضريبية {data.paymentMethod === 'cash' ? 'نقدي' : ''}</h2>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-0 border-b text-xs">
        <div className="p-2 border-l">
          <div className="flex justify-between"><span className="text-gray-500">Store/Branch المعرض/الفرع</span><span className="font-medium">{branchName || 'الرئيسي'}</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-500">Sales Man مندوب المبيعات</span><span className="font-medium">{salesmanName || '-'}</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-500">Customer العميل</span><span className="font-medium">{buyerName}</span></div>
        </div>
        <div className="p-2 border-l">
          <div className="flex justify-between"><span className="text-gray-500">Date التاريخ</span><span className="font-medium">{formattedDate}</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-500">Mobile الجوال</span><span className="font-medium" dir="ltr">{buyerPhone || '-'}</span></div>
        </div>
        <div className="p-2">
          <div className="flex justify-between"><span className="text-gray-500">Trans. No. رقم الفاتورة</span><span className="font-bold">{invoiceNumber}</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-500">Address العنوان</span><span className="font-medium">{buyerAddress || '-'}</span></div>
        </div>
      </div>

      {/* Customer VAT */}
      <div className="flex justify-between px-4 py-1 border-b text-xs bg-gray-50">
        <span>Customer VAT NO. الرقم الضريبي العميل</span>
        <span className="font-bold" dir="ltr">{buyerTaxNumber || '-'}</span>
      </div>

      {/* Items Table */}
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-2 border-l text-right">#</th>
            <th className="p-2 border-l text-right">البيان</th>
            <th className="p-2 border-l text-center">الكمية</th>
            <th className="p-2 border-l text-center">السعر Price</th>
            <th className="p-2 text-center">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="p-2 border-l text-right">{i + 1}</td>
              <td className="p-2 border-l text-right">{item.description}</td>
              <td className="p-2 border-l text-center">{item.quantity}</td>
              <td className="p-2 border-l text-center">{item.unitPrice.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
              <td className="p-2 text-center">{item.total.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals + QR */}
      <div className="flex border-t">
        <div className="flex-1 p-3">
          <div className="flex justify-between py-1"><span>الاجمالي</span><span>{subtotal.toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
          {discountAmount > 0 && (
            <div className="flex justify-between py-1"><span>الاجمالي بعد الخصم</span><span>{subtotalAfterDiscount.toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
          )}
          <div className="flex justify-between py-1"><span>القيمة المضافة {taxRate}%</span><span>{taxAmount.toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between py-1 font-bold text-base border-t mt-1 pt-2"><span>الاجمالي مع الضريبة</span><span>{total.toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
        </div>
        <div className="p-3 border-r flex items-center">
          <QRCodeSVG value={qrData} size={80} level="M" />
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
          <p className="text-xs text-gray-500">Customer العميل</p>
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
