import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
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

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : accountId;
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>قيد محاسبي رقم ${entry?.entry_number}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
            padding: 20px;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 24px;
            border-bottom: 2px solid #333;
            padding-bottom: 16px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .document-title {
            font-size: 20px;
            font-weight: bold;
            color: #444;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 24px;
            padding: 16px;
            background: #f5f5f5;
            border-radius: 8px;
          }
          .info-item {
            text-align: center;
          }
          .info-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 16px;
            font-weight: bold;
          }
          .description {
            padding: 12px;
            background: #f9f9f9;
            border-radius: 4px;
            margin-bottom: 20px;
            border-right: 4px solid #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px 8px;
            text-align: center;
          }
          th {
            background: #333;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          .total-row {
            background: #eee !important;
            font-weight: bold;
          }
          .account-cell {
            text-align: right;
          }
          .amount {
            font-family: monospace;
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            text-align: center;
          }
          .signature-box {
            padding: 20px;
            border-top: 2px solid #333;
          }
          .signature-label {
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!entry) return null;

  const getReferenceTypeLabel = (type: string | null) => {
    switch (type) {
      case 'manual': return 'يدوي';
      case 'sale': return 'مبيعات';
      case 'purchase': return 'مشتريات';
      case 'expense': return 'مصروفات';
      case 'voucher': return 'سند';
      default: return 'تلقائي';
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>طباعة القيد #{entry.entry_number}</span>
            <div className="flex gap-2">
              <Button onClick={handlePrint} size="sm">
                <Printer className="w-4 h-4 ml-2" />
                طباعة
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="p-4 bg-white">
          {/* Header */}
          <div className="header">
            <div className="company-name">{companySettings?.app_name || 'اسم الشركة'}</div>
            <div className="document-title">قيد محاسبي</div>
          </div>

          {/* Info Grid */}
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">رقم القيد</div>
              <div className="info-value">{entry.entry_number}</div>
            </div>
            <div className="info-item">
              <div className="info-label">التاريخ</div>
              <div className="info-value">{format(new Date(entry.entry_date), 'yyyy/MM/dd')}</div>
            </div>
            <div className="info-item">
              <div className="info-label">النوع</div>
              <div className="info-value">{getReferenceTypeLabel(entry.reference_type)}</div>
            </div>
          </div>

          {/* Description */}
          <div className="description">
            <strong>البيان:</strong> {entry.description}
          </div>

          {/* Lines Table */}
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>الحساب</th>
                <th style={{ width: '120px' }}>مدين</th>
                <th style={{ width: '120px' }}>دائن</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines?.map((line, index) => (
                <tr key={line.id}>
                  <td>{index + 1}</td>
                  <td className="account-cell">{getAccountName(line.account_id)}</td>
                  <td className="amount">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</td>
                  <td className="amount">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={2}>الإجمالي</td>
                <td className="amount">{entry.total_debit.toLocaleString()}</td>
                <td className="amount">{entry.total_credit.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div className="footer">
            <div className="signature-box">
              <div className="signature-label">المحاسب</div>
            </div>
            <div className="signature-box">
              <div className="signature-label">المدير المالي</div>
            </div>
            <div className="signature-box">
              <div className="signature-label">المدير العام</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
