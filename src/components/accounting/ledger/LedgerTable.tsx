/**
 * General Ledger - Table & Summary
 * Extracted from GeneralLedgerPage.tsx
 */
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LedgerTableProps {
  ledger: any;
  filteredEntries: any[];
  dateRange: { from: Date | undefined; to: Date | undefined };
  searchQuery: string;
  transactionFilter: string;
  t: any;
  formatCurrency: (v: number) => string;
}

function getReferenceTypeBadge(type: string | null, t: any) {
  switch (type) {
    case 'sale': return <Badge variant="default" className="bg-green-500">{t.je_type_sales}</Badge>;
    case 'purchase': return <Badge variant="default" className="bg-blue-500">{t.je_type_purchases}</Badge>;
    case 'expense': return <Badge variant="default" className="bg-orange-500">{t.je_type_expenses}</Badge>;
    case 'manual': return <Badge variant="secondary">{t.je_type_manual}</Badge>;
    default: return <Badge variant="outline">{t.gl_general}</Badge>;
  }
}

export function LedgerTable({ ledger, filteredEntries, searchQuery, transactionFilter, t, formatCurrency }: LedgerTableProps) {
  if (filteredEntries.length === 0 && !searchQuery && transactionFilter === 'all') {
    return <p className="text-center text-muted-foreground py-8">{t.gl_no_transactions}</p>;
  }
  if (filteredEntries.length === 0) {
    return <p className="text-center text-muted-foreground py-8">{t.gl_no_match_search}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        {t.gl_showing} {filteredEntries.length} {t.gl_of} {ledger.entries.length} {t.gl_transactions}
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">{t.je_col_date}</TableHead>
              <TableHead className="w-20">{t.acc_entry_number}</TableHead>
              <TableHead>{t.je_col_statement}</TableHead>
              <TableHead className="w-20">{t.je_col_type}</TableHead>
              <TableHead className="w-28 text-left">{t.acc_debit}</TableHead>
              <TableHead className="w-28 text-left">{t.acc_credit}</TableHead>
              <TableHead className="w-32 text-left">{t.acc_balance}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/30">
              <TableCell colSpan={4} className="font-medium">{t.gl_opening_balance}</TableCell>
              <TableCell className="text-left">-</TableCell>
              <TableCell className="text-left">-</TableCell>
              <TableCell className={cn("text-left font-medium", ledger.openingBalance >= 0 ? "text-green-600" : "text-red-600")}>
                {formatCurrency(ledger.openingBalance)}
              </TableCell>
            </TableRow>
            
            {filteredEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{format(new Date(entry.date), "yyyy/MM/dd")}</TableCell>
                <TableCell className="font-mono">{entry.entry_number}</TableCell>
                <TableCell className="max-w-[300px] truncate" title={entry.description}>{entry.description}</TableCell>
                <TableCell>{getReferenceTypeBadge(entry.reference_type, t)}</TableCell>
                <TableCell className="text-left font-mono">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</TableCell>
                <TableCell className="text-left font-mono">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</TableCell>
                <TableCell className={cn("text-left font-medium font-mono", entry.balance >= 0 ? "text-green-600" : "text-red-600")}>
                  {formatCurrency(entry.balance)}
                </TableCell>
              </TableRow>
            ))}
            
            <TableRow className="bg-muted/30">
              <TableCell colSpan={4} className="font-medium">{t.gl_closing_balance}</TableCell>
              <TableCell className="text-left">-</TableCell>
              <TableCell className="text-left">-</TableCell>
              <TableCell className={cn("text-left font-bold", ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600")}>
                {formatCurrency(ledger.closingBalance)}
              </TableCell>
            </TableRow>
            
            <TableRow className="bg-primary/10 font-bold">
              <TableCell colSpan={4}>{t.total}</TableCell>
              <TableCell className="text-left font-mono">{formatCurrency(ledger.totalDebit)}</TableCell>
              <TableCell className="text-left font-mono">{formatCurrency(ledger.totalCredit)}</TableCell>
              <TableCell className={cn("text-left font-mono", ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600")}>
                {formatCurrency(ledger.closingBalance)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <LedgerSummaryCards ledger={ledger} filteredEntries={filteredEntries} formatCurrency={formatCurrency} t={t} />
    </div>
  );
}

function LedgerSummaryCards({ ledger, filteredEntries, formatCurrency, t }: { ledger: any; filteredEntries: any[]; formatCurrency: (v: number) => string; t: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
      <div className="p-4 rounded-lg bg-muted/50 border">
        <p className="text-sm text-muted-foreground">{t.gl_opening_balance}</p>
        <p className={cn("text-lg font-bold", ledger.openingBalance >= 0 ? "text-green-600" : "text-red-600")}>{formatCurrency(ledger.openingBalance)}</p>
      </div>
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-600">{t.gl_total_debit}</p>
        <p className="text-lg font-bold text-blue-700">{formatCurrency(ledger.totalDebit)}</p>
      </div>
      <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
        <p className="text-sm text-orange-600">{t.gl_total_credit}</p>
        <p className="text-lg font-bold text-orange-700">{formatCurrency(ledger.totalCredit)}</p>
      </div>
      <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
        <p className="text-sm text-purple-600">{t.gl_transaction_count}</p>
        <p className="text-lg font-bold text-purple-700">{filteredEntries.length}</p>
      </div>
      <div className={cn("p-4 rounded-lg border", ledger.closingBalance >= 0 ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800")}>
        <p className={cn("text-sm", ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600")}>{t.gl_closing_balance}</p>
        <p className={cn("text-lg font-bold", ledger.closingBalance >= 0 ? "text-green-700" : "text-red-700")}>{formatCurrency(ledger.closingBalance)}</p>
      </div>
    </div>
  );
}
