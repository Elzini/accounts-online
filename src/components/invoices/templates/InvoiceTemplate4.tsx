import { forwardRef, useMemo } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { generateZatcaQRData, formatDateTimeForZatca } from '@/lib/zatcaQR';
import { numberToArabicWords } from '@/lib/numberToArabicWords';
import logoImage from '@/assets/logo.png';
import { InvoiceTemplateData } from './types';

interface Props { data: InvoiceTemplateData; }

export const InvoiceTemplate4 = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const {
    invoiceNumber, invoiceDate, sellerName, sellerTaxNumber, sellerAddress,
    buyerName, buyerPhone, buyerAddress, buyerTaxNumber, buyerIdNumber,
    items, subtotal, discountAmount = 0, taxAmount, total,
    taxSettings, invoiceType, salesmanName,
  } = data;

  const formattedDate = format(new Date(invoiceDate), 'yyyy-MM-dd');
  const taxRate = taxSettings?.tax_rate || 15;
  const vatNumber = invoiceType === 'sale' ? (taxSettings?.tax_number || '') : (sellerTaxNumber || '');
  const companyName = taxSettings?.company_name_ar || sellerName;
  const companyAddress = taxSettings?.national_address || sellerAddress || '';

  const qrData = useMemo(() => generateZatcaQRData({
    sellerName: invoiceType === 'sale' ? companyName : sellerName,
    vatNumber: vatNumber || '300000000000003',
    invoiceDateTime: formatDateTimeForZatca(invoiceDate),
    invoiceTotal: total, vatAmount: taxAmount,
  }), [companyName, sellerName, vatNumber, invoiceDate, total, taxAmount]);

  const itemsWithTax = items.map(item => ({
    ...item,
    taxAmount: item.taxAmount ?? (item.unitPrice * item.quantity * (item.taxRate / 100))
  }));

  return (
    <div ref={ref} className="bg-white max-w-[210mm] mx-auto text-black text-[11px]" style={{ fontFamily: 'Cairo, Arial, sans-serif' }} dir="rtl">
      {/* Header - Company Info */}
      <div className="p-4 text-center">
        <h1 className="text-base font-bold">{companyName}</h1>
        <p className="text-[10px] text-gray-600">{companyAddress}</p>
        <div className="flex justify-between mt-1 text-[10px]">
          <span dir="ltr">Vat No: {vatNumber}</span>
          <span>الرقم الضريبي: {vatNumber}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center py-2 border-y-2 border-gray-800">
        <h2 className="text-lg font-bold">فاتورة ضريبية</h2>
        <p className="text-[10px] text-gray-500">نقدية</p>
      </div>

      {/* Date & Invoice Number */}
      <div className="flex justify-between px-4 py-2 border-b">
        <div className="flex gap-2 items-center">
          <span className="text-gray-500">Date التاريخ</span>
          <span className="border border-gray-300 px-2 py-0.5">{formattedDate}</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-gray-500">Invoice No. رقم الفاتورة</span>
          <span className="border border-gray-300 px-2 py-0.5 font-bold">{invoiceNumber}</span>
        </div>
      </div>

      {/* Customer Info - Grid */}
      <div className="px-4 py-2 border-b">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <div className="flex gap-1 border-b border-gray-200 pb-1">
            <span className="text-gray-500 w-20">Cust. Name اسم العميل</span>
            <span className="font-medium flex-1">{buyerName}</span>
          </div>
          <div className="flex gap-1 border-b border-gray-200 pb-1">
            <span className="text-gray-500 w-20">Cust. No. رقم العميل</span>
            <span className="font-medium">{buyerIdNumber || '-'}</span>
          </div>
          <div className="flex gap-1 border-b border-gray-200 pb-1">
            <span className="text-gray-500 w-20">Address العنوان</span>
            <span className="font-medium">{buyerAddress || '-'}</span>
          </div>
          <div className="flex gap-1 border-b border-gray-200 pb-1">
            <span className="text-gray-500 w-20">Phone الهاتف</span>
            <span className="font-medium" dir="ltr">{buyerPhone || '-'}</span>
          </div>
          <div className="flex gap-1 col-span-2 border-b border-gray-200 pb-1">
            <span className="text-gray-500 w-20">VAT No. رقم الضريبة</span>
            <span className="font-bold" dir="ltr">{buyerTaxNumber || '-'}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-[10px] border-collapse mx-0">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="p-1.5 border border-gray-700 text-center w-6">No</th>
            <th className="p-1.5 border border-gray-700 text-center w-16">Item NO الصنف</th>
            <th className="p-1.5 border border-gray-700 text-right">Description البيان</th>
            <th className="p-1.5 border border-gray-700 text-center w-12">Quantity الكمية</th>
            <th className="p-1.5 border border-gray-700 text-center w-16">Price السعر</th>
            <th className="p-1.5 border border-gray-700 text-center w-14">VAT الضريبة</th>
            <th className="p-1.5 border border-gray-700 text-center w-18">Subtotal المجموع</th>
          </tr>
        </thead>
        <tbody>
          {itemsWithTax.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="p-1.5 border text-center">{i + 1}</td>
              <td className="p-1.5 border text-center">{'-'}</td>
              <td className="p-1.5 border text-right">{item.description}</td>
              <td className="p-1.5 border text-center">{item.quantity}</td>
              <td className="p-1.5 border text-center">{item.unitPrice.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
              <td className="p-1.5 border text-center">{item.taxRate}</td>
              <td className="p-1.5 border text-center font-medium">{item.total.toLocaleString('en', { minimumFractionDigits: 0 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Row */}
      <div className="flex border-t-2 border-gray-800">
        {/* QR Code Left */}
        <div className="p-3 flex items-start">
          <QRCodeSVG value={qrData} size={80} level="M" />
        </div>
        {/* Totals Right */}
        <div className="flex-1 text-[10px]">
          <div className="flex justify-between p-1.5 border-b"><span className="font-bold">Total الإجمالي</span><span>{subtotal.toLocaleString('en', { minimumFractionDigits: 1 })}</span></div>
          <div className="flex justify-between p-1.5 border-b"><span className="font-bold">Discount الخصم</span><span>{discountAmount.toLocaleString('en', { minimumFractionDigits: 0 })}</span></div>
          <div className="flex justify-between p-1.5 border-b"><span className="font-bold">VAT الضريبة</span><span>{taxAmount.toLocaleString('en', { minimumFractionDigits: 1 })}</span></div>
          <div className="flex justify-between p-1.5 border-b font-bold text-sm bg-gray-100"><span>Net الصافي</span><span>{total.toLocaleString('en', { minimumFractionDigits: 0 })}</span></div>
          <div className="p-1.5 text-[10px] text-gray-600">{numberToArabicWords(Math.round(total))} ريال</div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-4 p-4 mt-16 border-t">
        <div className="text-center">
          <div className="border-b border-gray-400 pb-8 mb-1"></div>
          <p className="text-[10px]">Received By : المستلم :</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gray-400 pb-8 mb-1"></div>
          <p className="text-[10px]">Salesman : {salesmanName || ''}</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gray-400 pb-8 mb-1"></div>
          <p className="text-[10px]">البائع :</p>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate4.displayName = 'InvoiceTemplate4';
