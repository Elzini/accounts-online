import { useState, useMemo } from 'react';
import { Brain, Loader2, CheckCircle, Search, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useBankTransactions, useBankAccounts } from '@/hooks/useBanking';
import { useAccounts } from '@/hooks/useAccounting';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { classifyTransactions, createJournalEntriesFromTransactions, ClassifiedTransaction } from '@/services/bankJournalEntries';

function AccountSearchSelect({ accounts, value, onChange, language }: { accounts: any[]; value: string; onChange: (id: string) => void; language: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter((a: any) => a.code.includes(q) || a.name.toLowerCase().includes(q));
  }, [accounts, search]);
  const selected = accounts.find((a: any) => a.id === value);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center justify-between h-8 w-[220px] rounded-md border border-input bg-background px-2 text-xs hover:bg-accent">
        <span className="truncate">{selected ? `${selected.code} - ${selected.name}` : (language === 'ar' ? 'اختر حساب' : 'Select')}</span>
        <ChevronsUpDown className="w-3 h-3 opacity-50 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-[280px] rounded-md border bg-popover shadow-lg" style={{ [language === 'ar' ? 'right' : 'left']: 0 }}>
          <div className="flex items-center gap-1 border-b px-2 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder={language === 'ar' ? 'بحث بالكود أو الاسم...' : 'Search...'} className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-3">{language === 'ar' ? 'لا توجد نتائج' : 'No results'}</p>}
            {filtered.map((a: any) => (
              <button key={a.id} type="button" onClick={() => { onChange(a.id); setOpen(false); setSearch(''); }} className={`w-full text-right flex items-center gap-1.5 rounded px-2 py-1.5 text-xs hover:bg-accent cursor-pointer ${value === a.id ? 'bg-accent' : ''}`}>
                {value === a.id && <Check className="w-3 h-3 text-primary shrink-0" />}
                <span className="truncate">{a.code} - {a.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(''); }} />}
    </div>
  );
}

