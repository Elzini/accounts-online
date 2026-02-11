import { forwardRef, useMemo } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { generateZatcaQRData, formatDateTimeForZatca } from '@/lib/zatcaQR';
import logoImage from '@/assets/logo.png';
import { InvoiceTemplateData } from './types';

interface Props { data: InvoiceTemplateData; }

export const InvoiceTemplate2 = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const {
    invoiceNumber, invoiceDate, sellerName, sellerTaxNumber, sellerAddress,
    buyerName, buyerPhone, buyerAddress, buyerTaxNumber, buyerIdNumber,
    items, subtotal, discountAmount = 0, taxAmount, total,
    taxSettings, companyLogoUrl, invoiceType, paymentMethod,
    sellerCommercialRegister,
  } = data;

  const displayLogo = companyLogoUrl || logoImage;
  const formattedDate = format(new Date(invoiceDate), 'dd/MM/yyyy hh:mm a');
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

  const companyName = taxSettings?.company_name_ar || sellerName;
  const companyVat = taxSettings?.tax_number || '';
  const companyAddress = taxSettings?.national_address || sellerAddress || '';
  const commercialRegister = sellerCommercialRegister || taxSettings?.commercial_register || '';
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div ref={ref} className="bg-white max-w-[210mm] mx-auto text-black text-[11px]" style={{ fontFamily: 'Cairo, Arial, sans-serif' }} dir="rtl">
      {/* Header */}
      <div className="p-3 border-b-2 border-gray-300">
        <div className="flex justify-between items-start">
          <div className="text-right">
            <h1 className="text-base font-bold">{companyName}</h1>
            <p className="text-[10px] text-gray-500">رقم التسجيل الضريبي: {companyVat}</p>
          </div>
          <div className="flex items-center">
            <img src={displayLogo} alt="شعار" className="h-14 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).src = logoImage; }} />
          </div>
          <div className="text-left text-[10px]">
            <p className="font-bold">{companyName}</p>
            <p>VAT Registration No.: {companyVat}</p>
          </div>
        </div>
      </div>

      {/* Invoice Meta */}
      <div className="grid grid-cols-2 gap-0 border-b text-[10px]">
        <div className="p-2 border-l space-y-1">
          <div className="flex gap-2"><span className="text-gray-500 w-24">رقم الفاتورة:</span><span className="font-bold">{invoiceNumber}</span></div>
          <div className="flex gap-2"><span className="text-gray-500 w-24">تاريخ الفاتورة:</span><span>{formattedDate}</span></div>
          <div className="flex gap-2"><span className="text-gray-500 w-24">طريقة الدفع:</span><span>{paymentMethod === 'cash' ? 'نقدي / Cash' : 'آجل / Credit'}</span></div>
        </div>
        <div className="p-2 flex justify-end">
          <QRCodeSVG value={qrData} size={65} level="M" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center py-1 bg-gray-100 border-b font-bold">
        <span>فاتورة ضريبية / Tax Invoice</span>
      </div>

      {/* Seller & Buyer Info - Side by Side */}
      <div className="grid grid-cols-2 gap-0 border-b">
        {/* Seller */}
        <div className="p-2 border-l">
          <h3 className="font-bold text-center bg-gray-50 py-1 mb-1 border-b">البائع / Seller</h3>
          <div className="space-y-0.5 text-[10px]">
            <div className="flex gap-1"><span className="text-gray-500 w-16">الاسم:</span><span>{invoiceType === 'sale' ? companyName : sellerName}</span></div>
            <div className="flex gap-1"><span className="text-gray-500 w-16">العنوان:</span><span>{invoiceType === 'sale' ? companyAddress : (sellerAddress || '-')}</span></div>
            <div className="flex gap-1"><span className="text-gray-500 w-16">الرقم الضريبي:</span><span dir="ltr">{invoiceType === 'sale' ? companyVat : (sellerTaxNumber || '-')}</span></div>
            <div className="flex gap-1"><span className="text-gray-500 w-16">السجل:</span><span>{invoiceType === 'sale' ? commercialRegister : '-'}</span></div>
          </div>
        </div>
        {/* Buyer */}
        <div className="p-2">
          <h3 className="font-bold text-center bg-gray-50 py-1 mb-1 border-b">المشتري / Buyer</h3>
          <div className="space-y-0.5 text-[10px]">
            <div className="flex gap-1"><span className="text-gray-500 w-16">الاسم:</span><span>{invoiceType === 'sale' ? buyerName : companyName}</span></div>
            <div className="flex gap-1"><span className="text-gray-500 w-16">العنوان:</span><span>{invoiceType === 'sale' ? (buyerAddress || '-') : companyAddress}</span></div>
            <div className="flex gap-1"><span className="text-gray-500 w-16">الرقم الضريبي:</span><span dir="ltr">{invoiceType === 'sale' ? (buyerTaxNumber || buyerIdNumber || '-') : companyVat}</span></div>
            <div className="flex gap-1"><span className="text-gray-500 w-16">الجوال:</span><span dir="ltr">{buyerPhone || '-'}</span></div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr className="bg-gray-200 font-bold">
            <th className="p-1.5 border text-center w-8">م#</th>
            <th className="p-1.5 border text-right">اسم الصنف / Item Name</th>
            <th className="p-1.5 border text-center w-12">الكمية</th>
            <th className="p-1.5 border text-center w-16">السعر</th>
            <th className="p-1.5 border text-center w-14">نسبة الضريبة</th>
            <th className="p-1.5 border text-center w-16">مبلغ الضريبة</th>
            <th className="p-1.5 border text-center w-20">الإجمالي شامل</th>
          </tr>
        </thead>
        <tbody>
          {itemsWithTax.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
              <td className="p-1.5 border text-center">{i + 1}</td>
              <td className="p-1.5 border text-right">{item.description}</td>
              <td className="p-1.5 border text-center">{item.quantity}</td>
              <td className="p-1.5 border text-center">{item.unitPrice.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
              <td className="p-1.5 border text-center">{item.taxRate}%</td>
              <td className="p-1.5 border text-center">{item.taxAmount.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
              <td className="p-1.5 border text-center font-medium">{item.total.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-0 border-t">
        <div className="p-2 border-l text-[10px] space-y-1">
          <div className="flex justify-between"><span>Total QTY إجمالي الكمية</span><span>{totalQuantity}</span></div>
          <div className="flex justify-between"><span>Sales Man / البائع</span><span>{data.salesmanName || '-'}</span></div>
        </div>
        <div className="p-2 text-[10px] space-y-1">
          <div className="flex justify-between"><span>Total Excluding VAT الإجمالي غير شامل الضريبة</span><span>{subtotal.toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
          {discountAmount > 0 && (
            <div className="flex justify-between"><span>Discount / الخصم</span><span>{discountAmount.toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
          )}
          <div className="flex justify-between"><span>Total Taxable Amount المبلغ الخاضع للضريبة</span><span>{(subtotal - discountAmount).toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between"><span>Tax %{taxRate} / الضريبة</span><span>{taxAmount.toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between font-bold border-t pt-1"><span>Total Amt With Tax الإجمالي شامل الضريبة</span><span>{total.toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-4 p-4 mt-6 border-t">
        <div className="text-center">
          <div className="border-b border-gray-400 pb-8 mb-1"></div>
          <p className="text-[10px] text-gray-500">customer and sign المستلم</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gray-400 pb-8 mb-1"></div>
          <p className="text-[10px] text-gray-500">vendor / البائع</p>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate2.displayName = 'InvoiceTemplate2';
