import { forwardRef, useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { TaxSettings } from '@/services/accounting';
import { generateZatcaQRData, formatDateTimeISO } from '@/lib/zatcaQR';
import logoImage from '@/assets/logo.png';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount?: number;
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
  buyerTaxNumber?: string;
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
      buyerTaxNumber,
      items,
      subtotal,
      taxAmount,
      total,
      taxSettings,
    } = data;

    const formattedDate = format(new Date(invoiceDate), 'yyyy/MM/dd', { locale: ar });
    const formattedTime = format(new Date(invoiceDate), 'HH:mm:ss');
    const taxRate = taxSettings?.tax_rate || 15;

    // Get the actual VAT number for ZATCA QR - must be the company's VAT number
    const companyVatNumber = taxSettings?.tax_number || '';
    
    // For QR code, we need the seller's VAT number (which is the company for sales, or supplier for purchases)
    // For ZATCA compliance, the QR must contain the seller's VAT registration number
    const qrVatNumber = invoiceType === 'sale' ? companyVatNumber : sellerTaxNumber;
    const qrSellerName = invoiceType === 'sale' 
      ? (taxSettings?.company_name_ar || sellerName) 
      : sellerName;

    // Generate ZATCA-compliant QR code data using TLV encoding
    const qrData = useMemo(() => {
      return generateZatcaQRData({
        sellerName: qrSellerName,
        vatNumber: qrVatNumber,
        invoiceDateTime: formatDateTimeISO(invoiceDate),
        invoiceTotal: total,
        vatAmount: taxAmount,
      });
    }, [qrSellerName, qrVatNumber, invoiceDate, total, taxAmount]);

    // Calculate item tax amount if not provided
    const itemsWithTax = items.map(item => ({
      ...item,
      taxAmount: item.taxAmount ?? (item.unitPrice * item.quantity * (item.taxRate / 100))
    }));

    // Get display values for seller and buyer based on invoice type
    const displaySellerTaxNumber = invoiceType === 'sale' ? companyVatNumber : sellerTaxNumber;
    const displayBuyerTaxNumber = invoiceType === 'sale' ? (buyerTaxNumber || buyerIdNumber) : companyVatNumber;

    return (
      <div
        ref={ref}
        className="bg-white max-w-[210mm] mx-auto text-black"
        style={{ fontFamily: 'Cairo, Arial, sans-serif' }}
        dir="rtl"
      >
        {/* Header - Green Section */}
        <div className="bg-emerald-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            {/* Left - Logo */}
            <div className="flex items-center">
              <img 
                src={logoImage} 
                alt="Logo" 
                className="h-16 w-auto object-contain bg-white rounded p-1"
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
                  fgColor="#047857"
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
                ضريبية
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
          {/* Seller Info Section */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
            <h3 className="text-emerald-700 font-bold text-lg mb-3 border-b border-emerald-200 pb-2">
              معلومات البائع
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500">اسم البائع:</span>
                <span className="font-medium">{sellerName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">رقم تسجيل ضريبة القيمة المضافة للبائع:</span>
                <span className="font-medium text-emerald-700 font-bold" dir="ltr">
                  {displaySellerTaxNumber || 'غير مسجل'}
                </span>
              </div>
              <div className="flex gap-2 col-span-2">
                <span className="text-gray-500">العنوان الوطني:</span>
                <span className="font-medium">{sellerAddress || taxSettings?.national_address || '-'}</span>
              </div>
              {taxSettings?.commercial_register && invoiceType === 'sale' && (
                <div className="flex gap-2">
                  <span className="text-gray-500">السجل التجاري:</span>
                  <span className="font-medium">{taxSettings.commercial_register}</span>
                </div>
              )}
            </div>
          </div>

          {/* Buyer Info Section */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
            <h3 className="text-emerald-700 font-bold text-lg mb-3 border-b border-emerald-200 pb-2">
              معلومات المشتري
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500">اسم المشتري:</span>
                <span className="font-medium">{buyerName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">رقم تسجيل ضريبة القيمة المضافة للمشتري:</span>
                <span className="font-medium text-emerald-700 font-bold" dir="ltr">
                  {displayBuyerTaxNumber || 'غير مسجل'}
                </span>
              </div>
              {buyerPhone && (
                <div className="flex gap-2">
                  <span className="text-gray-500">رقم الهاتف:</span>
                  <span className="font-medium" dir="ltr">{buyerPhone}</span>
                </div>
              )}
              {buyerAddress && (
                <div className="flex gap-2">
                  <span className="text-gray-500">العنوان:</span>
                  <span className="font-medium">{buyerAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 mb-4">
            <h3 className="text-emerald-700 font-bold text-lg p-4 border-b border-emerald-200">
              المنتجات
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-50 text-emerald-800">
                  <th className="p-3 text-right border-b border-emerald-200">#</th>
                  <th className="p-3 text-right border-b border-emerald-200">اسم المنتج</th>
                  <th className="p-3 text-center border-b border-emerald-200">الكمية</th>
                  <th className="p-3 text-center border-b border-emerald-200">السعر</th>
                  <th className="p-3 text-center border-b border-emerald-200">ضريبة القيمة المضافة</th>
                  <th className="p-3 text-center border-b border-emerald-200">المجموع الكلي</th>
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
            <div className="flex justify-between items-center p-4 bg-emerald-600 text-white">
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

ZatcaInvoice.displayName = 'ZatcaInvoice';
