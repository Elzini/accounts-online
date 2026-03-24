import { Loader2, Upload, CheckCircle, Brain, FileText, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { useBankingPage } from '../useBankingPage';

export function AddAccountDialog({ ctx }: { ctx: ReturnType<typeof useBankingPage> }) {
  const { t, language, showAccountDialog, setShowAccountDialog, accountForm, setAccountForm, bankCategoryAccounts, handleAddAccount, addBankAccount } = ctx;
  return (
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
  );
}

export function ImportStatementDialog({ ctx }: { ctx: ReturnType<typeof useBankingPage> }) {
  const { t, language, showImportDialog, setShowImportDialog, importForm, setImportForm, bankAccounts, fileInputRef, importData, parsingFile, handleFileUpload, handleImportStatement, importStatement } = ctx;
  return (
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
          <Button onClick={handleImportStatement} disabled={importStatement.isPending || !importData || parsingFile}>{importStatement.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.import}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReconciliationDialog({ ctx }: { ctx: ReturnType<typeof useBankingPage> }) {
  const { t, language, showReconciliationDialog, setShowReconciliationDialog, reconciliationForm, setReconciliationForm, bankAccounts, handleCreateReconciliation, createReconciliation, currency, formatCurrency } = ctx;
  const diff = reconciliationForm.statement_ending_balance - reconciliationForm.book_balance;
  return (
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
            <Card className={Math.abs(diff) > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">{t.bank_difference}</p>
                <p className={`text-2xl font-bold ${Math.abs(diff) > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(diff)} {currency}</p>
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
  );
}

export function EditStatementDialog({ ctx }: { ctx: ReturnType<typeof useBankingPage> }) {
  const { t, language, showEditStatementDialog, setShowEditStatementDialog, editingStatement, editStatementForm, setEditStatementForm, updateStatement } = ctx;
  return (
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
            try { await updateStatement.mutateAsync({ id: editingStatement.id, updates: editStatementForm }); toast.success(language === 'ar' ? 'تم تحديث الكشف بنجاح' : 'Statement updated'); setShowEditStatementDialog(false); }
            catch { toast.error(language === 'ar' ? 'حدث خطأ' : 'Error'); }
          }} disabled={updateStatement.isPending}>{updateStatement.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteStatementDialog({ ctx }: { ctx: ReturnType<typeof useBankingPage> }) {
  const { t, language, deleteStatementId, setDeleteStatementId, deleteStatement } = ctx;
  return (
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
            try { await deleteStatement.mutateAsync(deleteStatementId); toast.success(language === 'ar' ? 'تم حذف الكشف بنجاح' : 'Statement deleted'); setDeleteStatementId(null); }
            catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Error deleting'); }
          }}>{language === 'ar' ? 'حذف' : 'Delete'}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function EditAccountDialog({ ctx }: { ctx: ReturnType<typeof useBankingPage> }) {
  const { t, language, showEditAccountDialog, setShowEditAccountDialog, editingAccount, editAccountForm, setEditAccountForm, bankCategoryAccounts, updateBankAccount } = ctx;
  return (
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
            try { await updateBankAccount.mutateAsync({ id: editingAccount.id, data: editAccountForm }); toast.success(language === 'ar' ? 'تم تحديث الحساب البنكي بنجاح' : 'Bank account updated'); setShowEditAccountDialog(false); }
            catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء التحديث' : 'Error updating'); }
          }} disabled={updateBankAccount.isPending}>{updateBankAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteAccountDialog({ ctx }: { ctx: ReturnType<typeof useBankingPage> }) {
  const { t, language, deleteAccountId, setDeleteAccountId, deleteBankAccount } = ctx;
  return (
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
            try { await deleteBankAccount.mutateAsync(deleteAccountId); toast.success(language === 'ar' ? 'تم حذف الحساب البنكي بنجاح' : 'Bank account deleted'); setDeleteAccountId(null); }
            catch (err: any) {
              if (err?.message === 'HAS_RELATED_DATA') toast.error(language === 'ar' ? 'لا يمكن حذف الحساب البنكي لوجود كشوف حساب أو تسويات مرتبطة به.' : 'Cannot delete: account has related data.');
              else toast.error(language === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Error deleting');
            }
          }}>{language === 'ar' ? 'حذف' : 'Delete'}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
