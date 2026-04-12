import { forwardRef } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { useZatcaPhase2QR } from '@/hooks/useZatcaPhase2QR';
import { numberToArabicWords } from '@/lib/numberToArabicWords';
import { InvoiceTemplateData, defaultInvoiceLabels } from './types';

interface Props { data: InvoiceTemplateData; }

export const InvoiceTemplate5 = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const {
    invoiceNumber, invoiceDate, sellerName, sellerTaxNumber, sellerAddress,
    sellerCommercialRegister, sellerPhone,
    buyerName, buyerPhone, buyerAddress, buyerTaxNumber,
    items, subtotal, discountAmount = 0, taxAmount, total,
    taxSettings, companyLogoUrl, invoiceType, paidAmount = 0,
  } = data;
  const L = { ...defaultInvoiceLabels, ...data.customLabels };

  const formattedDate = (() => {
    try {
      const d = new Date(invoiceDate);
      return format(d, 'dd/MM/yyyy');
    } catch { return invoiceDate; }
  })();
  const formattedTime = (() => {
    try {
      const d = new Date(invoiceDate);
      return format(d, 'hh:mm a');
    } catch { return ''; }
  })();

  const taxRate = taxSettings?.tax_rate || 15;
  const vatNumber = invoiceType === 'sale' ? (taxSettings?.tax_number || sellerTaxNumber || '') : (sellerTaxNumber || '');
  const crn = invoiceType === 'sale' ? (taxSettings?.commercial_register || sellerCommercialRegister || '') : (sellerCommercialRegister || '');
  const companyNameAr = taxSettings?.company_name_ar || sellerName;
  const companyNameEn = (taxSettings as any)?.company_name_en || sellerName;
  const displayLogo = companyLogoUrl || null;

  const buyerCrn = (data as any).buyerCommercialRegister || '';
  const poDetails = (data as any).poDetails || '';
  const projectReference = (data as any).projectReference || '';
  const paymentStatus = paidAmount >= total ? 'مدفوع' : paidAmount > 0 ? 'مدفوع جزئياً' : 'غير مدفوع';
  const paymentStatusEn = paidAmount >= total ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid';

  const qrData = useZatcaPhase2QR({
    sellerName: invoiceType === 'sale' ? companyNameAr : sellerName,
    vatNumber: vatNumber || '300000000000003',
    invoiceDateTime: invoiceDate,
    invoiceTotal: total, vatAmount: taxAmount,
    invoiceNumber,
  });

  const itemsWithTax = items.map(item => ({
    ...item,
    taxableAmount: item.unitPrice * item.quantity,
    taxAmount: item.taxAmount ?? (item.unitPrice * item.quantity * (item.taxRate / 100)),
    subtotalWithTax: (item.unitPrice * item.quantity) + (item.taxAmount ?? (item.unitPrice * item.quantity * (item.taxRate / 100))),
  }));

  // Bank details from tax settings
  const bankName = (taxSettings as any)?.bank_name || '';
  const bankIban = (taxSettings as any)?.bank_iban || '';
  const bankAccountName = companyNameAr;

  const cellClass = "p-1.5 border border-gray-400 text-[9px]";
  const headerCellClass = "p-1.5 border border-gray-400 text-[9px] font-bold bg-gray-200 text-center";

  return (
    <div ref={ref} className="bg-white max-w-[210mm] mx-auto text-black" style={{ fontFamily: 'Cairo, Arial, sans-serif', fontSize: '10px' }} dir="rtl">
      {/* === Header: Title + Company Info === */}
      <div className="border-2 border-gray-600">
        {/* Top Title Bar */}
        <div className="bg-emerald-700 text-white text-center py-2">
          <div className="flex justify-between px-4 items-center">
             <span className="text-base font-bold">{L.invoiceTitle}</span>
             <span className="text-base font-bold">{L.invoiceTitleEn}</span>
          </div>
        </div>

        {/* Company Row */}
        <div className="flex items-center border-b border-gray-400">
          <div className="flex-1 p-2 text-right">
            <p className="font-bold text-sm">{companyNameAr}</p>
          </div>
          {displayLogo && (
            <div className="px-3 py-1">
              <img src={displayLogo} alt="Logo" className="h-14 w-auto object-contain" />
            </div>
          )}
          <div className="flex-1 p-2 text-left" dir="ltr">
            <p className="font-bold text-sm">{companyNameEn}</p>
          </div>
        </div>

        {/* VAT + CRN Row */}
        <div className="flex border-b border-gray-400 text-[9px]">
          <div className="flex-1 flex">
            <span className={`${cellClass} font-bold w-20`}>VAT NO.:</span>
            <span className={`${cellClass} flex-1`} dir="ltr">{vatNumber}</span>
          </div>
          <div className="flex-1 flex">
            <span className={`${cellClass} font-bold w-16`}>CRN</span>
            <span className={`${cellClass} flex-1`} dir="ltr">{crn}</span>
          </div>
          <div className="flex-1 flex">
            <span className={`${cellClass} flex-1`} dir="ltr">{crn}</span>
            <span className={`${cellClass} font-bold w-20`}>رقم السجل</span>
          </div>
          <div className="flex-1 flex">
            <span className={`${cellClass} flex-1`} dir="ltr">{vatNumber}</span>
            <span className={`${cellClass} font-bold w-24`}>الرقم الضريبي</span>
          </div>
        </div>

        {/* === Client Details Section === */}
        <div className="bg-gray-200 text-center py-1 border-b border-gray-400 font-bold text-[10px]">
          Client Details | تفاصيل العميل
        </div>

        {/* Client Headers */}
        <div className="flex border-b border-gray-400">
          <div className={`${cellClass} font-bold flex-[2] text-center`}>Name اسم</div>
          <div className={`${cellClass} font-bold flex-[2] text-center`}>VAT NO الرقم الضريبي</div>
          <div className={`${cellClass} font-bold flex-[1.5] text-center`}>CRN رقم السجل</div>
          <div className={`${cellClass} font-bold flex-[2] text-center`}>Address عنوان</div>
        </div>
        {/* Client Values */}
        <div className="flex border-b border-gray-400">
          <div className={`${cellClass} flex-[2]`}>{buyerName}</div>
          <div className={`${cellClass} flex-[2]`} dir="ltr">{buyerTaxNumber || '-'}</div>
          <div className={`${cellClass} flex-[1.5]`} dir="ltr">{buyerCrn || '-'}</div>
          <div className={`${cellClass} flex-[2]`}>{buyerAddress || '-'}</div>
        </div>

        {/* === Invoice Meta Headers === */}
        <div className="flex border-b border-gray-400">
          <div className={`${headerCellClass} flex-[1.5]`}>Invoice Date<br />تاريخ الفاتورة</div>
          <div className={`${headerCellClass} flex-1`}>Invoice No.<br />رقم الفاتورة</div>
          <div className={`${headerCellClass} flex-[1.5]`}>P.O. Details<br />تفاصيل أمر الشراء</div>
          <div className={`${headerCellClass} flex-1`}>Bill Type<br />نوع الفاتورة</div>
          <div className={`${headerCellClass} flex-1`}>Payment Status<br />حالة السداد</div>
          <div className={`${headerCellClass} flex-[1.5]`}>Project/Reference No<br />رقم المرجع</div>
        </div>
        {/* Invoice Meta Values */}
        <div className="flex border-b border-gray-400">
          <div className={`${cellClass} flex-[1.5] text-center`}>
            {formattedDate}
            {formattedTime && <><br />{formattedTime}</>}
          </div>
          <div className={`${cellClass} flex-1 text-center font-bold`}>{invoiceNumber}</div>
          <div className={`${cellClass} flex-[1.5] text-center`}>{poDetails || '-'}</div>
          <div className={`${cellClass} flex-1 text-center`}>{invoiceType === 'sale' ? L.invoiceTitle : 'فاتورة مشتريات'}</div>
          <div className={`${cellClass} flex-1 text-center`}>{paymentStatus}</div>
          <div className={`${cellClass} flex-[1.5] text-center`}>{projectReference || '-'}</div>
        </div>

        {/* === Items Table === */}
        <div className="flex border-b border-gray-400 bg-emerald-700 text-white">
          <div className="p-1.5 border-l border-gray-300 text-[9px] font-bold text-center w-8">#</div>
           <div className="p-1.5 border-l border-gray-300 text-[9px] font-bold text-center flex-[3]">Nature of Goods/Services<br />{L.descriptionColumn}</div>
           <div className="p-1.5 border-l border-gray-300 text-[9px] font-bold text-center flex-1">{L.plateNumberLabelEn}<br />{L.plateNumberLabel}</div>
           <div className="p-1.5 border-l border-gray-300 text-[9px] font-bold text-center w-12">{L.quantityColumn}<br />Qty</div>
           <div className="p-1.5 border-l border-gray-300 text-[9px] font-bold text-center flex-1">Unit Rate (SAR)<br />{L.priceColumn}</div>
           <div className="p-1.5 border-l border-gray-300 text-[9px] font-bold text-center flex-1">Taxable Amount<br />خاضع للضريبة</div>
           <div className="p-1.5 border-l border-gray-300 text-[9px] font-bold text-center w-14">VAT %{taxRate}<br />{L.taxColumn}</div>
           <div className="p-1.5 border-l border-gray-300 text-[9px] font-bold text-center flex-1">Tax Amount<br />مبلغ {L.taxColumn}</div>
           <div className="p-1.5 text-[9px] font-bold text-center flex-1">Subtotal(SAR)<br />{L.totalColumn}</div>
        </div>

        {itemsWithTax.map((item, i) => {
          return (
            <div key={i} className="flex border-b border-gray-400">
              <div className={`${cellClass} text-center w-8`}>{i + 1}</div>
              <div className={`${cellClass} flex-[3]`}>{item.description}</div>
              <div className={`${cellClass} text-center flex-1`}>{data.plateNumber || '-'}</div>
              <div className={`${cellClass} text-center w-12`}>{item.quantity}</div>
              <div className={`${cellClass} text-center flex-1`} dir="ltr">{item.unitPrice.toFixed(2)}</div>
              <div className={`${cellClass} text-center flex-1`} dir="ltr">{item.taxableAmount.toFixed(2)}</div>
              <div className={`${cellClass} text-center w-14`}>%{taxRate}</div>
              <div className={`${cellClass} text-center flex-1`} dir="ltr">{item.taxAmount.toFixed(2)}</div>
              <div className={`${cellClass} text-center flex-1 font-bold`} dir="ltr">{item.subtotalWithTax.toFixed(2)}</div>
            </div>
          );
        })}

        {/* Add empty rows if few items */}
        {itemsWithTax.length < 3 && Array.from({ length: 3 - itemsWithTax.length }).map((_, i) => (
          <div key={`empty-${i}`} className="flex border-b border-gray-400">
            <div className={`${cellClass} text-center w-8`}>&nbsp;</div>
            <div className={`${cellClass} flex-[3]`}>&nbsp;</div>
            <div className={`${cellClass} text-center flex-1`}>&nbsp;</div>
            <div className={`${cellClass} text-center w-12`}>&nbsp;</div>
            <div className={`${cellClass} text-center flex-1`}>&nbsp;</div>
            <div className={`${cellClass} text-center flex-1`}>&nbsp;</div>
            <div className={`${cellClass} text-center w-14`}>&nbsp;</div>
            <div className={`${cellClass} text-center flex-1`}>&nbsp;</div>
            <div className={`${cellClass} text-center flex-1`}>&nbsp;</div>
          </div>
        ))}

        {/* === Totals + QR === */}
        <div className="flex border-b border-gray-400">
          {/* QR Code */}
          <div className="flex-1 p-3 flex items-center justify-center border-l border-gray-400">
            <QRCodeSVG value={qrData} size={110} level="L" includeMargin={true} />
          </div>
          {/* Totals */}
          <div className="flex-1">
            <div className="flex border-b border-gray-400">
             <div className={`${cellClass} flex-1 font-bold`}>Subtotal {L.subtotalLabel}</div>
               <div className={`${cellClass} w-28 text-center font-bold`} dir="ltr">{subtotal.toFixed(2)}</div>
             </div>
             <div className="flex border-b border-gray-400">
               <div className={`${cellClass} flex-1 font-bold`}>VAT%{taxRate} {L.taxLabel}</div>
               <div className={`${cellClass} w-28 text-center font-bold`} dir="ltr">{taxAmount.toFixed(2)}</div>
             </div>
             <div className="flex border-b border-gray-400 bg-gray-100">
               <div className={`${cellClass} flex-1 font-bold`}>Total Amount {L.grandTotalLabel}</div>
               <div className={`${cellClass} w-28 text-center font-bold text-sm`} dir="ltr">{total.toFixed(2)}</div>
            </div>
            <div className="flex">
              <div className={`${cellClass} flex-1 font-bold`}>Total Paid مجموع المبالغ المدفوعة</div>
              <div className={`${cellClass} w-28 text-center font-bold`} dir="ltr">{(paidAmount || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Total in Words */}
        <div className="bg-gray-100 text-center py-2 border-b border-gray-400 text-[10px] font-bold px-4">
          المبلغ الإجمالي بالكلمات: {numberToArabicWords(Math.round(total))} ريالاً فقط لا غير
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="px-4 py-2 border-b border-gray-400 text-[9px]">
            <span className="font-bold">ملاحظات / Notes: </span>
            <span className="whitespace-pre-wrap">{data.notes}</span>
          </div>
        )}

        {/* === Bank Details === */}
        {(bankName || bankIban) && (
          <>
            <div className="bg-gray-200 text-center py-1 border-b border-gray-400 font-bold text-[10px]">
              Bank Details | تفاصيل الحساب البنكي
            </div>
            <div className="text-[9px]">
              <div className="flex border-b border-gray-400">
                <div className={`${cellClass} font-bold w-32`}>ACCOUNT NAME</div>
                <div className={`${cellClass} flex-1 font-bold`}>{bankAccountName}</div>
              </div>
              <div className="flex border-b border-gray-400">
                <div className={`${cellClass} font-bold w-32`}>BANK NAME</div>
                <div className={`${cellClass} flex-1 font-bold`}>{bankName}</div>
              </div>
              <div className="flex border-b border-gray-400">
                <div className={`${cellClass} font-bold w-32`}>IBAN</div>
                <div className={`${cellClass} flex-1 font-bold`} dir="ltr">{bankIban}</div>
              </div>
            </div>
          </>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-4 p-4 mt-6">
          <div className="text-center">
            <div className="border-b border-gray-400 pb-10 mb-1"></div>
            <p className="text-[9px] text-gray-600">Approved By / المعتمد</p>
          </div>
          <div className="text-center">
            <div className="border-b border-gray-400 pb-10 mb-1"></div>
            <p className="text-[9px] text-gray-600">Prepared By / المُعد</p>
          </div>
          <div className="text-center">
            <div className="border-b border-gray-400 pb-10 mb-1"></div>
            <p className="text-[9px] text-gray-600">Received By / المستلم</p>
          </div>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate5.displayName = 'InvoiceTemplate5';