export function TransactionsDialog({ open, onOpenChange, statement }: { open: boolean; onOpenChange: (open: boolean) => void; statement: any }) {
  const { t, language } = useLanguage();
  const { company } = useCompany();
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [], isLoading, refetch } = useBankTransactions(statement?.id || '');
  const { data: bankAccounts = [] } = useBankAccounts();
  const { selectedFiscalYear } = useFiscalYear();
  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA').format(value);

  const [classifying, setClassifying] = useState(false);
  const [creatingEntries, setCreatingEntries] = useState(false);
  const [classified, setClassified] = useState<ClassifiedTransaction[]>([]);
  const [showClassification, setShowClassification] = useState(false);
  const [entryErrors, setEntryErrors] = useState<string[]>([]);

  if (!statement) return null;

  const unmatchedTransactions = transactions.filter(txn => !txn.is_matched);
  const bankAccount = bankAccounts.find(ba => ba.id === statement.bank_account_id);
  const bankAccountCategoryId = bankAccount?.account_category_id;

  const handleClassify = async () => {
    if (!company?.id || unmatchedTransactions.length === 0) return;
    setClassifying(true);
    try {
      const classifications = await classifyTransactions(unmatchedTransactions, company.id);
      const classifiedTxns: ClassifiedTransaction[] = unmatchedTransactions.map((txn, idx) => {
        const cls = classifications.find(c => c.index === idx);
        let resolvedAccountId = cls?.account_id;
        let resolvedAccountCode = cls?.account_code;
        let resolvedAccountName = cls?.account_name;
        if (cls) {
          const byId = accounts.find(a => a.id === cls.account_id);
          if (byId) { resolvedAccountId = byId.id; resolvedAccountCode = byId.code; resolvedAccountName = byId.name; }
          else {
            const byCode = accounts.find(a => a.code === cls.account_code);
            if (byCode) { resolvedAccountId = byCode.id; resolvedAccountCode = byCode.code; resolvedAccountName = byCode.name; }
            else {
              const byName = accounts.find(a => a.name.includes(cls.account_name || '') || (cls.account_name || '').includes(a.name));
              if (byName) { resolvedAccountId = byName.id; resolvedAccountCode = byName.code; resolvedAccountName = byName.name; }
              else { resolvedAccountId = undefined; }
            }
          }
        }
        return { ...txn, debit: Number(txn.debit), credit: Number(txn.credit), balance: txn.balance ? Number(txn.balance) : null, classified_account_id: resolvedAccountId, classified_account_code: resolvedAccountCode, classified_account_name: resolvedAccountName, confidence: cls?.confidence, reason: cls?.reason };
      });
      setClassified(classifiedTxns);
      setShowClassification(true);
      toast.success(language === 'ar' ? `تم تصنيف ${classifications.length} معاملة بالذكاء الاصطناعي` : `${classifications.length} transactions classified`);
    } catch (e: any) { toast.error(e?.message || (language === 'ar' ? 'خطأ في التصنيف' : 'Classification error')); }
    setClassifying(false);
  };

  const handleCreateEntries = async () => {
    if (!company?.id || !bankAccountCategoryId || classified.length === 0) {
      if (!bankAccountCategoryId) toast.error(language === 'ar' ? 'يجب ربط الحساب البنكي بحساب في شجرة الحسابات أولاً' : 'Bank account must be linked to chart of accounts first');
      return;
    }
    setCreatingEntries(true);
    setEntryErrors([]);
    try {
      const result = await createJournalEntriesFromTransactions(classified.filter(t => t.classified_account_id), bankAccountCategoryId, company.id, statement.id, selectedFiscalYear?.id || null);
      if (result.created > 0) { toast.success(language === 'ar' ? `تم إنشاء ${result.created} قيد محاسبي بنجاح` : `${result.created} journal entries created`); refetch(); }
      if (result.errors.length > 0) { setEntryErrors(result.errors); toast.error(language === 'ar' ? `${result.errors.length} أخطاء أثناء الإنشاء` : `${result.errors.length} errors`); }
      else { setShowClassification(false); setClassified([]); }
    } catch (e: any) { toast.error(e?.message || (language === 'ar' ? 'خطأ في إنشاء القيود' : 'Error creating entries')); }
    setCreatingEntries(false);
  };

  const updateClassifiedAccount = (index: number, accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    setClassified(prev => prev.map((t, i) => i === index ? { ...t, classified_account_id: account.id, classified_account_code: account.code, classified_account_name: account.name, confidence: 'high' as const, reason: 'تعديل يدوي' } : t));
  };

  const confidenceBadge = (c?: string) => {
    if (c === 'high') return <Badge className="bg-green-100 text-green-800 text-xs">{language === 'ar' ? 'عالية' : 'High'}</Badge>;
    if (c === 'medium') return <Badge className="bg-yellow-100 text-yellow-800 text-xs">{language === 'ar' ? 'متوسطة' : 'Medium'}</Badge>;
    return <Badge className="bg-red-100 text-red-800 text-xs">{language === 'ar' ? 'منخفضة' : 'Low'}</Badge>;
  };

  const openingBalance = Number(bankAccount?.opening_balance || 0);
  const totalDebit = transactions.reduce((s, txn) => s + Number(txn.debit || 0), 0);
  const totalCredit = transactions.reduce((s, txn) => s + Number(txn.credit || 0), 0);
  const closingBalance = openingBalance + totalCredit - totalDebit;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setShowClassification(false); setClassified([]); setEntryErrors([]); } onOpenChange(v); }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{language === 'ar' ? 'معاملات كشف الحساب' : 'Statement Transactions'} - {statement.bank_account?.account_name}</DialogTitle></DialogHeader>

        {!showClassification && unmatchedTransactions.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-sm flex-1">{language === 'ar' ? `${unmatchedTransactions.length} معاملة غير مصنفة` : `${unmatchedTransactions.length} unmatched transactions`}</span>
            <Button onClick={handleClassify} disabled={classifying} size="sm" className="bg-purple-600 hover:bg-purple-700">
              {classifying ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Brain className="w-4 h-4 ml-2" />}
              {language === 'ar' ? 'تصنيف بالذكاء الاصطناعي' : 'AI Classify'}
            </Button>
          </div>
        )}

        {showClassification && classified.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-purple-600" /><span className="font-medium text-purple-900">{language === 'ar' ? 'مراجعة التصنيف' : 'Review classification'}</span></div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowClassification(false); setClassified([]); }}>{t.cancel}</Button>
                <Button size="sm" onClick={handleCreateEntries} disabled={creatingEntries || !bankAccountCategoryId} className="bg-green-600 hover:bg-green-700">
                  {creatingEntries ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                  {language === 'ar' ? `إنشاء ${classified.filter(t => t.classified_account_id).length} قيد` : `Create ${classified.filter(t => t.classified_account_id).length} entries`}
                </Button>
              </div>
            </div>
            {!bankAccountCategoryId && <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-sm">⚠️ {language === 'ar' ? 'يجب ربط الحساب البنكي بحساب في شجرة الحسابات أولاً' : 'Link bank account to chart of accounts first'}</div>}
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-right">{t.date}</TableHead>
                <TableHead className="text-right">{t.description}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'مدين' : 'Debit'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'دائن' : 'Credit'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'الحساب المقابل' : 'Counter Account'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'الثقة' : 'Confidence'}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {classified.map((txn, idx) => (
                  <TableRow key={txn.id} className={txn.confidence === 'low' ? 'bg-red-50/50' : txn.confidence === 'high' ? 'bg-green-50/50' : ''}>
                    <TableCell className="text-sm">{txn.transaction_date}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm" title={txn.description || ''}>{txn.description || '-'}{txn.reason && <p className="text-xs text-muted-foreground mt-0.5">{txn.reason}</p>}</TableCell>
                    <TableCell className="text-red-600 text-sm">{txn.debit > 0 ? formatCurrency(txn.debit) : '-'}</TableCell>
                    <TableCell className="text-green-600 text-sm">{txn.credit > 0 ? formatCurrency(txn.credit) : '-'}</TableCell>
                    <TableCell><AccountSearchSelect accounts={accounts} value={txn.classified_account_id || ''} onChange={(v) => updateClassifiedAccount(idx, v)} language={language} /></TableCell>
                    <TableCell>{confidenceBadge(txn.confidence)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {entryErrors.length > 0 && (
          <div className="space-y-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg max-h-[200px] overflow-y-auto">
            <div className="flex items-center justify-between"><span className="font-medium text-destructive text-sm">{language === 'ar' ? `${entryErrors.length} خطأ:` : `${entryErrors.length} errors:`}</span><Button variant="ghost" size="sm" onClick={() => setEntryErrors([])} className="h-6 px-2 text-xs">✕</Button></div>
            {entryErrors.map((err, i) => <p key={i} className="text-xs text-destructive/80 border-b border-destructive/10 pb-1">{i + 1}. {err}</p>)}
          </div>
        )}

        {!showClassification && (
          isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div> : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"><p className="text-xs text-blue-600">{language === 'ar' ? 'الرصيد الافتتاحي' : 'Opening Balance'}</p><p className="text-lg font-bold text-blue-700">{formatCurrency(openingBalance)}</p></div>
                <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"><p className="text-xs text-red-600">{language === 'ar' ? 'إجمالي المدين' : 'Total Debit'}</p><p className="text-lg font-bold text-red-700">{formatCurrency(totalDebit)}</p></div>
                <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"><p className="text-xs text-green-600">{language === 'ar' ? 'إجمالي الدائن' : 'Total Credit'}</p><p className="text-lg font-bold text-green-700">{formatCurrency(totalCredit)}</p></div>
                <div className={`p-3 rounded-lg border ${closingBalance >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'}`}><p className={`text-xs ${closingBalance >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>{language === 'ar' ? 'رصيد الإقفال' : 'Closing Balance'}</p><p className={`text-lg font-bold ${closingBalance >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>{formatCurrency(closingBalance)}</p></div>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-right">{t.date}</TableHead>
                  <TableHead className="text-right">{t.description}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'المرجع' : 'Reference'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'مدين' : 'Debit'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'دائن' : 'Credit'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'الرصيد' : 'Balance'}</TableHead>
                  <TableHead className="text-right">{t.status}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {transactions.map(txn => (
                    <TableRow key={txn.id} className={txn.is_matched ? 'bg-green-50' : ''}>
                      <TableCell>{txn.transaction_date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{txn.description || '-'}</TableCell>
                      <TableCell>{txn.reference || '-'}</TableCell>
                      <TableCell className="text-red-600">{Number(txn.debit) > 0 ? formatCurrency(Number(txn.debit)) : '-'}</TableCell>
                      <TableCell className="text-green-600">{Number(txn.credit) > 0 ? formatCurrency(Number(txn.credit)) : '-'}</TableCell>
                      <TableCell>{txn.balance ? formatCurrency(Number(txn.balance)) : '-'}</TableCell>
                      <TableCell>{txn.is_matched ? <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 ml-1" />{t.bank_matched}</Badge> : <Badge className="bg-orange-100 text-orange-800">{t.bank_unmatched}</Badge>}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold border-t-2">
                    <TableCell colSpan={3} className="text-right">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(totalDebit)}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(totalCredit)}</TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                  <TableRow className={`font-bold ${closingBalance >= 0 ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                    <TableCell colSpan={3} className="text-right">{language === 'ar' ? 'رصيد الإقفال' : 'Closing Balance'}</TableCell>
                    <TableCell colSpan={3} className={`text-center text-lg ${closingBalance >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>{formatCurrency(closingBalance)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
