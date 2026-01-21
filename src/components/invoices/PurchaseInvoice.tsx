import { forwardRef, useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { TaxSettings } from '@/services/accounting';
import { generateZatcaQRData, formatDateTimeForZatca } from '@/lib/zatcaQR';
import logoImage from '@/assets/logo.png';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount?: number;
  total: number;
}

interface PurchaseInvoiceData {
  invoiceNumber: string | number;
  invoiceDate: string;
  // Supplier info (البائع)
  supplierName: string;
  supplierTaxNumber?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  // Company info (المشتري)
  companyName: string;
  companyTaxNumber?: string;
  companyAddress?: string;
  // Items
  items: InvoiceItem[];
  // Totals
  subtotal: number;
  taxAmount: number;
  total: number;
  // Tax settings
  taxSettings?: TaxSettings | null;
  // Company logo
  companyLogoUrl?: string | null;
}

interface PurchaseInvoiceProps {
  data: PurchaseInvoiceData;
}

export const PurchaseInvoice = forwardRef<HTMLDivElement, PurchaseInvoiceProps>(
  ({ data }, ref) => {
    const {
      invoiceNumber,
      invoiceDate,
      supplierName,
      supplierTaxNumber,
      supplierAddress,
      supplierPhone,
      companyName,
      companyTaxNumber,
      companyAddress,
      items,
      subtotal,
      taxAmount,
      total,
      taxSettings,
      companyLogoUrl,
    } = data;

    // Use company logo if available, otherwise fallback to default
    const displayLogo = companyLogoUrl || logoImage;

    const formattedDate = format(new Date(invoiceDate), 'yyyy/MM/dd', { locale: ar });
    const formattedTime = format(new Date(invoiceDate), 'HH:mm:ss');
    const taxRate = taxSettings?.tax_rate || 15;

    // Generate ZATCA-compliant QR code data
    const qrData = useMemo(() => {
      return generateZatcaQRData({
        sellerName: supplierName,
        vatNumber: supplierTaxNumber || '',
        invoiceDateTime: formatDateTimeForZatca(invoiceDate),
        invoiceTotal: total,
        vatAmount: taxAmount,
      });
    }, [supplierName, supplierTaxNumber, invoiceDate, total, taxAmount]);

    // Calculate item tax amount if not provided
    const itemsWithTax = items.map(item => ({
      ...item,
      taxAmount: item.taxAmount ?? (item.unitPrice * item.quantity * (item.taxRate / 100))
    }));

    return (
      <div
        ref={ref}
        className="bg-white max-w-[210mm] mx-auto text-black"
        style={{ fontFamily: 'Cairo, Arial, sans-serif' }}
        dir="rtl"
      >
        {/* Header - Blue Section for Purchases */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            {/* Left - Company Logo */}
            <div className="flex items-center">
              <img 
                src={displayLogo} 
                alt="شعار الشركة" 
                className="h-20 w-auto object-contain bg-white rounded-lg p-2 shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logoImage;
                }}
              />
            </div>

            {/* Center - QR Code */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-2 rounded-lg shadow-lg">
                <QRCodeSVG
                  value={qrData}
                  size={90}
                  level="M"
                  includeMargin={false}
                  fgColor="#2563eb"
                />
              </div>
              <div className="flex gap-4 mt-2 text-sm">
                <div className="text-center">
                  <span className="opacity-75">التاريخ</span>
                  <p className="font-bold">{formattedDate}</p>
                </div>
                <div className="text-center">
                  <span className="opacity-75">الوقت</span>
                  <p className="font-bold">{formattedTime}</p>
                </div>
              </div>
            </div>

            {/* Right - Invoice Title */}
            <div className="text-left">
              <h1 className="text-3xl font-bold">
                فاتورة
              </h1>
              <h2 className="text-2xl font-bold">
                مشتريات
              </h2>
              <div className="mt-2 bg-white/20 px-3 py-1 rounded text-sm">
                <span>رقم الفاتورة: </span>
                <span className="font-bold">{invoiceNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 bg-gray-50">
          {/* Supplier Info Section (البائع) */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
            <h3 className="text-blue-700 font-bold text-lg mb-3 border-b border-blue-200 pb-2">
              معلومات المورد (البائع)
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500">اسم المورد:</span>
                <span className="font-medium">{supplierName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">رقم تسجيل ضريبة القيمة المضافة:</span>
                <span className="font-medium text-blue-700 font-bold" dir="ltr">
                  {supplierTaxNumber || 'غير مسجل'}
                </span>
              </div>
              {supplierPhone && (
                <div className="flex gap-2">
                  <span className="text-gray-500">رقم الهاتف:</span>
                  <span className="font-medium" dir="ltr">{supplierPhone}</span>
                </div>
              )}
              {supplierAddress && (
                <div className="flex gap-2">
                  <span className="text-gray-500">العنوان:</span>
                  <span className="font-medium">{supplierAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Company Info Section (المشتري) */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
            <h3 className="text-blue-700 font-bold text-lg mb-3 border-b border-blue-200 pb-2">
              معلومات الشركة (المشتري)
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500">اسم الشركة:</span>
                <span className="font-medium">{companyName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">رقم تسجيل ضريبة القيمة المضافة:</span>
                <span className="font-medium text-blue-700 font-bold" dir="ltr">
                  {companyTaxNumber || 'غير مسجل'}
                </span>
              </div>
              {companyAddress && (
                <div className="flex gap-2 col-span-2">
                  <span className="text-gray-500">العنوان الوطني:</span>
                  <span className="font-medium">{companyAddress}</span>
                </div>
              )}
              {taxSettings?.commercial_register && (
                <div className="flex gap-2">
                  <span className="text-gray-500">السجل التجاري:</span>
                  <span className="font-medium">{taxSettings.commercial_register}</span>
                </div>
              )}
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 mb-4">
            <h3 className="text-blue-700 font-bold text-lg p-4 border-b border-blue-200">
              المنتجات
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-50 text-blue-800">
                  <th className="p-3 text-right border-b border-blue-200">#</th>
                  <th className="p-3 text-right border-b border-blue-200">اسم المنتج</th>
                  <th className="p-3 text-center border-b border-blue-200">الكمية</th>
                  <th className="p-3 text-center border-b border-blue-200">السعر</th>
                  <th className="p-3 text-center border-b border-blue-200">ضريبة القيمة المضافة</th>
                  <th className="p-3 text-center border-b border-blue-200">المجموع الكلي</th>
                </tr>
              </thead>
              <tbody>
                {itemsWithTax.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 text-right border-b border-gray-100">{index + 1}</td>
                    <td className="p-3 text-right border-b border-gray-100">{item.description}</td>
                    <td className="p-3 text-center border-b border-gray-100">{item.quantity}</td>
                    <td className="p-3 text-center border-b border-gray-100">{item.unitPrice.toLocaleString('ar-SA')}</td>
                    <td className="p-3 text-center border-b border-gray-100">
                      {item.taxAmount.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center border-b border-gray-100 font-medium">
                      {item.total.toLocaleString('ar-SA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <span className="text-gray-600 font-medium">المجموع</span>
              <span className="font-bold text-lg">{subtotal.toLocaleString('ar-SA')} ر.س</span>
            </div>
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <span className="text-gray-600 font-medium">ضريبة القيمة المضافة ({taxRate}%)</span>
              <span className="font-bold text-lg">{taxAmount.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-600 text-white">
              <span className="font-bold text-lg">المجموع مع الضريبة ({taxRate}%)</span>
              <span className="font-bold text-xl">{total.toLocaleString('ar-SA')} ر.س</span>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>هذه الفاتورة صادرة وفقاً لنظام الفوترة الإلكترونية في المملكة العربية السعودية</p>
            <p className="mt-1">This invoice is issued according to the e-invoicing system in the Kingdom of Saudi Arabia</p>
            <p className="mt-2 text-gray-400">شكراً لتعاملكم معنا</p>
          </div>
        </div>
      </div>
    );
  }
);

PurchaseInvoice.displayName = 'PurchaseInvoice';
