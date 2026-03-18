import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { JournalEntry, AccountCategory } from '@/services/accounting';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface JournalEntryPrintDialogProps {
  entry: JournalEntry | null;
  accounts: AccountCategory[];
  open: boolean;
  onClose: () => void;
}

export function JournalEntryPrintDialog({ entry, accounts, open, onClose }: JournalEntryPrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { companyId } = useCompany();
  const { data: companySettings } = useCompanySettings(companyId);

  const getAccount = (accountId: string) => {
    return accounts.find(a => a.id === accountId);
  };

  const getReferenceTypeLabel = (type: string | null) => {
    switch (type) {
      case 'manual': return 'قيد يومية';
      case 'sale': return 'مبيعات';
      case 'purchase': return 'مشتريات';
      case 'expense': return 'مصروفات';
      case 'voucher': return 'سند';
      case 'payroll': return 'رواتب';
      case 'bank_transaction': return 'كشف بنكي';
      case 'invoice_purchase': return 'فاتورة شراء';
      default: return 'قيد يومية';
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const companyName = companySettings?.app_name || 'اسم الشركة';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>سند قيد يومية رقم ${entry?.entry_number}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
            background: white;
            color: #000;
            font-size: 13px;
          }
          .voucher {
            max-width: 780px;
            margin: 0 auto;
            padding: 20px;
          }
          /* === Header Section === */
          .header-grid {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: start;
            margin-bottom: 6px;
          }
          .header-right { text-align: right; }
          .header-center { text-align: center; }
          .header-left { text-align: left; }
          .header-box {
            display: inline-block;
            border: 1.5px solid #000;
            padding: 4px 14px;
            font-size: 13px;
            min-width: 140px;
          }
          .header-box-label { font-weight: normal; }
          .header-box-value { font-weight: bold; }
          .voucher-title {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .voucher-subtitle {
            font-size: 13px;
            color: #444;
          }
          /* === Info Row === */
          .info-row {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            margin-bottom: 10px;
          }
          .info-row-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
          }
          .info-row-item.right { justify-content: flex-start; }
          .info-row-item.center { justify-content: center; }
          .info-row-item.left { justify-content: flex-end; }
          /* === Description === */
          .desc-section {
            border: 1.5px solid #000;
            padding: 6px 12px;
            margin-bottom: 12px;
            min-height: 32px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .desc-label { font-weight: bold; white-space: nowrap; }
          .desc-value { flex: 1; }
          /* === Table === */
          .lines-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
          }
          .lines-table th {
            background: #1a1a2e;
            color: #fff;
            font-weight: bold;
            padding: 8px 6px;
            text-align: center;
            border: 1px solid #000;
            font-size: 12px;
          }
          .lines-table td {
            padding: 7px 6px;
            text-align: center;
            border: 1px solid #999;
            font-size: 12px;
          }
          .lines-table tbody tr:nth-child(even) { background: #f7f7f7; }
          .lines-table .account-name { text-align: right; padding-right: 10px; }
          .lines-table .amount-cell {
            font-family: 'Courier New', monospace;
            font-size: 13px;
            direction: ltr;
            text-align: center;
          }
          .lines-table .total-row {
            background: #e8e8e8 !important;
            font-weight: bold;
          }
          .lines-table .total-row td {
            border-top: 2px solid #000;
            padding: 8px 6px;
            font-size: 13px;
          }
          .total-label { text-align: center; font-weight: bold; letter-spacing: 6px; }
          /* === Footer Signatures === */
          .signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            margin-top: 50px;
            gap: 20px;
          }
          .sig-block { text-align: center; }
          .sig-title { font-weight: bold; font-size: 13px; margin-bottom: 30px; }
          .sig-line { border-top: 1px solid #000; padding-top: 4px; font-size: 11px; color: #666; }
          @media print {
            body { padding: 0; }
            .voucher { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="voucher">
          ${printContent.innerHTML}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  if (!entry) return null;

  const lines = entry.lines || [];
  const companyName = companySettings?.app_name || 'اسم الشركة';

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="w-[98vw] max-w-[900px] h-[90vh] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-3">
          <DialogTitle className="flex items-center justify-between">
            <span>سند قيد يومية #{entry.entry_number}</span>
            <div className="flex gap-2">
              <Button onClick={handlePrint} size="sm" className="gap-2">
                <Printer className="w-4 h-4" />
                طباعة
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Print Preview Content */}
        <div ref={printRef} style={{ padding: '24px', background: '#fff', color: '#000', direction: 'rtl', fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
          
          {/* === Header === */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'start', marginBottom: '8px' }}>
            {/* Right: سند رقم */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', border: '1.5px solid #000', padding: '4px 14px', fontSize: '13px' }}>
                <span>سند رقم: </span>
                <strong>{entry.entry_number}</strong>
              </div>
            </div>
            {/* Center: Title */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold' }}>سند قيد يومية</div>
            </div>
            {/* Left: قيد نظام رقم */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'inline-block', border: '1.5px solid #000', padding: '4px 14px', fontSize: '13px' }}>
                <span>قيد نظام رقم: </span>
                <strong>{entry.entry_number}</strong>
              </div>
            </div>
          </div>

          {/* === Info Row: Date, Type, Branch === */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ textAlign: 'right', fontSize: '13px' }}>
              <span>التاريخ: </span>
              <strong>{format(new Date(entry.entry_date), 'yyyy-MM-dd')}</strong>
            </div>
            <div style={{ textAlign: 'center', fontSize: '13px' }}>
              {getReferenceTypeLabel(entry.reference_type)}
            </div>
            <div style={{ textAlign: 'left', fontSize: '13px' }}>
              <div style={{ display: 'inline-block', border: '1.5px solid #000', padding: '2px 14px' }}>
                <span>الفرع: </span>
                <strong>1</strong>
              </div>
            </div>
          </div>

          {/* === Description === */}
          <div style={{ border: '1.5px solid #000', padding: '6px 12px', marginBottom: '14px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', minHeight: '32px' }}>
            <strong style={{ whiteSpace: 'nowrap' }}>البيان:</strong>
            <span>{entry.description || ''}</span>
          </div>

          {/* === Lines Table === */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
            <thead>
              <tr>
                <th style={{ background: '#1a1a2e', color: '#fff', fontWeight: 'bold', padding: '8px 6px', textAlign: 'center', border: '1px solid #000', fontSize: '12px', width: '35px' }}>م</th>
                <th style={{ background: '#1a1a2e', color: '#fff', fontWeight: 'bold', padding: '8px 6px', textAlign: 'center', border: '1px solid #000', fontSize: '12px', width: '80px' }}>حساب رقم</th>
                <th style={{ background: '#1a1a2e', color: '#fff', fontWeight: 'bold', padding: '8px 6px', textAlign: 'center', border: '1px solid #000', fontSize: '12px' }}>اسم الحساب</th>
                <th style={{ background: '#1a1a2e', color: '#fff', fontWeight: 'bold', padding: '8px 6px', textAlign: 'center', border: '1px solid #000', fontSize: '12px', width: '100px' }}>مدين</th>
                <th style={{ background: '#1a1a2e', color: '#fff', fontWeight: 'bold', padding: '8px 6px', textAlign: 'center', border: '1px solid #000', fontSize: '12px', width: '100px' }}>دائن</th>
                <th style={{ background: '#1a1a2e', color: '#fff', fontWeight: 'bold', padding: '8px 6px', textAlign: 'center', border: '1px solid #000', fontSize: '12px', width: '90px' }}>مركز تكلفة</th>
                <th style={{ background: '#1a1a2e', color: '#fff', fontWeight: 'bold', padding: '8px 6px', textAlign: 'center', border: '1px solid #000', fontSize: '12px' }}>البيان</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const account = getAccount(line.account_id);
                return (
                  <tr key={line.id} style={{ background: index % 2 === 1 ? '#f7f7f7' : '#fff' }}>
                    <td style={{ padding: '7px 6px', textAlign: 'center', border: '1px solid #999', fontSize: '12px' }}>{index + 1}</td>
                    <td style={{ padding: '7px 6px', textAlign: 'center', border: '1px solid #999', fontSize: '12px' }}>{account?.code || ''}</td>
                    <td style={{ padding: '7px 6px', textAlign: 'right', paddingRight: '10px', border: '1px solid #999', fontSize: '12px' }}>{account?.name || ''}</td>
                    <td style={{ padding: '7px 6px', textAlign: 'center', border: '1px solid #999', fontSize: '13px', fontFamily: "'Courier New', monospace", direction: 'ltr' }}>
                      {line.debit > 0 ? plainFormat(line.debit) : '0'}
                    </td>
                    <td style={{ padding: '7px 6px', textAlign: 'center', border: '1px solid #999', fontSize: '13px', fontFamily: "'Courier New', monospace", direction: 'ltr' }}>
                      {line.credit > 0 ? plainFormat(line.credit) : '0'}
                    </td>
                    <td style={{ padding: '7px 6px', textAlign: 'center', border: '1px solid #999', fontSize: '12px' }}></td>
                    <td style={{ padding: '7px 6px', textAlign: 'right', paddingRight: '10px', border: '1px solid #999', fontSize: '12px' }}>{line.description || ''}</td>
                  </tr>
                );
              })}
              {/* Total Row */}
              <tr style={{ background: '#e8e8e8', fontWeight: 'bold' }}>
                <td colSpan={3} style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #000', borderTop: '2px solid #000', fontSize: '13px', fontWeight: 'bold', letterSpacing: '6px' }}>
                  الإجـــــــــمـــالي
                </td>
                <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #000', borderTop: '2px solid #000', fontSize: '13px', fontFamily: "'Courier New', monospace", direction: 'ltr', fontWeight: 'bold' }}>
                  {plainFormat(entry.total_debit)}
                </td>
                <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #000', borderTop: '2px solid #000', fontSize: '13px', fontFamily: "'Courier New', monospace", direction: 'ltr', fontWeight: 'bold' }}>
                  {plainFormat(entry.total_credit)}
                </td>
                <td colSpan={2} style={{ padding: '8px 6px', border: '1px solid #000', borderTop: '2px solid #000' }}></td>
              </tr>
            </tbody>
          </table>

          {/* === Signatures === */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '50px', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '30px' }}>المدير المالي</div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: '11px', color: '#666' }}></div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '30px' }}>المراجع</div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: '11px', color: '#666' }}></div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '30px' }}>المحاسب</div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: '11px', color: '#666' }}></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
