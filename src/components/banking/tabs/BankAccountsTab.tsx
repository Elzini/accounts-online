import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { useBankingPage } from '../useBankingPage';

export function BankAccountsTab({ ctx }: { ctx: ReturnType<typeof useBankingPage> }) {
  const { t, bankAccounts, currency, formatCurrency } = ctx;
  return (
    <Card><CardContent className="p-0"><Table>
      <TableHeader><TableRow>
        <TableHead className="text-right">{t.bank_account_name}</TableHead>
        <TableHead className="text-right">{t.bank_name_label}</TableHead>
        <TableHead className="text-right">{t.bank_account_number}</TableHead>
        <TableHead className="text-right">IBAN</TableHead>
        <TableHead className="text-right">{t.bank_current_balance}</TableHead>
        <TableHead className="text-right">{t.status}</TableHead>
        <TableHead className="text-right">{t.actions}</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {bankAccounts.map(account => (
          <TableRow key={account.id}>
            <TableCell className="font-medium">{account.account_name}</TableCell>
            <TableCell>{account.bank_name}</TableCell>
            <TableCell dir="ltr">{account.account_number || '-'}</TableCell>
            <TableCell dir="ltr" className="text-xs">{account.iban || '-'}</TableCell>
            <TableCell className="font-bold">{formatCurrency(Number(account.current_balance))} {currency}</TableCell>
            <TableCell><Badge className={account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{account.is_active ? t.fin_active : t.fin_inactive}</Badge></TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => {
                  ctx.setEditingAccount(account);
                  ctx.setEditAccountForm({ account_name: account.account_name, bank_name: account.bank_name, account_number_encrypted: account.account_number || '', iban_encrypted: account.iban || '', account_category_id: account.account_category_id || '', opening_balance: Number(account.opening_balance), notes: account.notes || '' });
                  ctx.setShowEditAccountDialog(true);
                }}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => ctx.setDeleteAccountId(account.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {bankAccounts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t.bank_no_accounts}</TableCell></TableRow>}
      </TableBody>
    </Table></CardContent></Card>
  );
}
