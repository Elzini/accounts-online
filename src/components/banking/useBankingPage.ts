/**
 * Banking Page - Custom Hook
 * Extracts all state management and handlers from BankingPage
 */
import { useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { useBankAccounts, useBankStatements, useBankReconciliations, useAddBankAccount, useUpdateBankAccount, useDeleteBankAccount, useImportBankStatement, useUpdateBankStatement, useDeleteBankStatement, useCreateBankReconciliation } from '@/hooks/useBanking';
import { useAccounts } from '@/hooks/useAccounting';
import { useCompany } from '@/contexts/CompanyContext';
import { parseBankStatementFile } from '@/services/bankStatementParser';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';

export function useBankingPage() {
  const { t, language } = useLanguage();
  const { company } = useCompany();
  const { data: bankAccounts = [], isLoading: loadingAccounts } = useBankAccounts();
  const { data: allStatements = [] } = useBankStatements();
  const { data: allReconciliations = [] } = useBankReconciliations();
  const { data: accounts = [] } = useAccounts();
  const { filterByFiscalYear } = useFiscalYearFilter();

  const statements = useMemo(() => filterByFiscalYear(allStatements, 'statement_date'), [allStatements, filterByFiscalYear]);
  const reconciliations = useMemo(() => filterByFiscalYear(allReconciliations, 'reconciliation_date'), [allReconciliations, filterByFiscalYear]);

  const addBankAccount = useAddBankAccount();
  const updateBankAccount = useUpdateBankAccount();
  const deleteBankAccount = useDeleteBankAccount();
  const importStatement = useImportBankStatement();
  const updateStatement = useUpdateBankStatement();
  const deleteStatement = useDeleteBankStatement();
  const createReconciliation = useCreateBankReconciliation();

  // Dialog states
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
    try {
      await addBankAccount.mutateAsync({ ...accountForm, company_id: company.id, current_balance: accountForm.opening_balance, is_active: true });
      toast.success(language === 'ar' ? 'تمت إضافة الحساب البنكي بنجاح' : 'Bank account added');
      setShowAccountDialog(false);
      setAccountForm({ account_name: '', bank_name: '', account_number_encrypted: '', iban_encrypted: '', account_category_id: '', opening_balance: 0, notes: '' });
    } catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء الإضافة' : 'Error adding'); }
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
    try {
      await importStatement.mutateAsync({ bankAccountId: importForm.bank_account_id, companyId: company.id, statementDate: importForm.statement_date, transactions: importData.transactions, fileName: importData.fileName });
      toast.success(language === 'ar' ? 'تم استيراد كشف الحساب بنجاح' : 'Statement imported');
      setShowImportDialog(false);
      setImportData(null);
    } catch (e: any) { toast.error(e?.message || (language === 'ar' ? 'حدث خطأ أثناء الاستيراد' : 'Error importing')); }
  };

  const handleCreateReconciliation = async () => {
    if (!reconciliationForm.bank_account_id || !company?.id) { toast.error(t.voucher_fill_required); return; }
    try {
      await createReconciliation.mutateAsync({ bankAccountId: reconciliationForm.bank_account_id, companyId: company.id, reconciliationDate: reconciliationForm.reconciliation_date, statementEndingBalance: reconciliationForm.statement_ending_balance, bookBalance: reconciliationForm.book_balance });
      toast.success(language === 'ar' ? 'تم إنشاء التسوية بنجاح' : 'Reconciliation created');
      setShowReconciliationDialog(false);
    } catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء الإنشاء' : 'Error creating'); }
  };

  const bankCategoryAccounts = accounts.filter(a => a.code.startsWith('110') || a.code.startsWith('11'));
  const totalBalance = bankAccounts.reduce((sum, a) => sum + Number(a.current_balance), 0);
  const activeAccounts = bankAccounts.filter(a => a.is_active).length;
  const pendingStatements = statements.filter(s => s.status === 'pending' || s.unmatched_transactions > 0).length;

  return {
    t, language, company, bankAccounts, statements, reconciliations, accounts, loadingAccounts,
    addBankAccount, updateBankAccount, deleteBankAccount, importStatement, updateStatement, deleteStatement, createReconciliation,
    showAccountDialog, setShowAccountDialog, showImportDialog, setShowImportDialog,
    showReconciliationDialog, setShowReconciliationDialog, showTransactionsDialog, setShowTransactionsDialog,
    selectedStatement, setSelectedStatement,
    showEditStatementDialog, setShowEditStatementDialog, editingStatement, setEditingStatement, editStatementForm, setEditStatementForm,
    deleteStatementId, setDeleteStatementId,
    showEditAccountDialog, setShowEditAccountDialog, editingAccount, setEditingAccount, editAccountForm, setEditAccountForm,
    deleteAccountId, setDeleteAccountId,
    fileInputRef, importData, setImportData, parsingFile,
    accountForm, setAccountForm, importForm, setImportForm, reconciliationForm, setReconciliationForm,
    currency, formatCurrency,
    handleAddAccount, handleFileUpload, handleImportStatement, handleCreateReconciliation,
    bankCategoryAccounts, totalBalance, activeAccounts, pendingStatements,
  };
}
