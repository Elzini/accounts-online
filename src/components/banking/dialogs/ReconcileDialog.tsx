import { useState, useMemo } from 'react';
import { Loader2, CheckCircle, XCircle, ArrowLeftRight, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBankTransactions, useBankAccounts } from '@/hooks/useBanking';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReconcileItem {
  type: 'matched' | 'bank_only' | 'book_only';
  date: string;
  description: string;
  bankDebit?: number;
  bankCredit?: number;
  bookDebit?: number;
  bookCredit?: number;
  bankTxnId?: string;
  bookLineId?: string;
}

export function ReconcileDialog({ open, onOpenChange, statement }: { open: boolean; onOpenChange: (open: boolean) => void; statement: any }) {
  const { language } = useLanguage();
  const { data: bankTransactions = [], isLoading: loadingTxns } = useBankTransactions(statement?.id || '');
  const { data: bankAccounts = [] } = useBankAccounts();
  const [filter, setFilter] = useState<'all' | 'matched' | 'bank_only' | 'book_only'>('all');

  const bankAccount = bankAccounts.find(ba => ba.id === statement?.bank_account_id);
  const accountCategoryId = bankAccount?.account_category_id;

  // Fetch journal entry lines for this bank account within date range
  const minDate = useMemo(() => {
    if (!bankTransactions.length) return null;
    return bankTransactions.reduce((min, t) => t.transaction_date < min ? t.transaction_date : min, bankTransactions[0].transaction_date);
  }, [bankTransactions]);

  const maxDate = useMemo(() => {
    if (!bankTransactions.length) return null;
    return bankTransactions.reduce((max, t) => t.transaction_date > max ? t.transaction_date : max, bankTransactions[0].transaction_date);
  }, [bankTransactions]);

  const { data: journalLines = [], isLoading: loadingJournal } = useQuery({
    queryKey: ['reconcile-journal-lines', accountCategoryId, minDate, maxDate],
    queryFn: async () => {
      if (!accountCategoryId || !minDate || !maxDate) return [];
      const { data, error } = await supabase
        .from('journal_entry_lines')
        .select('id, debit, credit, description, journal_entry:journal_entries!inner(entry_date, description, is_posted)')
        .eq('account_id', accountCategoryId)
        .gte('journal_entry.entry_date', minDate)
        .lte('journal_entry.entry_date', maxDate)
        .eq('journal_entry.is_posted', true);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!accountCategoryId && !!minDate && !!maxDate && open,
  });

  // Auto-match logic: match by amount + date
  const reconciled = useMemo<ReconcileItem[]>(() => {
    if (!bankTransactions.length && !journalLines.length) return [];

    const items: ReconcileItem[] = [];
    const usedJournalIds = new Set<string>();
    const usedBankIds = new Set<string>();

    // Try to match each bank transaction
    for (const btxn of bankTransactions) {
      const bankAmount = Number(btxn.debit || 0) - Number(btxn.credit || 0); // net from bank perspective
      let matched = false;

      for (const jl of journalLines) {
        if (usedJournalIds.has(jl.id)) continue;
        const entryDate = jl.journal_entry?.entry_date;
        // In accounting: debit to bank = money in (credit in bank statement), credit from bank = money out (debit in bank statement)
        // Bank debit (withdrawal) = Journal credit on bank account
        // Bank credit (deposit) = Journal debit on bank account
        const journalDebit = Number(jl.debit || 0);
        const journalCredit = Number(jl.credit || 0);
        const bankDebit = Number(btxn.debit || 0);
        const bankCredit = Number(btxn.credit || 0);

        // Match: bank debit matches journal credit, or bank credit matches journal debit
        const amountMatch = (bankDebit > 0 && Math.abs(bankDebit - journalCredit) < 0.01) ||
                           (bankCredit > 0 && Math.abs(bankCredit - journalDebit) < 0.01);
        const dateMatch = entryDate === btxn.transaction_date;

        if (amountMatch && dateMatch) {
          items.push({
            type: 'matched',
            date: btxn.transaction_date,
            description: btxn.description || jl.description || jl.journal_entry?.description || '',
            bankDebit: bankDebit || undefined,
            bankCredit: bankCredit || undefined,
            bookDebit: journalDebit || undefined,
            bookCredit: journalCredit || undefined,
            bankTxnId: btxn.id,
            bookLineId: jl.id,
          });
          usedJournalIds.add(jl.id);
          usedBankIds.add(btxn.id);
          matched = true;
          break;
        }
      }

      // Try amount-only match if no exact match
      if (!matched) {
        for (const jl of journalLines) {
          if (usedJournalIds.has(jl.id)) continue;
          const journalDebit = Number(jl.debit || 0);
          const journalCredit = Number(jl.credit || 0);
          const bankDebit = Number(btxn.debit || 0);
          const bankCredit = Number(btxn.credit || 0);

          const amountMatch = (bankDebit > 0 && Math.abs(bankDebit - journalCredit) < 0.01) ||
                             (bankCredit > 0 && Math.abs(bankCredit - journalDebit) < 0.01);

          if (amountMatch) {
            items.push({
              type: 'matched',
              date: btxn.transaction_date,
              description: btxn.description || jl.description || jl.journal_entry?.description || '',
              bankDebit: bankDebit || undefined,
              bankCredit: bankCredit || undefined,
              bookDebit: journalDebit || undefined,
              bookCredit: journalCredit || undefined,
              bankTxnId: btxn.id,
              bookLineId: jl.id,
            });
            usedJournalIds.add(jl.id);
            usedBankIds.add(btxn.id);
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        items.push({
          type: 'bank_only',
          date: btxn.transaction_date,
          description: btxn.description || '',
          bankDebit: Number(btxn.debit || 0) || undefined,
          bankCredit: Number(btxn.credit || 0) || undefined,
          bankTxnId: btxn.id,
        });
      }
    }

    // Journal lines not matched
    for (const jl of journalLines) {
      if (usedJournalIds.has(jl.id)) continue;
      items.push({
        type: 'book_only',
        date: jl.journal_entry?.entry_date || '',
        description: jl.description || jl.journal_entry?.description || '',
        bookDebit: Number(jl.debit || 0) || undefined,
        bookCredit: Number(jl.credit || 0) || undefined,
        bookLineId: jl.id,
      });
    }

    // Sort by date
    items.sort((a, b) => a.date.localeCompare(b.date));
    return items;
  }, [bankTransactions, journalLines]);

  const filtered = filter === 'all' ? reconciled : reconciled.filter(r => r.type === filter);
  const matchedCount = reconciled.filter(r => r.type === 'matched').length;
  const bankOnlyCount = reconciled.filter(r => r.type === 'bank_only').length;
  const bookOnlyCount = reconciled.filter(r => r.type === 'book_only').length;

  const bankOnlyDebitSum = reconciled.filter(r => r.type === 'bank_only').reduce((s, r) => s + (r.bankDebit || 0), 0);
  const bankOnlyCreditSum = reconciled.filter(r => r.type === 'bank_only').reduce((s, r) => s + (r.bankCredit || 0), 0);
  const bookOnlyDebitSum = reconciled.filter(r => r.type === 'book_only').reduce((s, r) => s + (r.bookDebit || 0), 0);
  const bookOnlyCreditSum = reconciled.filter(r => r.type === 'book_only').reduce((s, r) => s + (r.bookCredit || 0), 0);

  // Compute totals for reconciliation statement
  const journalTotalDebit = journalLines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const journalTotalCredit = journalLines.reduce((s, l) => s + Number(l.credit || 0), 0);

  // Get closing balance from the LAST transaction in the statement (balance field)
  const sortedByDate = [...bankTransactions].sort((a, b) => {
    const d = a.transaction_date.localeCompare(b.transaction_date);
    return d !== 0 ? d : (a.created_at || '').localeCompare(b.created_at || '');
  });
  const lastTxn = sortedByDate[sortedByDate.length - 1];
  const firstTxn = sortedByDate[0];
  
  // Statement closing = last transaction's balance
  const statementClosing = lastTxn ? Number(lastTxn.balance || 0) : 0;
  // Statement opening = first transaction's balance + first debit - first credit (reverse to get before)
  const statementOpening = firstTxn ? Number(firstTxn.balance || 0) + Number(firstTxn.debit || 0) - Number(firstTxn.credit || 0) : 0;
  
  // Books closing = opening + journal debits - journal credits (debit on bank account = money in)
  const openingBalance = Number(bankAccount?.opening_balance || 0);
  const booksClosing = openingBalance + journalTotalDebit - journalTotalCredit;
  const netDifference = statementClosing - booksClosing;

  const formatCurrency = (v: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', { minimumFractionDigits: 2 }).format(v);
  const isLoading = loadingTxns || loadingJournal;

  const ar = language === 'ar';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            {ar ? 'مطابقة كشف الحساب مع القيود المحاسبية' : 'Reconcile Statement with Journal Entries'}
            {statement?.bank_account?.account_name && <span className="text-muted-foreground text-base">- {statement.bank_account.account_name}</span>}
          </DialogTitle>
        </DialogHeader>

        {!accountCategoryId && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {ar ? 'يجب ربط الحساب البنكي بحساب في شجرة الحسابات أولاً لإجراء المطابقة' : 'Bank account must be linked to chart of accounts first'}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button onClick={() => setFilter(filter === 'matched' ? 'all' : 'matched')} className={`p-3 rounded-lg border text-right transition-all ${filter === 'matched' ? 'ring-2 ring-green-500' : ''} bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800`}>
                <div className="flex items-center justify-between">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-green-600">{ar ? 'مطابقة' : 'Matched'}</p>
                    <p className="text-2xl font-bold text-green-700">{matchedCount}</p>
                  </div>
                </div>
              </button>
              <button onClick={() => setFilter(filter === 'bank_only' ? 'all' : 'bank_only')} className={`p-3 rounded-lg border text-right transition-all ${filter === 'bank_only' ? 'ring-2 ring-orange-500' : ''} bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800`}>
                <div className="flex items-center justify-between">
                  <XCircle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-orange-600 font-medium">{ar ? 'في الكشف المستورد فقط' : 'In Imported Statement Only'}</p>
                    <p className="text-[10px] text-orange-500 mt-0.5">{ar ? 'موجود في كشف البنك ولم يُسجل قيد محاسبي له' : 'In bank statement but no journal entry recorded'}</p>
                    <p className="text-2xl font-bold text-orange-700">{bankOnlyCount}</p>
                  </div>
                </div>
              </button>
              <button onClick={() => setFilter(filter === 'book_only' ? 'all' : 'book_only')} className={`p-3 rounded-lg border text-right transition-all ${filter === 'book_only' ? 'ring-2 ring-blue-500' : ''} bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800`}>
                <div className="flex items-center justify-between">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">{ar ? 'في القيود المحاسبية فقط' : 'In Journal Entries Only'}</p>
                    <p className="text-[10px] text-blue-500 mt-0.5">{ar ? 'مسجل في البرنامج ولم يظهر في كشف البنك المستورد' : 'Recorded in system but not in bank statement'}</p>
                    <p className="text-2xl font-bold text-blue-700">{bookOnlyCount}</p>
                  </div>
                </div>
              </button>
              <div className="p-3 rounded-lg border bg-muted/50 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">{ar ? 'ملخص الفروقات' : 'Differences Summary'}</p>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                    <p className="font-medium text-orange-700 mb-1">{ar ? '🟠 في الكشف ولم يُسجل قيد:' : '🟠 In statement, no journal entry:'}</p>
                    <div className="flex justify-between">
                      <span className="text-orange-600">{ar ? 'مسحوبات (مدين):' : 'Withdrawals (debit):'}</span>
                      <span className="font-bold text-red-600">{formatCurrency(bankOnlyDebitSum)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600">{ar ? 'إيداعات (دائن):' : 'Deposits (credit):'}</span>
                      <span className="font-bold text-green-600">{formatCurrency(bankOnlyCreditSum)}</span>
                    </div>
                    <div className="flex justify-between border-t border-orange-200 dark:border-orange-700 mt-1 pt-1">
                      <span className="text-orange-700 font-medium">{ar ? 'الصافي:' : 'Net:'}</span>
                      <span className="font-bold text-orange-700">{formatCurrency(bankOnlyCreditSum - bankOnlyDebitSum)}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <p className="font-medium text-blue-700 mb-1">{ar ? '🔵 مسجل قيد ولم يظهر بالكشف:' : '🔵 Has journal entry, not in statement:'}</p>
                    <div className="flex justify-between">
                      <span className="text-blue-600">{ar ? 'مدين:' : 'Debit:'}</span>
                      <span className="font-bold text-red-600">{formatCurrency(bookOnlyDebitSum)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">{ar ? 'دائن:' : 'Credit:'}</span>
                      <span className="font-bold text-green-600">{formatCurrency(bookOnlyCreditSum)}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 dark:border-blue-700 mt-1 pt-1">
                      <span className="text-blue-700 font-medium">{ar ? 'الصافي:' : 'Net:'}</span>
                      <span className="font-bold text-blue-700">{formatCurrency(bookOnlyDebitSum - bookOnlyCreditSum)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{ar ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead className="text-right">{ar ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead className="text-right">{ar ? 'البيان' : 'Description'}</TableHead>
                  <TableHead className="text-right">{ar ? 'مدين (بنك)' : 'Bank Debit'}</TableHead>
                  <TableHead className="text-right">{ar ? 'دائن (بنك)' : 'Bank Credit'}</TableHead>
                  <TableHead className="text-right">{ar ? 'مدين (دفاتر)' : 'Book Debit'}</TableHead>
                  <TableHead className="text-right">{ar ? 'دائن (دفاتر)' : 'Book Credit'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item, idx) => (
                  <TableRow key={idx} className={
                    item.type === 'matched' ? 'bg-green-50/50 dark:bg-green-950/10' :
                    item.type === 'bank_only' ? 'bg-orange-50/50 dark:bg-orange-950/10' :
                    'bg-blue-50/50 dark:bg-blue-950/10'
                  }>
                    <TableCell>
                      {item.type === 'matched' && <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle className="w-3 h-3" />{ar ? 'مطابق' : 'Match'}</Badge>}
                      {item.type === 'bank_only' && <Badge className="bg-orange-100 text-orange-800 gap-1"><XCircle className="w-3 h-3" />{ar ? 'في الكشف فقط' : 'Statement Only'}</Badge>}
                      {item.type === 'book_only' && <Badge className="bg-blue-100 text-blue-800 gap-1"><AlertTriangle className="w-3 h-3" />{ar ? 'في القيود فقط' : 'Journal Only'}</Badge>}
                    </TableCell>
                    <TableCell className="text-sm">{item.date}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate" title={item.description}>{item.description || '-'}</TableCell>
                    <TableCell className="text-red-600 text-sm">{item.bankDebit ? formatCurrency(item.bankDebit) : '-'}</TableCell>
                    <TableCell className="text-green-600 text-sm">{item.bankCredit ? formatCurrency(item.bankCredit) : '-'}</TableCell>
                    <TableCell className="text-red-600 text-sm">{item.bookDebit ? formatCurrency(item.bookDebit) : '-'}</TableCell>
                    <TableCell className="text-green-600 text-sm">{item.bookCredit ? formatCurrency(item.bookCredit) : '-'}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{ar ? 'لا توجد بيانات' : 'No data'}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>

            {/* Reconciliation Statement */}
            <div className="border-2 border-primary/30 rounded-lg p-4 bg-primary/5">
              <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4" />
                {ar ? '📊 كشف التسوية البنكية - تفصيل الفرق' : '📊 Bank Reconciliation Statement'}
              </h3>
              <div className="space-y-2 text-sm">
                {/* Statement balances */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-2 rounded bg-muted/50 border">
                    <p className="text-[10px] text-muted-foreground">{ar ? 'رصيد الإغلاق حسب الكشف المستورد' : 'Closing Balance per Statement'}</p>
                    <p className="text-lg font-bold">{formatCurrency(statementClosing)}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50 border">
                    <p className="text-[10px] text-muted-foreground">{ar ? 'رصيد الإغلاق حسب الدفاتر المحاسبية' : 'Closing Balance per Books'}</p>
                    <p className="text-lg font-bold">{formatCurrency(booksClosing)}</p>
                  </div>
                </div>
                <div className="flex justify-between py-1 px-2 rounded bg-destructive/10 border border-destructive/20">
                  <span className="font-bold">{ar ? '⚠️ الفرق (كشف البنك - الدفاتر):' : '⚠️ Difference (Statement - Books):'}</span>
                  <span className={`font-bold text-lg ${netDifference === 0 ? 'text-green-600' : 'text-destructive'}`}>{formatCurrency(Math.abs(netDifference))}</span>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">{ar ? `رصيد افتتاحي: ${formatCurrency(openingBalance)} | رصيد افتتاحي الكشف: ${formatCurrency(statementOpening)}` : `Opening: ${formatCurrency(openingBalance)} | Statement Opening: ${formatCurrency(statementOpening)}`}</p>
                
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs font-bold mb-2">{ar ? '📋 تفصيل الفرق:' : '📋 Difference Breakdown:'}</p>
                </div>

                {/* Bank Only items - deposits not recorded */}
                {bankOnlyCreditSum > 0 && (
                  <div className="mr-4 pr-2 border-r-2 border-orange-300">
                    <div className="flex justify-between text-orange-700">
                      <span>{ar ? '(+) إيداعات في الكشف لم تُسجل قيود لها:' : '(+) Deposits in statement, no journal entry:'}</span>
                      <span className="font-bold">+{formatCurrency(bankOnlyCreditSum)}</span>
                    </div>
                    <div className="text-[10px] text-orange-500 mt-0.5 space-y-0.5">
                      {reconciled.filter(r => r.type === 'bank_only' && r.bankCredit).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate max-w-[300px]">{item.date} - {item.description || '-'}</span>
                          <span>{formatCurrency(item.bankCredit!)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bank Only items - withdrawals not recorded */}
                {bankOnlyDebitSum > 0 && (
                  <div className="mr-4 pr-2 border-r-2 border-orange-300">
                    <div className="flex justify-between text-orange-700">
                      <span>{ar ? '(-) مسحوبات في الكشف لم تُسجل قيود لها:' : '(-) Withdrawals in statement, no journal entry:'}</span>
                      <span className="font-bold">-{formatCurrency(bankOnlyDebitSum)}</span>
                    </div>
                    <div className="text-[10px] text-orange-500 mt-0.5 space-y-0.5">
                      {reconciled.filter(r => r.type === 'bank_only' && r.bankDebit).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate max-w-[300px]">{item.date} - {item.description || '-'}</span>
                          <span>{formatCurrency(item.bankDebit!)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Book Only items - debits not in statement */}
                {bookOnlyDebitSum > 0 && (
                  <div className="mr-4 pr-2 border-r-2 border-blue-300">
                    <div className="flex justify-between text-blue-700">
                      <span>{ar ? '(-) قيود مدينة مسجلة ولم تظهر بالكشف:' : '(-) Journal debits not in statement:'}</span>
                      <span className="font-bold">-{formatCurrency(bookOnlyDebitSum)}</span>
                    </div>
                    <div className="text-[10px] text-blue-500 mt-0.5 space-y-0.5">
                      {reconciled.filter(r => r.type === 'book_only' && r.bookDebit).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate max-w-[300px]">{item.date} - {item.description || '-'}</span>
                          <span>{formatCurrency(item.bookDebit!)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Book Only items - credits not in statement */}
                {bookOnlyCreditSum > 0 && (
                  <div className="mr-4 pr-2 border-r-2 border-blue-300">
                    <div className="flex justify-between text-blue-700">
                      <span>{ar ? '(+) قيود دائنة مسجلة ولم تظهر بالكشف:' : '(+) Journal credits not in statement:'}</span>
                      <span className="font-bold">+{formatCurrency(bookOnlyCreditSum)}</span>
                    </div>
                    <div className="text-[10px] text-blue-500 mt-0.5 space-y-0.5">
                      {reconciled.filter(r => r.type === 'book_only' && r.bookCredit).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate max-w-[300px]">{item.date} - {item.description || '-'}</span>
                          <span>{formatCurrency(item.bookCredit!)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {netDifference === 0 && (
                  <p className="text-center text-green-600 text-xs font-bold mt-2">✅ {ar ? 'الرصيد متطابق تماماً - لا يوجد فرق' : 'Perfectly Balanced - No difference'}</p>
                )}
              </div>
            </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              {ar ? `إجمالي: ${reconciled.length} عملية | ${matchedCount} مطابقة | ${bankOnlyCount} في الكشف فقط | ${bookOnlyCount} في القيود فقط` :
                `Total: ${reconciled.length} items | ${matchedCount} matched | ${bankOnlyCount} statement only | ${bookOnlyCount} journal only`}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
