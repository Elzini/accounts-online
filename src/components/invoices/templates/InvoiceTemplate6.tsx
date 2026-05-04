import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ZatcaQrBlock } from '@/components/invoices/ZatcaQrBlock';
import { useZatcaPhase2QR } from '@/hooks/useZatcaPhase2QR';
import { InvoiceTemplateData, defaultInvoiceLabels } from './types';

interface Props { data: InvoiceTemplateData; }

/**
 * Template 6 — "نموذج المقاولات" (Bhans / contracting style)
 * Matches the reference layout with: top tri-column header (buyer | invoice meta | seller),
 * minimalist 4-column items table (Total | Rate | Qty | Item), and totals stack with
 * Subtotal / VAT 15% / Total / Retention 10% / Total Due.
 */
export const InvoiceTemplate6 = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const {
    invoiceNumber, invoiceDate, sellerName, sellerTaxNumber, sellerAddress,
    buyerName, buyerTaxNumber, buyerAddress, buyerCommercialRegister,
    items, subtotal, taxAmount, total,
    taxSettings, companyLogoUrl, invoiceType,
    retentionRate = 10,
  } = data;
  const L = { ...defaultInvoiceLabels, ...data.customLabels };

  const formattedDate = format(new Date(invoiceDate), 'dd-MM-yyyy');
  const taxRate = taxSettings?.tax_rate || 15;
  const vatNumber = invoiceType === 'sale' ? (taxSettings?.tax_number || '') : (sellerTaxNumber || '');
  const companyName = taxSettings?.company_name_ar || sellerName;
  const companyAddress = taxSettings?.national_address || sellerAddress || '';
  const commercialRegister = taxSettings?.commercial_register || '';

  const retentionAmount = data.retentionAmount ?? (total * (retentionRate / 100));
  const totalDue = data.totalDue ?? (total - retentionAmount);

  const qrData = useZatcaPhase2QR({
    sellerName: companyName,
    vatNumber: vatNumber || '300000000000003',
    invoiceDateTime: invoiceDate,
    invoiceTotal: total,
    vatAmount: taxAmount,
    invoiceNumber,
    officialQrData: data.officialQrData,
  });

  return (
    <div
      ref={ref}
      className="bg-white max-w-[210mm] mx-auto text-black p-8"
      style={{ fontFamily: 'Cairo, Arial, sans-serif', minHeight: '297mm' }}
      dir="rtl"
    >
      {/* Logo */}
      {companyLogoUrl && (
        <div className="mb-6">
          <img src={companyLogoUrl} alt="logo" className="h-16 object-contain" />
        </div>
      )}

      {/* Top header: 3 columns - Buyer (right) | Invoice meta (middle) | Seller (left) */}
      <div className="grid grid-cols-3 gap-6 mb-10 text-[12px]">
        {/* Seller (right in RTL) */}
        <div className="text-right space-y-1">
          <div className="font-bold">{companyName}</div>
          <div>{companyAddress}</div>
          {commercialRegister && <div>س.ت {commercialRegister}</div>}
        </div>

        {/* Invoice meta (center) */}
        <div className="text-right space-y-3 border-x border-gray-300 px-4">
          <div>
            <div className="text-gray-600">تاريخ الفاتورة</div>
            <div className="text-gray-600 text-[11px]">Invoice date</div>
            <div className="font-medium mt-1">{formattedDate}</div>
          </div>
          <div>
            <div className="text-gray-600">الرقم الضريبي</div>
            <div className="font-medium mt-1" dir="ltr">{vatNumber}</div>
          </div>
          <div>
            <div className="text-gray-600">السجل التجاري</div>
            <div className="font-medium mt-1" dir="ltr">{buyerCommercialRegister || commercialRegister}</div>
          </div>
        </div>

        {/* Buyer (left in RTL) */}
        <div className="text-right space-y-1">
          <div className="font-bold">{buyerName}</div>
          {buyerAddress && <div>{buyerAddress}</div>}
          {buyerTaxNumber && (
            <div>
              <span>الرقم الضريبي </span>
              <span dir="ltr">{buyerTaxNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items table */}
      <table className="w-full border-collapse text-[12px] mb-0">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2 w-[18%] text-center">
              <div>الإجمالي</div>
              <div className="text-[11px]">Total</div>
            </th>
            <th className="border border-gray-400 p-2 w-[14%] text-center">
              <div>سعر الوحدة</div>
              <div className="text-[11px]">rate(sar)</div>
            </th>
            <th className="border border-gray-400 p-2 w-[12%] text-center">
              <div>الكمية</div>
              <div className="text-[11px]">Inv Qty</div>
            </th>
            <th className="border border-gray-400 p-2 text-center">
              <div>البند</div>
              <div className="text-[11px]">Item</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="border border-gray-400 p-2 text-left">
                SAR {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="border border-gray-400 p-2 text-center">
                {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="border border-gray-400 p-2 text-center">{item.quantity}</td>
              <td className="border border-gray-400 p-2 text-right">{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals stack (left-aligned column) */}
      <div className="w-[55%] text-[12px]">
        <div className="grid grid-cols-[180px_1fr] border-b border-l border-r border-gray-400">
          <div className="border-l border-gray-400 p-2 text-left">
            SAR {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="p-2">
            <div>المجموع الفرعي</div>
            <div className="text-[11px]">Subtotal</div>
          </div>
        </div>
        <div className="grid grid-cols-[180px_1fr] border-b border-l border-r border-gray-400">
          <div className="border-l border-gray-400 p-2 text-left">
            SAR {taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="p-2">ضريبة القيمة المضافة {taxRate}%</div>
        </div>
        <div className="grid grid-cols-[180px_1fr] border-b border-l border-r border-gray-400 font-bold">
          <div className="border-l border-gray-400 p-2 text-left">
            SAR {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="p-2">
            <div>الإجمالي</div>
            <div className="text-[11px] font-normal">Total</div>
          </div>
        </div>
        <div className="grid grid-cols-[180px_1fr] border-b border-l border-r border-gray-400">
          <div className="border-l border-gray-400 p-2 text-left">
            SAR {retentionAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="p-2">Retention {retentionRate}%</div>
        </div>
        <div className="grid grid-cols-[180px_1fr] border-b border-l border-r border-gray-400 font-bold">
          <div className="border-l border-gray-400 p-2 text-left">
            SAR {totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="p-2">Total Due</div>
        </div>
      </div>

      {/* QR */}
      <div className="flex justify-end mt-10">
        <ZatcaQrBlock value={qrData} size={180} />
      </div>

      {/* Footer */}
      <div className="mt-10 text-center text-[11px] text-gray-700 border-t pt-3">
        <div>{companyAddress}</div>
        {taxSettings?.phone && (
          <div dir="ltr" className="mt-1">{taxSettings.phone}</div>
        )}
      </div>
    </div>
  );
});

InvoiceTemplate6.displayName = 'InvoiceTemplate6';
