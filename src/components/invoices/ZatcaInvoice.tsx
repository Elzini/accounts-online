import { forwardRef, useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { ZatcaQrBlock } from '@/components/invoices/ZatcaQrBlock';
import { TaxSettings } from '@/services/accounting';
import { useZatcaPhase2QR } from '@/hooks/useZatcaPhase2QR';
import logoImage from '@/assets/logo.png';
import { InvoiceCustomLabels, defaultInvoiceLabels } from './templates/types';
import { getZatcaPhase2DisplayState } from '@/lib/zatcaPhase2Status';

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
  // Layout settings
  logo_position?: 'right' | 'left' | 'center';
  qr_position?: 'right' | 'left' | 'center';
  seller_position?: 'top' | 'bottom';
  buyer_position?: 'top' | 'bottom';
  seller_title?: string;
  buyer_title?: string;
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
  uuid?: string;
  paymentMethod?: string;
  notes?: string;
  customLabels?: InvoiceCustomLabels;
  plateNumber?: string;
  officialQrData?: string | null;
  zatcaStatus?: string | null;
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
      uuid,
      paymentMethod,
    } = data;

    const L = { ...defaultInvoiceLabels, ...data.customLabels };
    // Invoice settings with defaults
    const settings = {
      template: invoiceSettings?.template || 'modern',
      primary_color: invoiceSettings?.primary_color || '#059669',
      show_logo: invoiceSettings?.show_logo !== false,
      show_qr: invoiceSettings?.show_qr !== false,
      show_terms: invoiceSettings?.show_terms !== false,
      terms_text: invoiceSettings?.terms_text || 'شكراً لتعاملكم معنا',
      footer_text: invoiceSettings?.footer_text || 'هذه الفاتورة صادرة وفقاً لنظام الفوترة الإلكترونية في المملكة العربية السعودية',
      // Layout settings
      logo_position: invoiceSettings?.logo_position || 'right',
      qr_position: invoiceSettings?.qr_position || 'left',
      seller_position: invoiceSettings?.seller_position || 'top',
      buyer_position: invoiceSettings?.buyer_position || 'bottom',
      seller_title: invoiceSettings?.seller_title || 'معلومات البائع',
      buyer_title: invoiceSettings?.buyer_title || 'معلومات المشتري',
    };

    // Only show logo if company has one uploaded - no fallback
    const displayLogo = companyLogoUrl || null;

    const parsedDate = new Date(invoiceDate);
    const isValidDate = !isNaN(parsedDate.getTime());
    const formattedDate = isValidDate ? format(parsedDate, 'yyyy/MM/dd', { locale: ar }) : new Date().toLocaleDateString('ar-SA');
    const formattedTime = isValidDate ? format(parsedDate, 'HH:mm:ss') : new Date().toLocaleTimeString('ar-SA');
    const taxRate = taxSettings?.tax_rate || 15;

    const companyVatNumber = taxSettings?.tax_number || '';
    const qrVatNumber = invoiceType === 'sale' ? companyVatNumber : sellerTaxNumber;
    const qrSellerName = invoiceType === 'sale' 
      ? (taxSettings?.company_name_ar || sellerName) 
      : sellerName;

    const isVatValid = qrVatNumber && qrVatNumber.replace(/\D/g, '').length === 15;

    const qrData = useZatcaPhase2QR({
      sellerName: qrSellerName,
      vatNumber: qrVatNumber || '300000000000003',
      invoiceDateTime: invoiceDate,
      invoiceTotal: total,
      vatAmount: taxAmount,
      invoiceNumber: String(invoiceNumber || ''),
      officialQrData: data.officialQrData,
    });
    const phase2State = useMemo(() => getZatcaPhase2DisplayState({
      officialQrData: data.officialQrData,
      zatcaStatus: data.zatcaStatus,
    }), [data.officialQrData, data.zatcaStatus]);

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
          <div className={`flex items-center ${
            settings.logo_position === 'center' ? 'justify-center' :
            settings.logo_position === 'left' ? 'flex-row-reverse justify-between' :
            'justify-between'
          }`}>
            {/* Company Logo */}
            {settings.show_logo && displayLogo && (
              <div className={`flex items-center ${
                settings.logo_position === 'center' ? 'order-1' : ''
              }`}>
                <img 
                  src={displayLogo} 
                  alt="شعار الشركة" 
                  className="h-20 w-auto object-contain bg-white rounded-lg p-2 shadow-md"
                />
              </div>
            )}

            {/* QR Code */}
            {settings.show_qr && (
              <div className={`flex flex-col items-center ${
                settings.qr_position === 'center' ? 'order-2' :
                settings.qr_position === 'right' ? 'order-first' : ''
              }`}>
                <div className="bg-white p-2 rounded-lg shadow-lg">
                  <ZatcaQrBlock value={qrData} size={180} />
                </div>
                {!isVatValid && (
                  <div className="mt-1 text-xs text-yellow-200 bg-yellow-600/50 px-2 py-0.5 rounded">
                    ⚠️ رقم ضريبي غير مكتمل
                  </div>
                )}
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
            <div className={`text-left ${
              settings.logo_position === 'center' && settings.qr_position === 'center' ? '' : ''
            }`}>
              <h1 className="text-3xl font-bold">{L.invoiceTitle?.split(' ')[0] || 'فاتورة'}</h1>
              <h2 className="text-2xl font-bold">{L.invoiceTitle?.split(' ').slice(1).join(' ') || 'ضريبية'}</h2>
              <div className="mt-2 bg-white/20 px-3 py-1 rounded text-sm">
                <span>رقم الفاتورة: </span>
                <span className="font-bold">{invoiceNumber}</span>
              </div>
              {uuid && (
                <div className="mt-1 bg-white/10 px-3 py-0.5 rounded text-xs" dir="ltr">
                  <span className="opacity-75">UUID: </span>
                  <span className="font-mono">{uuid.substring(0, 18)}...</span>
                </div>
              )}
              <div className="mt-1 bg-white/10 px-3 py-0.5 rounded text-xs">
                <span className="opacity-75">طريقة الدفع: </span>
                <span className="font-bold">{paymentMethod === 'credit' ? 'آجل' : paymentMethod === 'bank' ? 'تحويل بنكي' : 'نقدي'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 bg-gray-50">
          {/* Seller and Buyer Info - Dynamic Order */}
          {settings.seller_position === 'top' ? (
            <>
              {/* Seller Info */}
              <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                <h3 
                  className="font-bold text-lg mb-3 border-b pb-2"
                  style={{ color: settings.primary_color, borderColor: settings.primary_color + '40' }}
                >
                   {L.sellerLabel}
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
                   {L.buyerLabel}
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
                  {data.plateNumber && (
                    <div className="flex gap-2">
                      <span className="text-gray-500">{L.plateNumberLabel}:</span>
                      <span className="font-medium">{data.plateNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Buyer Info First */}
              <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                <h3 
                  className="font-bold text-lg mb-3 border-b pb-2"
                  style={{ color: settings.primary_color, borderColor: settings.primary_color + '40' }}
                >
                  {L.buyerLabel}
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
                  {data.plateNumber && (
                    <div className="flex gap-2">
                      <span className="text-gray-500">{L.plateNumberLabel}:</span>
                      <span className="font-medium">{data.plateNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Seller Info Second */}
              <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                <h3 
                  className="font-bold text-lg mb-3 border-b pb-2"
                  style={{ color: settings.primary_color, borderColor: settings.primary_color + '40' }}
                >
                  {L.sellerLabel}
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
            </>
          )}

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
                   <th className="p-3 text-right border-b" style={{ borderColor: settings.primary_color + '40' }}>{L.descriptionColumn}</th>
                   <th className="p-3 text-center border-b" style={{ borderColor: settings.primary_color + '40' }}>{L.quantityColumn}</th>
                   <th className="p-3 text-center border-b" style={{ borderColor: settings.primary_color + '40' }}>{L.priceColumn}</th>
                   <th className="p-3 text-center border-b" style={{ borderColor: settings.primary_color + '40' }}>{L.taxColumn}</th>
                   <th className="p-3 text-center border-b" style={{ borderColor: settings.primary_color + '40' }}>{L.totalColumn}</th>
                </tr>
              </thead>
              <tbody>
                {itemsWithTax.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 text-right border-b border-gray-100">{index + 1}</td>
                    <td className="p-3 text-right border-b border-gray-100">{item.description}</td>
                    <td className="p-3 text-center border-b border-gray-100">{item.quantity}</td>
                    <td className="p-3 text-center border-b border-gray-100">{item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-3 text-center border-b border-gray-100">
                      {Math.round(item.taxAmount).toLocaleString('en-US')}
                    </td>
                    <td className="p-3 text-center border-b border-gray-100 font-medium">
                      {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
               <span className="text-gray-600 font-medium">{L.subtotalLabel}</span>
               <span className="font-bold text-lg">{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
             </div>
             <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
               <span className="text-gray-600 font-medium">{L.taxLabel} ({taxRate}%)</span>
               <span className="font-bold text-lg">{taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
             </div>
             <div 
               className="flex justify-between items-center p-4 text-white"
               style={{ backgroundColor: settings.primary_color }}
             >
               <span className="font-bold text-lg">{L.grandTotalLabel} ({taxRate}%)</span>
              <span className="font-bold text-xl">{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
            </div>
          </div>

          {/* Invoice Notes */}
          {data.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs font-bold text-gray-600 mb-1">ملاحظات:</p>
              <p className="text-xs text-gray-700 whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}

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
