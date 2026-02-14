import { forwardRef, useMemo } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { generateZatcaQRData, formatDateTimeForZatca } from '@/lib/zatcaQR';
import logoImage from '@/assets/logo.png';
import { InvoiceTemplateData } from './types';

interface Props { data: InvoiceTemplateData; }

export const InvoiceTemplate3 = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const {
    invoiceNumber, invoiceDate, sellerName, sellerTaxNumber, sellerAddress,
    buyerName, buyerPhone, buyerAddress, buyerTaxNumber, buyerIdNumber,
    items, subtotal, discountAmount = 0, taxAmount, total, paidAmount = 0,
    taxSettings, companyLogoUrl, invoiceType, salesmanName, branchName,
  } = data;

  const displayLogo = companyLogoUrl || logoImage;
  const formattedDate = format(new Date(invoiceDate), 'dd-MM-yyyy HH:mm');
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

  const amountDue = total - paidAmount;

  return (
    <div ref={ref} className="bg-white max-w-[210mm] mx-auto text-black text-[11px]" style={{ fontFamily: 'Cairo, Arial, sans-serif' }} dir="rtl">
      {/* Header with blue top bar */}
      <div className="bg-[#3b82f6] h-2"></div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          {/* Company Info Right */}
          <div className="text-right flex-1">
            <h1 className="text-lg font-bold">{companyName}</h1>
            <p className="text-[10px] text-gray-500">{companyAddress}</p>
            <p className="text-[10px]">VAT NUMBER: {vatNumber}</p>
          </div>
          {/* Logo Center */}
          <div className="mx-4">
            <img src={displayLogo} alt="شعار" className="h-16 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).src = logoImage; }} />
          </div>
          {/* QR Left */}
          <div className="text-left">
            <QRCodeSVG value={qrData} size={70} level="M" />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center py-1.5 bg-[#3b82f6]/10 border-y border-[#3b82f6]/30">
        <h2 className="text-base font-bold text-[#3b82f6]">فاتورة ضريبية / Tax Invoice</h2>
      </div>

      {/* Customer & Invoice Info */}
      <div className="grid grid-cols-2 gap-0 p-3">
        {/* Customer Info */}
        <div className="border border-gray-200 rounded-sm p-2 ml-1">
          <h3 className="font-bold text-[10px] text-[#3b82f6] mb-1">بيانات العميل Customer</h3>
          <div className="space-y-0.5 text-[10px]">
            <div className="flex gap-1"><span className="text-gray-500 w-14">الاسم:</span><span className="font-medium">{buyerName}</span></div>
            <div className="flex gap-1"><span className="text-gray-500 w-14">VAT No:</span><span dir="ltr">{buyerTaxNumber || buyerIdNumber || '-'}</span></div>
            <div className="flex gap-1"><span className="text-gray-500 w-14">العنوان:</span><span>{buyerAddress || '-'}</span></div>
            <div className="flex gap-1"><span className="text-gray-500 w-14">الجوال:</span><span dir="ltr">{buyerPhone || '-'}</span></div>
          </div>
        </div>
        {/* Invoice Info */}
        <div className="border border-gray-200 rounded-sm p-2 mr-1">
          <div className="space-y-0.5 text-[10px]">
            <div className="flex justify-between"><span className="text-gray-500">Invoice Number رقم الفاتورة:</span><span className="font-bold">{invoiceNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Voucher No. رقم السند:</span><span className="font-bold">{data.voucherNumber || invoiceNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Invoice Date تاريخ الفاتورة:</span><span>{formattedDate}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Branch الفرع:</span><span>{branchName || 'SHOWROOM'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">SalesMan مندوب المبيعات:</span><span>{salesmanName || '-'}</span></div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="px-3">
        <table className="w-full text-[10px] border-collapse border border-gray-300">
          <thead>
            <tr className="bg-[#3b82f6] text-white">
              <th className="p-1.5 border border-[#3b82f6] text-center w-6">#</th>
              <th className="p-1.5 border border-[#3b82f6] text-right">المركبة / البيان</th>
              <th className="p-1.5 border border-[#3b82f6] text-center w-16">السعر Price</th>
              <th className="p-1.5 border border-[#3b82f6] text-center w-12">الكمية</th>
              <th className="p-1.5 border border-[#3b82f6] text-center w-14">الضريبة {taxRate}%</th>
              <th className="p-1.5 border border-[#3b82f6] text-center w-16">الاجمالي Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itemsWithTax.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                <td className="p-1.5 border text-center">{i + 1}</td>
                <td className="p-1.5 border text-right">{item.description}</td>
                <td className="p-1.5 border text-center">{item.unitPrice.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                <td className="p-1.5 border text-center">{item.quantity}</td>
                <td className="p-1.5 border text-center">{item.taxAmount.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                <td className="p-1.5 border text-center font-medium">{item.total.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-3 mt-2">
        <div className="border border-gray-300 rounded-sm overflow-hidden w-72 mr-auto">
          <div className="flex justify-between p-1.5 border-b text-[10px]"><span>Total Amount without Tax الأجمالي الخاضع للضريبة</span><span>{(subtotal - discountAmount).toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between p-1.5 border-b text-[10px]"><span>Total VAT {taxRate}% ضريبة القيمة المضافة</span><span>{taxAmount.toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
          {discountAmount > 0 && <div className="flex justify-between p-1.5 border-b text-[10px]"><span>Additions رسوم إضافية</span><span>0.00</span></div>}
          <div className="flex justify-between p-1.5 border-b text-[10px] font-bold bg-gray-50"><span>Total Amount مبلغ الفاتورة</span><span>{total.toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between p-1.5 border-b text-[10px]"><span>Paid Amount المدفوع</span><span>{paidAmount.toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between p-1.5 text-[10px] font-bold"><span>Amount Due المبلغ المستحق</span><span>{amountDue.toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-4 p-4 mt-10">
        <div className="text-center">
          <div className="border-b border-gray-400 pb-8 mb-1"></div>
          <p className="text-[10px] text-gray-500">الختم</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gray-400 pb-8 mb-1"></div>
          <p className="text-[10px] text-gray-500">المحاسب</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gray-400 pb-8 mb-1"></div>
          <p className="text-[10px] text-gray-500">المستلم</p>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate3.displayName = 'InvoiceTemplate3';
