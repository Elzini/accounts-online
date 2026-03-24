import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { useBankingPage } from '../useBankingPage';

export function BankReconciliationsTab({ ctx }: { ctx: ReturnType<typeof useBankingPage> }) {
  const { t, reconciliations, currency, formatCurrency } = ctx;
  return (
    <Card><CardContent className="p-0"><Table>
      <TableHeader><TableRow>
        <TableHead className="text-right">{t.bank_reconciliation_account}</TableHead>
        <TableHead className="text-right">{t.bank_reconciliation_date}</TableHead>
        <TableHead className="text-right">{t.bank_statement_balance}</TableHead>
        <TableHead className="text-right">{t.bank_book_balance}</TableHead>
        <TableHead className="text-right">{t.bank_difference}</TableHead>
        <TableHead className="text-right">{t.status}</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {reconciliations.map(rec => (
          <TableRow key={rec.id}>
            <TableCell className="font-medium">{rec.bank_account?.account_name}</TableCell>
            <TableCell>{rec.reconciliation_date}</TableCell>
            <TableCell>{formatCurrency(Number(rec.statement_ending_balance))} {currency}</TableCell>
            <TableCell>{formatCurrency(Number(rec.book_balance))} {currency}</TableCell>
            <TableCell className={Number(rec.difference) !== 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{formatCurrency(Number(rec.difference))} {currency}</TableCell>
            <TableCell><Badge className={rec.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{rec.status === 'approved' ? t.bank_approved : rec.status === 'completed' ? t.bank_completed : t.bank_draft}</Badge></TableCell>
          </TableRow>
        ))}
        {reconciliations.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t.bank_no_reconciliations}</TableCell></TableRow>}
      </TableBody>
    </Table></CardContent></Card>
  );
}
