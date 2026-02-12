import { useState, useRef } from 'react';
import { Building2, FileSpreadsheet, Scale, Plus, Upload, Eye, Loader2, CheckCircle, XCircle, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useBankAccounts, useBankStatements, useBankTransactions, useBankReconciliations, useAddBankAccount, useImportBankStatement, useMatchTransaction, useCreateBankReconciliation } from '@/hooks/useBanking';
import { useAccounts } from '@/hooks/useAccounting';
import { useCompany } from '@/contexts/CompanyContext';
import { parseBankStatementCSV } from '@/services/banking';
import { useLanguage } from '@/contexts/LanguageContext';

export function BankingPage() {
  const { t, language } = useLanguage();
  const { company } = useCompany();
  const { data: bankAccounts = [], isLoading: loadingAccounts } = useBankAccounts();
  const { data: statements = [] } = useBankStatements();
  const { data: reconciliations = [] } = useBankReconciliations();
  const { data: accounts = [] } = useAccounts();
  
  const addBankAccount = useAddBankAccount();
  const importStatement = useImportBankStatement();
  const createReconciliation = useCreateBankReconciliation();
  
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showReconciliationDialog, setShowReconciliationDialog] = useState(false);
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importData, setImportData] = useState<{ transactions: any[]; fileName: string } | null>(null);
  
  const [accountForm, setAccountForm] = useState({ account_name: '', bank_name: '', account_number_encrypted: '', iban_encrypted: '', account_category_id: '', opening_balance: 0, notes: '' });
  const [importForm, setImportForm] = useState({ bank_account_id: '', statement_date: new Date().toISOString().split('T')[0] });
  const [reconciliationForm, setReconciliationForm] = useState({ bank_account_id: '', reconciliation_date: new Date().toISOString().split('T')[0], statement_ending_balance: 0, book_balance: 0 });
  
  const currency = language === 'ar' ? 'ريال' : 'SAR';
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';
  const formatCurrency = (value: number) => new Intl.NumberFormat(locale).format(value);
  
  const handleAddAccount = async () => {
    if (!accountForm.account_name || !accountForm.bank_name || !company?.id) { toast.error(t.voucher_fill_required); return; }
    try { await addBankAccount.mutateAsync({ ...accountForm, company_id: company.id, current_balance: accountForm.opening_balance, is_active: true }); toast.success(language === 'ar' ? 'تمت إضافة الحساب البنكي بنجاح' : 'Bank account added'); setShowAccountDialog(false); setAccountForm({ account_name: '', bank_name: '', account_number_encrypted: '', iban_encrypted: '', account_category_id: '', opening_balance: 0, notes: '' }); }
    catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء الإضافة' : 'Error adding'); }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { try { const content = e.target?.result as string; const transactions = parseBankStatementCSV(content); if (transactions.length === 0) { toast.error(language === 'ar' ? 'لم يتم العثور على معاملات في الملف' : 'No transactions found'); return; } setImportData({ transactions, fileName: file.name }); toast.success(`${language === 'ar' ? 'تم قراءة' : 'Read'} ${transactions.length} ${language === 'ar' ? 'معاملة' : 'transactions'}`); } catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء قراءة الملف' : 'Error reading file'); } };
    reader.readAsText(file);
  };
  
  const handleImportStatement = async () => {
    if (!importForm.bank_account_id || !importData || !company?.id) { toast.error(t.voucher_fill_required); return; }
    try { await importStatement.mutateAsync({ bankAccountId: importForm.bank_account_id, companyId: company.id, statementDate: importForm.statement_date, transactions: importData.transactions, fileName: importData.fileName }); toast.success(language === 'ar' ? 'تم استيراد كشف الحساب بنجاح' : 'Statement imported'); setShowImportDialog(false); setImportData(null); }
    catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء الاستيراد' : 'Error importing'); }
  };
  
  const handleCreateReconciliation = async () => {
    if (!reconciliationForm.bank_account_id || !company?.id) { toast.error(t.voucher_fill_required); return; }
    try { await createReconciliation.mutateAsync({ bankAccountId: reconciliationForm.bank_account_id, companyId: company.id, reconciliationDate: reconciliationForm.reconciliation_date, statementEndingBalance: reconciliationForm.statement_ending_balance, bookBalance: reconciliationForm.book_balance }); toast.success(language === 'ar' ? 'تم إنشاء التسوية بنجاح' : 'Reconciliation created'); setShowReconciliationDialog(false); }
    catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء الإنشاء' : 'Error creating'); }
  };
  
  const bankCategoryAccounts = accounts.filter(a => a.code.startsWith('110') || a.code.startsWith('11'));
  const totalBalance = bankAccounts.reduce((sum, a) => sum + Number(a.current_balance), 0);
  const activeAccounts = bankAccounts.filter(a => a.is_active).length;
  const pendingStatements = statements.filter(s => s.status === 'pending' || s.unmatched_transactions > 0).length;
  
  if (loadingAccounts) return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl md:text-3xl font-bold text-foreground">{t.bank_title}</h1><p className="text-sm text-muted-foreground mt-1">{t.bank_subtitle}</p></div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAccountDialog(true)} variant="outline"><Building2 className="w-4 h-4 ml-2" />{t.bank_new_account}</Button>
          <Button onClick={() => setShowImportDialog(true)} variant="outline"><Upload className="w-4 h-4 ml-2" />{t.bank_import_statement}</Button>
          <Button onClick={() => setShowReconciliationDialog(true)} className="gradient-primary"><Scale className="w-4 h-4 ml-2" />{t.bank_new_reconciliation}</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Building2 className="w-5 h-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">{t.bank_accounts_count}</p><p className="text-xl font-bold">{activeAccounts}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-500/10 rounded-lg"><Scale className="w-5 h-5 text-green-500" /></div><div><p className="text-sm text-muted-foreground">{t.bank_total_balance}</p><p className="text-xl font-bold">{formatCurrency(totalBalance)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-500/10 rounded-lg"><FileSpreadsheet className="w-5 h-5 text-blue-500" /></div><div><p className="text-sm text-muted-foreground">{t.bank_imported_statements}</p><p className="text-xl font-bold">{statements.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-orange-500/10 rounded-lg"><Link2 className="w-5 h-5 text-orange-500" /></div><div><p className="text-sm text-muted-foreground">{t.bank_needs_matching}</p><p className="text-xl font-bold text-orange-600">{pendingStatements}</p></div></div></CardContent></Card>
      </div>
      
      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">{t.bank_accounts_tab}</TabsTrigger>
          <TabsTrigger value="statements">{t.bank_statements_tab}</TabsTrigger>
          <TabsTrigger value="reconciliations">{t.bank_reconciliations_tab}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts" className="mt-4">
          <Card><CardContent className="p-0"><Table>
            <TableHeader><TableRow>
              <TableHead className="text-right">{t.bank_account_name}</TableHead>
              <TableHead className="text-right">{t.bank_name_label}</TableHead>
              <TableHead className="text-right">{t.bank_account_number}</TableHead>
              <TableHead className="text-right">IBAN</TableHead>
              <TableHead className="text-right">{t.bank_current_balance}</TableHead>
              <TableHead className="text-right">{t.status}</TableHead>
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
                </TableRow>
              ))}
              {bankAccounts.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t.bank_no_accounts}</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>
        
        <TabsContent value="statements" className="mt-4">
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
                  <TableCell><Button variant="ghost" size="sm" onClick={() => { setSelectedStatement(statement); setShowTransactionsDialog(true); }}><Eye className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}
              {statements.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t.bank_no_statements}</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>
        
        <TabsContent value="reconciliations" className="mt-4">
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
        </TabsContent>
      </Tabs>
      
      {/* Add Account Dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{language === 'ar' ? 'إضافة حساب بنكي' : 'Add Bank Account'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t.bank_account_name} *</Label><Input value={accountForm.account_name} onChange={e => setAccountForm({ ...accountForm, account_name: e.target.value })} /></div>
            <div><Label>{t.bank_name_label} *</Label><Input value={accountForm.bank_name} onChange={e => setAccountForm({ ...accountForm, bank_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t.bank_account_number}</Label><Input value={accountForm.account_number_encrypted} onChange={e => setAccountForm({ ...accountForm, account_number_encrypted: e.target.value })} dir="ltr" /></div>
              <div><Label>IBAN</Label><Input value={accountForm.iban_encrypted} onChange={e => setAccountForm({ ...accountForm, iban_encrypted: e.target.value })} dir="ltr" placeholder="SA..." /></div>
            </div>
            <div><Label>{language === 'ar' ? 'ربط مع حساب في دليل الحسابات' : 'Link to Chart of Accounts'}</Label><Select value={accountForm.account_category_id} onValueChange={v => setAccountForm({ ...accountForm, account_category_id: v })}><SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر الحساب المحاسبي' : 'Select account'} /></SelectTrigger><SelectContent>{bankCategoryAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>{language === 'ar' ? 'الرصيد الافتتاحي' : 'Opening Balance'}</Label><Input type="number" value={accountForm.opening_balance} onChange={e => setAccountForm({ ...accountForm, opening_balance: Number(e.target.value) })} /></div>
            <div><Label>{t.notes}</Label><Textarea value={accountForm.notes} onChange={e => setAccountForm({ ...accountForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccountDialog(false)}>{t.cancel}</Button>
            <Button onClick={handleAddAccount} disabled={addBankAccount.isPending}>{addBankAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Statement Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{language === 'ar' ? 'استيراد كشف حساب بنكي' : 'Import Bank Statement'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{language === 'ar' ? 'الحساب البنكي *' : 'Bank Account *'}</Label><Select value={importForm.bank_account_id} onValueChange={v => setImportForm({ ...importForm, bank_account_id: v })}><SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر الحساب البنكي' : 'Select account'} /></SelectTrigger><SelectContent>{bankAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.account_name} - {a.bank_name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>{t.bank_statement_date}</Label><Input type="date" value={importForm.statement_date} onChange={e => setImportForm({ ...importForm, statement_date: e.target.value })} /></div>
            <div>
              <Label>{language === 'ar' ? 'ملف الكشف (CSV)' : 'Statement File (CSV)'}</Label>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                {importData ? <div><p className="font-medium text-green-600">{importData.fileName}</p><p className="text-sm text-muted-foreground">{importData.transactions.length} {language === 'ar' ? 'معاملة' : 'transactions'}</p></div> : <div><p className="font-medium">{language === 'ar' ? 'اضغط لاختيار ملف CSV' : 'Click to select CSV file'}</p></div>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>{t.cancel}</Button>
            <Button onClick={handleImportStatement} disabled={importStatement.isPending || !importData}>{importStatement.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.import}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reconciliation Dialog */}
      <Dialog open={showReconciliationDialog} onOpenChange={setShowReconciliationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{language === 'ar' ? 'تسوية بنكية جديدة' : 'New Bank Reconciliation'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{language === 'ar' ? 'الحساب البنكي *' : 'Bank Account *'}</Label><Select value={reconciliationForm.bank_account_id} onValueChange={v => setReconciliationForm({ ...reconciliationForm, bank_account_id: v })}><SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر الحساب البنكي' : 'Select account'} /></SelectTrigger><SelectContent>{bankAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.account_name} - {a.bank_name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>{t.bank_reconciliation_date}</Label><Input type="date" value={reconciliationForm.reconciliation_date} onChange={e => setReconciliationForm({ ...reconciliationForm, reconciliation_date: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t.bank_statement_balance}</Label><Input type="number" value={reconciliationForm.statement_ending_balance} onChange={e => setReconciliationForm({ ...reconciliationForm, statement_ending_balance: Number(e.target.value) })} /></div>
              <div><Label>{t.bank_book_balance}</Label><Input type="number" value={reconciliationForm.book_balance} onChange={e => setReconciliationForm({ ...reconciliationForm, book_balance: Number(e.target.value) })} /></div>
            </div>
            {(reconciliationForm.statement_ending_balance !== 0 || reconciliationForm.book_balance !== 0) && (
              <Card className={Math.abs(reconciliationForm.statement_ending_balance - reconciliationForm.book_balance) > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">{t.bank_difference}</p>
                  <p className={`text-2xl font-bold ${Math.abs(reconciliationForm.statement_ending_balance - reconciliationForm.book_balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(reconciliationForm.statement_ending_balance - reconciliationForm.book_balance)} {currency}</p>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReconciliationDialog(false)}>{t.cancel}</Button>
            <Button onClick={handleCreateReconciliation} disabled={createReconciliation.isPending}>{createReconciliation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : language === 'ar' ? 'إنشاء التسوية' : 'Create Reconciliation'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Transactions Dialog */}
      <TransactionsDialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog} statement={selectedStatement} />
    </div>
  );
}

function TransactionsDialog({ open, onOpenChange, statement }: { open: boolean; onOpenChange: (open: boolean) => void; statement: any }) {
  const { t, language } = useLanguage();
  const { data: transactions = [], isLoading } = useBankTransactions(statement?.id || '');
  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA').format(value);
  
  if (!statement) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{language === 'ar' ? 'معاملات كشف الحساب' : 'Statement Transactions'} - {statement.bank_account?.account_name}</DialogTitle></DialogHeader>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div> : (
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
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
