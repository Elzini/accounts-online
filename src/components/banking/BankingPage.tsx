import { useState, useRef, useMemo } from 'react';
import { Building2, FileSpreadsheet, Scale, Plus, Upload, Eye, Loader2, CheckCircle, XCircle, Link2, Edit, Trash2, Brain, FileText, Table2, Search, ChevronsUpDown, Check } from 'lucide-react';
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
import { useBankAccounts, useBankStatements, useBankTransactions, useBankReconciliations, useAddBankAccount, useUpdateBankAccount, useDeleteBankAccount, useImportBankStatement, useUpdateBankStatement, useDeleteBankStatement, useMatchTransaction, useCreateBankReconciliation } from '@/hooks/useBanking';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAccounts } from '@/hooks/useAccounting';
import { useCompany } from '@/contexts/CompanyContext';
import { parseBankStatementFile } from '@/services/bankStatementParser';
import { useLanguage } from '@/contexts/LanguageContext';
import { classifyTransactions, createJournalEntriesFromTransactions, ClassifiedTransaction } from '@/services/bankJournalEntries';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';

export function BankingPage() {
  const { t, language } = useLanguage();
  const { company } = useCompany();
  const { data: bankAccounts = [], isLoading: loadingAccounts } = useBankAccounts();
  const { data: allStatements = [] } = useBankStatements();
  const { data: allReconciliations = [] } = useBankReconciliations();
  const { data: accounts = [] } = useAccounts();
  const { filterByFiscalYear } = useFiscalYearFilter();
  
  // Apply fiscal year filtering to statements and reconciliations
  const statements = useMemo(() => filterByFiscalYear(allStatements, 'statement_date'), [allStatements, filterByFiscalYear]);
  const reconciliations = useMemo(() => filterByFiscalYear(allReconciliations, 'reconciliation_date'), [allReconciliations, filterByFiscalYear]);
  
  const addBankAccount = useAddBankAccount();
  const updateBankAccount = useUpdateBankAccount();
  const deleteBankAccount = useDeleteBankAccount();
  const importStatement = useImportBankStatement();
  const updateStatement = useUpdateBankStatement();
  const deleteStatement = useDeleteBankStatement();
  const createReconciliation = useCreateBankReconciliation();
  
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showReconciliationDialog, setShowReconciliationDialog] = useState(false);
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState<any>(null);
  const [showEditStatementDialog, setShowEditStatementDialog] = useState(false);
  const [editingStatement, setEditingStatement] = useState<any>(null);
  const [editStatementForm, setEditStatementForm] = useState({ statement_date: '', notes: '', file_name: '' });
  const [deleteStatementId, setDeleteStatementId] = useState<string | null>(null);
  const [showEditAccountDialog, setShowEditAccountDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editAccountForm, setEditAccountForm] = useState({ account_name: '', bank_name: '', account_number_encrypted: '', iban_encrypted: '', account_category_id: '', opening_balance: 0, notes: '' });
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importData, setImportData] = useState<{ transactions: any[]; fileName: string; method?: string } | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  
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
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setParsingFile(true);
    try {
      const result = await parseBankStatementFile(file);
      if (result.transactions.length === 0) {
        toast.error(language === 'ar' ? 'لم يتم العثور على معاملات في الملف' : 'No transactions found');
        setParsingFile(false);
        return;
      }
      setImportData({ transactions: result.transactions, fileName: file.name, method: result.method });
      const methodLabel = result.method === 'ai' ? (language === 'ar' ? ' (بالذكاء الاصطناعي)' : ' (via AI)') : result.method === 'excel' ? ' (Excel)' : ' (CSV)';
      toast.success(`${language === 'ar' ? 'تم قراءة' : 'Read'} ${result.transactions.length} ${language === 'ar' ? 'معاملة' : 'transactions'}${methodLabel}`);
    } catch (e: any) {
      toast.error(e?.message || (language === 'ar' ? 'حدث خطأ أثناء قراءة الملف' : 'Error reading file'));
    }
    setParsingFile(false);
  };
  
  const handleImportStatement = async () => {
    if (!importForm.bank_account_id || !importData || !company?.id) { toast.error(t.voucher_fill_required); return; }
    try { await importStatement.mutateAsync({ bankAccountId: importForm.bank_account_id, companyId: company.id, statementDate: importForm.statement_date, transactions: importData.transactions, fileName: importData.fileName }); toast.success(language === 'ar' ? 'تم استيراد كشف الحساب بنجاح' : 'Statement imported'); setShowImportDialog(false); setImportData(null); }
    catch (e: any) { toast.error(e?.message || (language === 'ar' ? 'حدث خطأ أثناء الاستيراد' : 'Error importing')); }
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
                      <Button variant="ghost" size="sm" onClick={() => { setEditingAccount(account); setEditAccountForm({ account_name: account.account_name, bank_name: account.bank_name, account_number_encrypted: account.account_number || '', iban_encrypted: account.iban || '', account_category_id: account.account_category_id || '', opening_balance: Number(account.opening_balance), notes: account.notes || '' }); setShowEditAccountDialog(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteAccountId(account.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {bankAccounts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t.bank_no_accounts}</TableCell></TableRow>}
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
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedStatement(statement); setShowTransactionsDialog(true); }}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingStatement(statement); setEditStatementForm({ statement_date: statement.statement_date, notes: statement.notes || '', file_name: statement.file_name || '' }); setShowEditStatementDialog(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteStatementId(statement.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
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
              <Label>{language === 'ar' ? 'ملف الكشف (CSV, Excel, PDF)' : 'Statement File (CSV, Excel, PDF)'}</Label>
              <input ref={fileInputRef} type="file" accept=".csv,.txt,.xlsx,.xls,.pdf" onChange={handleFileUpload} className="hidden" />
              <div onClick={() => !parsingFile && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors ${parsingFile ? 'opacity-70 pointer-events-none' : ''}`}>
                {parsingFile ? (
                  <div className="space-y-2">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                    <p className="font-medium text-primary">{language === 'ar' ? 'جارِ تحليل الملف بالذكاء الاصطناعي...' : 'Analyzing file with AI...'}</p>
                  </div>
                ) : importData ? (
                  <div className="space-y-1">
                    <CheckCircle className="w-8 h-8 mx-auto text-green-600" />
                    <p className="font-medium text-green-600">{importData.fileName}</p>
                    <p className="text-sm text-muted-foreground">{importData.transactions.length} {language === 'ar' ? 'معاملة' : 'transactions'}</p>
                    {importData.method === 'ai' && <Badge className="bg-purple-100 text-purple-800"><Brain className="w-3 h-3 ml-1" />{language === 'ar' ? 'تم التحليل بالذكاء الاصطناعي' : 'Parsed by AI'}</Badge>}
                    {importData.method === 'excel' && <Badge className="bg-green-100 text-green-800"><Table2 className="w-3 h-3 ml-1" />Excel</Badge>}
                    {importData.method === 'csv' && <Badge className="bg-blue-100 text-blue-800"><FileText className="w-3 h-3 ml-1" />CSV</Badge>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="font-medium">{language === 'ar' ? 'اضغط لاختيار ملف' : 'Click to select file'}</p>
                    <p className="text-xs text-muted-foreground">CSV, Excel (.xlsx, .xls), PDF</p>
                    <div className="flex items-center justify-center gap-1 text-xs text-purple-600"><Brain className="w-3 h-3" />{language === 'ar' ? 'يدعم القراءة بالذكاء الاصطناعي' : 'AI-powered parsing'}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>{t.cancel}</Button>
            <Button onClick={handleImportStatement} disabled={importStatement.isPending || !importData || parsingFile}>{importStatement.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.import}</Button>
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
      
      {/* Edit Statement Dialog */}
      <Dialog open={showEditStatementDialog} onOpenChange={setShowEditStatementDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{language === 'ar' ? 'تعديل كشف الحساب' : 'Edit Statement'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t.bank_statement_date}</Label><Input type="date" value={editStatementForm.statement_date} onChange={e => setEditStatementForm({ ...editStatementForm, statement_date: e.target.value })} /></div>
            <div><Label>{language === 'ar' ? 'اسم الملف' : 'File Name'}</Label><Input value={editStatementForm.file_name} onChange={e => setEditStatementForm({ ...editStatementForm, file_name: e.target.value })} /></div>
            <div><Label>{t.notes}</Label><Textarea value={editStatementForm.notes} onChange={e => setEditStatementForm({ ...editStatementForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditStatementDialog(false)}>{t.cancel}</Button>
            <Button onClick={async () => {
              if (!editingStatement) return;
              try {
                await updateStatement.mutateAsync({ id: editingStatement.id, updates: editStatementForm });
                toast.success(language === 'ar' ? 'تم تحديث الكشف بنجاح' : 'Statement updated');
                setShowEditStatementDialog(false);
              } catch { toast.error(language === 'ar' ? 'حدث خطأ' : 'Error'); }
            }} disabled={updateStatement.isPending}>{updateStatement.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Statement Confirmation */}
      <AlertDialog open={!!deleteStatementId} onOpenChange={(open) => !open && setDeleteStatementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'ar' ? 'حذف كشف الحساب' : 'Delete Statement'}</AlertDialogTitle>
            <AlertDialogDescription>{language === 'ar' ? 'هل أنت متأكد من حذف هذا الكشف؟ سيتم حذف جميع المعاملات المرتبطة به.' : 'Are you sure? All related transactions will be deleted.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
              if (!deleteStatementId) return;
              try {
                await deleteStatement.mutateAsync(deleteStatementId);
                toast.success(language === 'ar' ? 'تم حذف الكشف بنجاح' : 'Statement deleted');
                setDeleteStatementId(null);
              } catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Error deleting'); }
            }}>{language === 'ar' ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Bank Account Dialog */}
      <Dialog open={showEditAccountDialog} onOpenChange={setShowEditAccountDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{language === 'ar' ? 'تعديل الحساب البنكي' : 'Edit Bank Account'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t.bank_account_name} *</Label><Input value={editAccountForm.account_name} onChange={e => setEditAccountForm({ ...editAccountForm, account_name: e.target.value })} /></div>
            <div><Label>{t.bank_name_label} *</Label><Input value={editAccountForm.bank_name} onChange={e => setEditAccountForm({ ...editAccountForm, bank_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t.bank_account_number}</Label><Input value={editAccountForm.account_number_encrypted} onChange={e => setEditAccountForm({ ...editAccountForm, account_number_encrypted: e.target.value })} dir="ltr" /></div>
              <div><Label>IBAN</Label><Input value={editAccountForm.iban_encrypted} onChange={e => setEditAccountForm({ ...editAccountForm, iban_encrypted: e.target.value })} dir="ltr" placeholder="SA..." /></div>
            </div>
            <div><Label>{language === 'ar' ? 'ربط مع حساب في دليل الحسابات' : 'Link to Chart of Accounts'}</Label><Select value={editAccountForm.account_category_id} onValueChange={v => setEditAccountForm({ ...editAccountForm, account_category_id: v })}><SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر الحساب المحاسبي' : 'Select account'} /></SelectTrigger><SelectContent>{bankCategoryAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>{language === 'ar' ? 'الرصيد الافتتاحي' : 'Opening Balance'}</Label><Input type="number" value={editAccountForm.opening_balance} onChange={e => setEditAccountForm({ ...editAccountForm, opening_balance: Number(e.target.value) })} /></div>
            <div><Label>{t.notes}</Label><Textarea value={editAccountForm.notes} onChange={e => setEditAccountForm({ ...editAccountForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditAccountDialog(false)}>{t.cancel}</Button>
            <Button onClick={async () => {
              if (!editingAccount || !editAccountForm.account_name || !editAccountForm.bank_name) { toast.error(t.voucher_fill_required); return; }
              try {
                await updateBankAccount.mutateAsync({ id: editingAccount.id, data: editAccountForm });
                toast.success(language === 'ar' ? 'تم تحديث الحساب البنكي بنجاح' : 'Bank account updated');
                setShowEditAccountDialog(false);
              } catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء التحديث' : 'Error updating'); }
            }} disabled={updateBankAccount.isPending}>{updateBankAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bank Account Confirmation */}
      <AlertDialog open={!!deleteAccountId} onOpenChange={(open) => !open && setDeleteAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'ar' ? 'حذف الحساب البنكي' : 'Delete Bank Account'}</AlertDialogTitle>
            <AlertDialogDescription>{language === 'ar' ? 'هل أنت متأكد من حذف هذا الحساب البنكي؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure? This action cannot be undone.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
              if (!deleteAccountId) return;
              try {
                await deleteBankAccount.mutateAsync(deleteAccountId);
                toast.success(language === 'ar' ? 'تم حذف الحساب البنكي بنجاح' : 'Bank account deleted');
                setDeleteAccountId(null);
              } catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Error deleting'); }
            }}>{language === 'ar' ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transactions Dialog */}
      <TransactionsDialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog} statement={selectedStatement} />
    </div>
  );
}

function AccountSearchSelect({ accounts, value, onChange, language }: { accounts: any[]; value: string; onChange: (id: string) => void; language: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts.slice(0, 50);
    const q = search.toLowerCase();
    return accounts.filter((a: any) => a.code.includes(q) || a.name.toLowerCase().includes(q)).slice(0, 50);
  }, [accounts, search]);

  const selected = accounts.find((a: any) => a.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between h-8 w-[220px] rounded-md border border-input bg-background px-2 text-xs hover:bg-accent"
      >
        <span className="truncate">{selected ? `${selected.code} - ${selected.name}` : (language === 'ar' ? 'اختر حساب' : 'Select')}</span>
        <ChevronsUpDown className="w-3 h-3 opacity-50 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-[280px] rounded-md border bg-popover shadow-lg" style={{ [language === 'ar' ? 'right' : 'left']: 0 }}>
          <div className="flex items-center gap-1 border-b px-2 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={language === 'ar' ? 'بحث بالكود أو الاسم...' : 'Search...'}
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-3">{language === 'ar' ? 'لا توجد نتائج' : 'No results'}</p>
            )}
            {filtered.map((a: any) => (
              <button
                key={a.id}
                type="button"
                onClick={() => { onChange(a.id); setOpen(false); setSearch(''); }}
                className={`w-full text-right flex items-center gap-1.5 rounded px-2 py-1.5 text-xs hover:bg-accent cursor-pointer ${value === a.id ? 'bg-accent' : ''}`}
              >
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

function TransactionsDialog({ open, onOpenChange, statement }: { open: boolean; onOpenChange: (open: boolean) => void; statement: any }) {
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
        
        // Resolve account: try by ID first, then by code
        let resolvedAccountId = cls?.account_id;
        let resolvedAccountCode = cls?.account_code;
        let resolvedAccountName = cls?.account_name;
        
        if (cls) {
          const byId = accounts.find(a => a.id === cls.account_id);
          if (byId) {
            resolvedAccountId = byId.id;
            resolvedAccountCode = byId.code;
            resolvedAccountName = byId.name;
          } else {
            // Fallback: match by code
            const byCode = accounts.find(a => a.code === cls.account_code);
            if (byCode) {
              resolvedAccountId = byCode.id;
              resolvedAccountCode = byCode.code;
              resolvedAccountName = byCode.name;
            } else {
              // Fallback: fuzzy match by name
              const byName = accounts.find(a => 
                a.name.includes(cls.account_name || '') || 
                (cls.account_name || '').includes(a.name)
              );
              if (byName) {
                resolvedAccountId = byName.id;
                resolvedAccountCode = byName.code;
                resolvedAccountName = byName.name;
              } else {
                resolvedAccountId = undefined;
              }
            }
          }
        }
        
        return {
          ...txn,
          debit: Number(txn.debit),
          credit: Number(txn.credit),
          balance: txn.balance ? Number(txn.balance) : null,
          classified_account_id: resolvedAccountId,
          classified_account_code: resolvedAccountCode,
          classified_account_name: resolvedAccountName,
          confidence: cls?.confidence,
          reason: cls?.reason,
        };
      });
      
      setClassified(classifiedTxns);
      setShowClassification(true);
      toast.success(language === 'ar' ? `تم تصنيف ${classifications.length} معاملة بالذكاء الاصطناعي` : `${classifications.length} transactions classified`);
    } catch (e: any) {
      toast.error(e?.message || (language === 'ar' ? 'خطأ في التصنيف' : 'Classification error'));
    }
    setClassifying(false);
  };

  const handleCreateEntries = async () => {
    if (!company?.id || !bankAccountCategoryId || classified.length === 0) {
      if (!bankAccountCategoryId) {
        toast.error(language === 'ar' ? 'يجب ربط الحساب البنكي بحساب في شجرة الحسابات أولاً' : 'Bank account must be linked to chart of accounts first');
        return;
      }
      return;
    }
    setCreatingEntries(true);
    setEntryErrors([]);
    try {
      const result = await createJournalEntriesFromTransactions(
        classified.filter(t => t.classified_account_id),
        bankAccountCategoryId,
        company.id,
        statement.id,
        selectedFiscalYear?.id || null,
      );
      
      if (result.created > 0) {
        toast.success(language === 'ar' ? `تم إنشاء ${result.created} قيد محاسبي بنجاح` : `${result.created} journal entries created`);
        refetch();
      }
      if (result.errors.length > 0) {
        setEntryErrors(result.errors);
        toast.error(language === 'ar' ? `${result.errors.length} أخطاء أثناء الإنشاء` : `${result.errors.length} errors`);
        console.error('Journal entry errors:', result.errors);
      } else {
        setShowClassification(false);
        setClassified([]);
      }
    } catch (e: any) {
      toast.error(e?.message || (language === 'ar' ? 'خطأ في إنشاء القيود' : 'Error creating entries'));
    }
    setCreatingEntries(false);
  };

  const updateClassifiedAccount = (index: number, accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    setClassified(prev => prev.map((t, i) => i === index ? {
      ...t,
      classified_account_id: account.id,
      classified_account_code: account.code,
      classified_account_name: account.name,
      confidence: 'high' as const,
      reason: 'تعديل يدوي',
    } : t));
  };

  const confidenceBadge = (c?: string) => {
    if (c === 'high') return <Badge className="bg-green-100 text-green-800 text-xs">{language === 'ar' ? 'عالية' : 'High'}</Badge>;
    if (c === 'medium') return <Badge className="bg-yellow-100 text-yellow-800 text-xs">{language === 'ar' ? 'متوسطة' : 'Medium'}</Badge>;
    return <Badge className="bg-red-100 text-red-800 text-xs">{language === 'ar' ? 'منخفضة' : 'Low'}</Badge>;
  };
  
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setShowClassification(false); setClassified([]); setEntryErrors([]); } onOpenChange(v); }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{language === 'ar' ? 'معاملات كشف الحساب' : 'Statement Transactions'} - {statement.bank_account?.account_name}</DialogTitle>
          </div>
        </DialogHeader>
        
        {/* Action buttons */}
        {!showClassification && unmatchedTransactions.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-sm flex-1">
              {language === 'ar' 
                ? `${unmatchedTransactions.length} معاملة غير مصنفة - يمكنك تصنيفها وإنشاء قيود محاسبية تلقائياً`
                : `${unmatchedTransactions.length} unmatched transactions - classify and create journal entries`}
            </span>
            <Button 
              onClick={handleClassify} 
              disabled={classifying}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {classifying ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Brain className="w-4 h-4 ml-2" />}
              {language === 'ar' ? 'تصنيف بالذكاء الاصطناعي' : 'AI Classify'}
            </Button>
          </div>
        )}

        {/* Classification Review */}
        {showClassification && classified.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">
                  {language === 'ar' ? 'مراجعة التصنيف - يمكنك تعديل الحساب المقابل لكل معاملة' : 'Review classification - you can adjust accounts'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowClassification(false); setClassified([]); }}>
                  {t.cancel}
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleCreateEntries} 
                  disabled={creatingEntries || !bankAccountCategoryId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {creatingEntries ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                  {language === 'ar' ? `إنشاء ${classified.filter(t => t.classified_account_id).length} قيد` : `Create ${classified.filter(t => t.classified_account_id).length} entries`}
                </Button>
              </div>
            </div>
            
            {!bankAccountCategoryId && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-sm">
                ⚠️ {language === 'ar' ? 'يجب ربط الحساب البنكي بحساب في شجرة الحسابات أولاً من إعدادات الحسابات البنكية' : 'Link bank account to chart of accounts first'}
              </div>
            )}

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
                    <TableCell className="max-w-[180px] truncate text-sm" title={txn.description || ''}>
                      {txn.description || '-'}
                      {txn.reason && <p className="text-xs text-muted-foreground mt-0.5">{txn.reason}</p>}
                    </TableCell>
                    <TableCell className="text-red-600 text-sm">{txn.debit > 0 ? formatCurrency(txn.debit) : '-'}</TableCell>
                    <TableCell className="text-green-600 text-sm">{txn.credit > 0 ? formatCurrency(txn.credit) : '-'}</TableCell>
                    <TableCell>
                      <AccountSearchSelect
                        accounts={accounts}
                        value={txn.classified_account_id || ''}
                        onChange={(v) => updateClassifiedAccount(idx, v)}
                        language={language}
                      />
                    </TableCell>
                    <TableCell>{confidenceBadge(txn.confidence)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Error Details Panel */}
        {entryErrors.length > 0 && (
          <div className="space-y-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg max-h-[200px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="font-medium text-destructive text-sm">
                {language === 'ar' ? `${entryErrors.length} خطأ أثناء إنشاء القيود:` : `${entryErrors.length} errors:`}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setEntryErrors([])} className="h-6 px-2 text-xs">✕</Button>
            </div>
            {entryErrors.map((err, i) => (
              <p key={i} className="text-xs text-destructive/80 border-b border-destructive/10 pb-1">
                {i + 1}. {err}
              </p>
            ))}
          </div>
        )}

        {/* Normal transactions view */}
        {!showClassification && (
          isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div> : (
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
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
