/**
 * Banking - Dialogs (Add Account, Import, Reconciliation, Edit Statement, Edit Account, Delete confirmations)
 */
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, CheckCircle, Brain, FileText, Table2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseBankStatementFile } from '@/services/bankStatementParser';

interface BankDialogsProps {
  // Add Account
  showAccountDialog: boolean;
  setShowAccountDialog: (v: boolean) => void;
  accountForm: any;
  setAccountForm: (v: any) => void;
  handleAddAccount: () => void;
  addBankAccountPending: boolean;
  bankCategoryAccounts: any[];

  // Import Statement
  showImportDialog: boolean;
  setShowImportDialog: (v: boolean) => void;
  importForm: any;
  setImportForm: (v: any) => void;
  handleImportStatement: () => void;
  importStatementPending: boolean;
  bankAccounts: any[];

  // Reconciliation
  showReconciliationDialog: boolean;
  setShowReconciliationDialog: (v: boolean) => void;
  reconciliationForm: any;
  setReconciliationForm: (v: any) => void;
  handleCreateReconciliation: () => void;
  createReconciliationPending: boolean;

  // Edit Statement
  showEditStatementDialog: boolean;
  setShowEditStatementDialog: (v: boolean) => void;
  editStatementForm: any;
  setEditStatementForm: (v: any) => void;
  handleUpdateStatement: () => void;
  updateStatementPending: boolean;

  // Delete Statement
  deleteStatementId: string | null;
  setDeleteStatementId: (v: string | null) => void;
  handleDeleteStatement: () => void;

  // Edit Account
  showEditAccountDialog: boolean;
  setShowEditAccountDialog: (v: boolean) => void;
  editAccountForm: any;
  setEditAccountForm: (v: any) => void;
  handleUpdateAccount: () => void;
  updateAccountPending: boolean;

  // Delete Account
  deleteAccountId: string | null;
  setDeleteAccountId: (v: string | null) => void;
  handleDeleteAccount: () => void;

  language: string;
  t: any;
  currency: string;
  formatCurrency: (v: number) => string;
}

