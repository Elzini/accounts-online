import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TaxSettings } from '@/services/accounting';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

interface InvoiceData {
  invoiceNumber: string | number;
  invoiceDate: string;
  invoiceType: 'sale' | 'purchase';
  // Seller/Buyer info
  sellerName: string;
  sellerTaxNumber: string;
  sellerAddress: string;
  buyerName: string;
  buyerPhone?: string;
  buyerAddress?: string;
  buyerIdNumber?: string;
  // Items
  items: InvoiceItem[];
  // Totals
  subtotal: number;
  taxAmount: number;
  total: number;
  // Tax settings
  taxSettings?: TaxSettings | null;
}

interface ZatcaInvoiceProps {
  data: InvoiceData;
}

export const ZatcaInvoice = forwardRef<HTMLDivElement, ZatcaInvoiceProps>(
  ({ data }, ref) => {
    const {
      invoiceNumber,
      invoiceDate,
      invoiceType,
      sellerName,
      sellerTaxNumber,
      sellerAddress,
      buyerName,
      buyerPhone,
      buyerAddress,
      buyerIdNumber,
      items,
      subtotal,
      taxAmount,
      total,
      taxSettings,
    } = data;

    const formattedDate = format(new Date(invoiceDate), 'yyyy/MM/dd', { locale: ar });
    const formattedTime = format(new Date(invoiceDate), 'HH:mm:ss');
    const taxRate = taxSettings?.tax_rate || 15;

    // Generate simple QR code data (in real implementation, use ZATCA SDK)
    const qrData = `${sellerName}|${sellerTaxNumber}|${formattedDate}|${total}|${taxAmount}`;
    const qrBase64 = btoa(qrData);

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-[210mm] mx-auto text-black"
        style={{ fontFamily: 'Cairo, Arial, sans-serif' }}
        dir="rtl"
      >
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {invoiceType === 'sale' ? 'فاتورة ضريبية' : 'فاتورة شراء'}
              </h1>
              <p className="text-sm text-gray-600">Tax Invoice</p>
            </div>
            <div className="text-left">
              <p className="text-lg font-bold">رقم الفاتورة: {invoiceNumber}</p>
              <p className="text-sm">Invoice No: {invoiceNumber}</p>
            </div>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Seller Info */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-bold text-gray-900 mb-2 border-b pb-1">
              {invoiceType === 'sale' ? 'البائع / Seller' : 'المورد / Supplier'}
            </h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">الاسم:</span> {sellerName}</p>
              <p><span className="font-medium">الرقم الضريبي:</span> <span dir="ltr">{sellerTaxNumber}</span></p>
              {taxSettings?.commercial_register && (
                <p><span className="font-medium">السجل التجاري:</span> {taxSettings.commercial_register}</p>
              )}
              <p><span className="font-medium">العنوان:</span> {sellerAddress}</p>
              {taxSettings?.city && (
                <p><span className="font-medium">المدينة:</span> {taxSettings.city}</p>
              )}
            </div>
          </div>

          {/* Buyer Info */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-bold text-gray-900 mb-2 border-b pb-1">
              {invoiceType === 'sale' ? 'المشتري / Buyer' : 'الشركة / Company'}
            </h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">الاسم:</span> {buyerName}</p>
              {buyerPhone && <p><span className="font-medium">الهاتف:</span> {buyerPhone}</p>}
              {buyerIdNumber && <p><span className="font-medium">رقم الهوية:</span> {buyerIdNumber}</p>}
              {buyerAddress && <p><span className="font-medium">العنوان:</span> {buyerAddress}</p>}
            </div>
          </div>
        </div>

        {/* Date Info */}
        <div className="flex justify-between mb-6 text-sm bg-gray-100 p-3 rounded-lg">
          <div>
            <span className="font-medium">تاريخ الفاتورة:</span> {formattedDate}
          </div>
          <div>
            <span className="font-medium">الوقت:</span> {formattedTime}
          </div>
          <div>
            <span className="font-medium">نوع الفاتورة:</span> فاتورة ضريبية
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-6 border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-700 p-2 text-right">#</th>
              <th className="border border-gray-700 p-2 text-right">الوصف / Description</th>
              <th className="border border-gray-700 p-2 text-center">الكمية</th>
              <th className="border border-gray-700 p-2 text-left">سعر الوحدة</th>
              <th className="border border-gray-700 p-2 text-center">نسبة الضريبة</th>
              <th className="border border-gray-700 p-2 text-left">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 p-2 text-right">{index + 1}</td>
                <td className="border border-gray-300 p-2 text-right">{item.description}</td>
                <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                <td className="border border-gray-300 p-2 text-left">{item.unitPrice.toLocaleString()} ر.س</td>
                <td className="border border-gray-300 p-2 text-center">{item.taxRate}%</td>
                <td className="border border-gray-300 p-2 text-left font-medium">{item.total.toLocaleString()} ر.س</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-72 border rounded-lg overflow-hidden">
            <div className="flex justify-between p-3 bg-gray-50 border-b">
              <span>المجموع قبل الضريبة (Subtotal)</span>
              <span className="font-medium">{subtotal.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 border-b">
              <span>ضريبة القيمة المضافة ({taxRate}%)</span>
              <span className="font-medium">{taxAmount.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-800 text-white">
              <span className="font-bold">الإجمالي شامل الضريبة</span>
              <span className="font-bold text-lg">{total.toLocaleString()} ر.س</span>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex justify-between items-end border-t pt-4">
          <div className="text-xs text-gray-500 max-w-[60%]">
            <p className="font-bold mb-1">ملاحظات / Notes:</p>
            <p>هذه الفاتورة صادرة وفقاً لنظام الفوترة الإلكترونية في المملكة العربية السعودية</p>
            <p>This invoice is issued according to the e-invoicing system in the Kingdom of Saudi Arabia</p>
          </div>
          <div className="text-center">
            <div className="w-24 h-24 border-2 border-gray-800 rounded-lg flex items-center justify-center bg-white mb-1">
              {/* Simple QR placeholder - in production use a real QR library */}
              <div className="text-xs text-gray-400 text-center p-2">
                <svg viewBox="0 0 100 100" className="w-16 h-16">
                  <rect x="10" y="10" width="20" height="20" fill="black"/>
                  <rect x="70" y="10" width="20" height="20" fill="black"/>
                  <rect x="10" y="70" width="20" height="20" fill="black"/>
                  <rect x="40" y="10" width="10" height="10" fill="black"/>
                  <rect x="40" y="40" width="20" height="20" fill="black"/>
                  <rect x="10" y="40" width="10" height="10" fill="black"/>
                  <rect x="70" y="40" width="10" height="10" fill="black"/>
                  <rect x="80" y="50" width="10" height="10" fill="black"/>
                  <rect x="70" y="70" width="10" height="10" fill="black"/>
                  <rect x="80" y="80" width="10" height="10" fill="black"/>
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">رمز الاستجابة السريعة</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
          <p>شكراً لتعاملكم معنا - Thank you for your business</p>
        </div>
      </div>
    );
  }
);

ZatcaInvoice.displayName = 'ZatcaInvoice';
