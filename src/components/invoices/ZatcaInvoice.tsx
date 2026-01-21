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

interface InvoiceSettings {
  template?: 'modern' | 'classic' | 'minimal';
  primary_color?: string;
  show_logo?: boolean;
  show_qr?: boolean;
  show_terms?: boolean;
  terms_text?: string;
  footer_text?: string;
}

interface InvoiceData {
  invoiceNumber: string | number;
  invoiceDate: string;
  invoiceType: 'sale' | 'purchase';
  sellerName: string;
  sellerTaxNumber: string;
  sellerAddress: string;
  buyerName: string;
  buyerPhone?: string;
  buyerAddress?: string;
  buyerIdNumber?: string;
  buyerTaxNumber?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  taxSettings?: TaxSettings | null;
  companyLogoUrl?: string | null;
  invoiceSettings?: InvoiceSettings | null;
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
      companyLogoUrl,
      invoiceSettings,
    } = data;

    // Invoice settings with defaults
    const settings = {
      template: invoiceSettings?.template || 'modern',
      primary_color: invoiceSettings?.primary_color || '#059669',
      show_logo: invoiceSettings?.show_logo !== false,
      show_qr: invoiceSettings?.show_qr !== false,
      show_terms: invoiceSettings?.show_terms !== false,
      terms_text: invoiceSettings?.terms_text || 'شكراً لتعاملكم معنا',
      footer_text: invoiceSettings?.footer_text || 'هذه الفاتورة صادرة وفقاً لنظام الفوترة الإلكترونية في المملكة العربية السعودية',
    };

    // Use company logo if available, otherwise fallback to default
    const displayLogo = companyLogoUrl || logoImage;

    const formattedDate = format(new Date(invoiceDate), 'yyyy/MM/dd', { locale: ar });
    const formattedTime = format(new Date(invoiceDate), 'HH:mm:ss');
    const taxRate = taxSettings?.tax_rate || 15;

    const companyVatNumber = taxSettings?.tax_number || '';
    const qrVatNumber = invoiceType === 'sale' ? companyVatNumber : sellerTaxNumber;
    const qrSellerName = invoiceType === 'sale' 
      ? (taxSettings?.company_name_ar || sellerName) 
      : sellerName;

    const isVatValid = qrVatNumber && qrVatNumber.replace(/\D/g, '').length === 15;

    const qrData = useMemo(() => {
      if (!isVatValid) {
        console.warn('ZATCA QR: Invalid or missing VAT number');
      }
      return generateZatcaQRData({
        sellerName: qrSellerName,
        vatNumber: qrVatNumber || '',
        invoiceDateTime: formatDateTimeForZatca(invoiceDate),
        invoiceTotal: total,
        vatAmount: taxAmount,
      });
    }, [qrSellerName, qrVatNumber, invoiceDate, total, taxAmount, isVatValid]);

    const itemsWithTax = items.map(item => ({
      ...item,
      taxAmount: item.taxAmount ?? (item.unitPrice * item.quantity * (item.taxRate / 100))
    }));

    const displaySellerTaxNumber = invoiceType === 'sale' ? companyVatNumber : sellerTaxNumber;
    const displayBuyerTaxNumber = invoiceType === 'sale' ? (buyerTaxNumber || buyerIdNumber) : companyVatNumber;

    return (
      <div
        ref={ref}
        className="bg-white max-w-[210mm] mx-auto text-black"
        style={{ fontFamily: 'Cairo, Arial, sans-serif' }}
        dir="rtl"
      >
        {/* Header */}
        <div 
          className="text-white p-6 rounded-t-lg"
          style={{ backgroundColor: settings.primary_color }}
        >
          <div className="flex justify-between items-center">
            {/* Company Logo */}
            {settings.show_logo && (
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
            )}

            {/* QR Code */}
            {settings.show_qr && (
              <div className="flex flex-col items-center">
                <div className="bg-white p-2 rounded-lg shadow-lg">
                  <QRCodeSVG
                    value={qrData}
                    size={90}
                    level="M"
                    includeMargin={false}
                    fgColor={settings.primary_color}
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
            )}

            {/* Invoice Title */}
            <div className="text-left">
              <h1 className="text-3xl font-bold">فاتورة</h1>
              <h2 className="text-2xl font-bold">ضريبية</h2>
              <div className="mt-2 bg-white/20 px-3 py-1 rounded text-sm">
                <span>رقم الفاتورة: </span>
                <span className="font-bold">{invoiceNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 bg-gray-50">
          {/* Seller Info */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
            <h3 
              className="font-bold text-lg mb-3 border-b pb-2"
              style={{ color: settings.primary_color, borderColor: settings.primary_color + '40' }}
            >
              معلومات البائع
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500">اسم البائع:</span>
                <span className="font-medium">{sellerName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">رقم تسجيل ضريبة القيمة المضافة:</span>
                <span className="font-medium font-bold" style={{ color: settings.primary_color }} dir="ltr">
                  {displaySellerTaxNumber || 'غير مسجل'}
                </span>
              </div>
              <div className="flex gap-2 col-span-2">
                <span className="text-gray-500">العنوان:</span>
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

          {/* Buyer Info */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
            <h3 
              className="font-bold text-lg mb-3 border-b pb-2"
              style={{ color: settings.primary_color, borderColor: settings.primary_color + '40' }}
            >
              معلومات المشتري
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500">اسم المشتري:</span>
                <span className="font-medium">{buyerName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">رقم تسجيل ضريبة القيمة المضافة:</span>
                <span className="font-medium font-bold" style={{ color: settings.primary_color }} dir="ltr">
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
            <h3 
              className="font-bold text-lg p-4 border-b"
              style={{ color: settings.primary_color, borderColor: settings.primary_color + '40' }}
            >
              المنتجات
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: settings.primary_color + '15', color: settings.primary_color }}>
                  <th className="p-3 text-right border-b" style={{ borderColor: settings.primary_color + '40' }}>#</th>
                  <th className="p-3 text-right border-b" style={{ borderColor: settings.primary_color + '40' }}>اسم المنتج</th>
                  <th className="p-3 text-center border-b" style={{ borderColor: settings.primary_color + '40' }}>الكمية</th>
                  <th className="p-3 text-center border-b" style={{ borderColor: settings.primary_color + '40' }}>السعر</th>
                  <th className="p-3 text-center border-b" style={{ borderColor: settings.primary_color + '40' }}>ضريبة القيمة المضافة</th>
                  <th className="p-3 text-center border-b" style={{ borderColor: settings.primary_color + '40' }}>المجموع الكلي</th>
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

          {/* Totals */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <span className="text-gray-600 font-medium">المجموع</span>
              <span className="font-bold text-lg">{subtotal.toLocaleString('ar-SA')} ر.س</span>
            </div>
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <span className="text-gray-600 font-medium">ضريبة القيمة المضافة ({taxRate}%)</span>
              <span className="font-bold text-lg">{taxAmount.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
            </div>
            <div 
              className="flex justify-between items-center p-4 text-white"
              style={{ backgroundColor: settings.primary_color }}
            >
              <span className="font-bold text-lg">المجموع مع الضريبة ({taxRate}%)</span>
              <span className="font-bold text-xl">{total.toLocaleString('ar-SA')} ر.س</span>
            </div>
          </div>

          {/* Footer Notes */}
          {settings.show_terms && (
            <div className="mt-4 text-center text-xs text-gray-500">
              <p>{settings.footer_text}</p>
              <p className="mt-1">This invoice is issued according to the e-invoicing system in the Kingdom of Saudi Arabia</p>
              <p className="mt-2 text-gray-400">{settings.terms_text}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ZatcaInvoice.displayName = 'ZatcaInvoice';
