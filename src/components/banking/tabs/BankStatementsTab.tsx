import { Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { useBankingPage } from '../useBankingPage';

export function BankStatementsTab({ ctx }: { ctx: ReturnType<typeof useBankingPage> }) {
  const { t, language, statements, formatCurrency } = ctx;
  return (
    <Card><CardContent className="p-0"><Table>
      <TableHeader><TableRow>
        <TableHead className="text-right">{t.bank_statement_account}</TableHead>
        <TableHead className="text-right">{t.bank_statement_date}</TableHead>
        <TableHead className="text-right">{t.bank_file_name}</TableHead>
        <TableHead className="text-right">{t.bank_transactions_count}</TableHead>
        <TableHead className="text-right">{t.bank_matched}</TableHead>
        <TableHead className="text-right">{t.bank_unmatched}</TableHead>
        <TableHead className="text-right">{t.status}</TableHead>
        <TableHead className="text-right">{t.actions}</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {statements.map(statement => (
          <TableRow key={statement.id}>
            <TableCell className="font-medium">{statement.bank_account?.account_name}</TableCell>
            <TableCell>{statement.statement_date}</TableCell>
            <TableCell className="text-sm">{statement.file_name || '-'}</TableCell>
            <TableCell>{statement.total_transactions}</TableCell>
            <TableCell className="text-green-600"><div className="flex items-center gap-1"><CheckCircle className="w-4 h-4" />{statement.matched_transactions}</div></TableCell>
            <TableCell className="text-orange-600"><div className="flex items-center gap-1"><XCircle className="w-4 h-4" />{statement.unmatched_transactions}</div></TableCell>
            <TableCell><Badge className={statement.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{statement.status === 'completed' ? t.bank_completed : t.bank_processing}</Badge></TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => { ctx.setSelectedStatement(statement); ctx.setShowTransactionsDialog(true); }}><Eye className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => { ctx.setEditingStatement(statement); ctx.setEditStatementForm({ statement_date: statement.statement_date, notes: statement.notes || '', file_name: statement.file_name || '' }); ctx.setShowEditStatementDialog(true); }}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => ctx.setDeleteStatementId(statement.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {statements.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t.bank_no_statements}</TableCell></TableRow>}
      </TableBody>
    </Table></CardContent></Card>
  );
}