export function BankDialogs(props: BankDialogsProps) {
  const {
    showAccountDialog, setShowAccountDialog, accountForm, setAccountForm, handleAddAccount, addBankAccountPending, bankCategoryAccounts,
    showImportDialog, setShowImportDialog, importForm, setImportForm, handleImportStatement, importStatementPending, bankAccounts,
    showReconciliationDialog, setShowReconciliationDialog, reconciliationForm, setReconciliationForm, handleCreateReconciliation, createReconciliationPending,
    showEditStatementDialog, setShowEditStatementDialog, editStatementForm, setEditStatementForm, handleUpdateStatement, updateStatementPending,
    deleteStatementId, setDeleteStatementId, handleDeleteStatement,
    showEditAccountDialog, setShowEditAccountDialog, editAccountForm, setEditAccountForm, handleUpdateAccount, updateAccountPending,
    deleteAccountId, setDeleteAccountId, handleDeleteAccount,
    language, t, currency, formatCurrency,
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importData, setImportData] = useState<{ transactions: any[]; fileName: string; method?: string } | null>(null);
  const [parsingFile, setParsingFile] = useState(false);

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

  return (
    <>
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
            <div><Label>{language === 'ar' ? 'ربط مع حساب في دليل الحسابات' : 'Link to Chart of Accounts'}</Label><Select value={accountForm.account_category_id} onValueChange={v => setAccountForm({ ...accountForm, account_category_id: v })}><SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر الحساب المحاسبي' : 'Select account'} /></SelectTrigger><SelectContent>{bankCategoryAccounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>{language === 'ar' ? 'الرصيد الافتتاحي' : 'Opening Balance'}</Label><Input type="number" value={accountForm.opening_balance} onChange={e => setAccountForm({ ...accountForm, opening_balance: Number(e.target.value) })} /></div>
            <div><Label>{t.notes}</Label><Textarea value={accountForm.notes} onChange={e => setAccountForm({ ...accountForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccountDialog(false)}>{t.cancel}</Button>
            <Button onClick={handleAddAccount} disabled={addBankAccountPending}>{addBankAccountPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Statement Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(v) => { setShowImportDialog(v); if (!v) setImportData(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{language === 'ar' ? 'استيراد كشف حساب بنكي' : 'Import Bank Statement'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{language === 'ar' ? 'الحساب البنكي *' : 'Bank Account *'}</Label><Select value={importForm.bank_account_id} onValueChange={v => setImportForm({ ...importForm, bank_account_id: v })}><SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر الحساب البنكي' : 'Select account'} /></SelectTrigger><SelectContent>{bankAccounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.account_name} - {a.bank_name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>{t.bank_statement_date}</Label><Input type="date" value={importForm.statement_date} onChange={e => setImportForm({ ...importForm, statement_date: e.target.value })} /></div>
            <div>
              <Label>{language === 'ar' ? 'ملف الكشف (CSV, Excel, PDF)' : 'Statement File (CSV, Excel, PDF)'}</Label>
              <input ref={fileInputRef} type="file" accept=".csv,.txt,.xlsx,.xls,.pdf" onChange={handleFileUpload} className="hidden" />
              <div onClick={() => !parsingFile && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors ${parsingFile ? 'opacity-70 pointer-events-none' : ''}`}>
                {parsingFile ? (
                  <div className="space-y-2"><Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" /><p className="font-medium text-primary">{language === 'ar' ? 'جارِ تحليل الملف بالذكاء الاصطناعي...' : 'Analyzing file with AI...'}</p></div>
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
            <Button onClick={() => { handleImportStatement(); setImportData(null); }} disabled={importStatementPending || !importData || parsingFile}>{importStatementPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.import}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reconciliation Dialog */}
      <Dialog open={showReconciliationDialog} onOpenChange={setShowReconciliationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{language === 'ar' ? 'تسوية بنكية جديدة' : 'New Bank Reconciliation'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{language === 'ar' ? 'الحساب البنكي *' : 'Bank Account *'}</Label><Select value={reconciliationForm.bank_account_id} onValueChange={v => setReconciliationForm({ ...reconciliationForm, bank_account_id: v })}><SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر الحساب البنكي' : 'Select account'} /></SelectTrigger><SelectContent>{bankAccounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.account_name} - {a.bank_name}</SelectItem>)}</SelectContent></Select></div>
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
            <Button onClick={handleCreateReconciliation} disabled={createReconciliationPending}>{createReconciliationPending ? <Loader2 className="w-4 h-4 animate-spin" /> : language === 'ar' ? 'إنشاء التسوية' : 'Create Reconciliation'}</Button>
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
            <Button onClick={handleUpdateStatement} disabled={updateStatementPending}>{updateStatementPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Statement */}
      <AlertDialog open={!!deleteStatementId} onOpenChange={(open) => !open && setDeleteStatementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'ar' ? 'حذف كشف الحساب' : 'Delete Statement'}</AlertDialogTitle>
            <AlertDialogDescription>{language === 'ar' ? 'هل أنت متأكد من حذف هذا الكشف؟ سيتم حذف جميع المعاملات المرتبطة به.' : 'Are you sure? All related transactions will be deleted.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteStatement}>{language === 'ar' ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Account Dialog */}
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
            <div><Label>{language === 'ar' ? 'ربط مع حساب في دليل الحسابات' : 'Link to Chart of Accounts'}</Label><Select value={editAccountForm.account_category_id} onValueChange={v => setEditAccountForm({ ...editAccountForm, account_category_id: v })}><SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر الحساب المحاسبي' : 'Select account'} /></SelectTrigger><SelectContent>{bankCategoryAccounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>{language === 'ar' ? 'الرصيد الافتتاحي' : 'Opening Balance'}</Label><Input type="number" value={editAccountForm.opening_balance} onChange={e => setEditAccountForm({ ...editAccountForm, opening_balance: Number(e.target.value) })} /></div>
            <div><Label>{t.notes}</Label><Textarea value={editAccountForm.notes} onChange={e => setEditAccountForm({ ...editAccountForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditAccountDialog(false)}>{t.cancel}</Button>
            <Button onClick={handleUpdateAccount} disabled={updateAccountPending}>{updateAccountPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account */}
      <AlertDialog open={!!deleteAccountId} onOpenChange={(open) => !open && setDeleteAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'ar' ? 'حذف الحساب البنكي' : 'Delete Bank Account'}</AlertDialogTitle>
            <AlertDialogDescription>{language === 'ar' ? 'هل أنت متأكد من حذف هذا الحساب البنكي؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure? This action cannot be undone.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteAccount}>{language === 'ar' ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
