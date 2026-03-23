/**
 * Hook: Journal Entry Form Logic
 * Extracted from JournalEntriesPage to separate concerns.
 */
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useJournalEntries, useCreateJournalEntry, useDeleteJournalEntry, useJournalEntry } from '@/hooks/useAccounting';
import { useLeafAccounts } from '@/hooks/useLeafAccounts';
import { useCostCenters } from '@/hooks/useCostCenters';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { useUnifiedPrintReport } from '@/hooks/useUnifiedPrintReport';
import { useDetailedJournalPrint } from '../DetailedJournalPrint';
import { plainFormat } from '@/components/financial-statements/utils/numberFormatting';

export interface JournalLine {
  account_id: string;
  account_code?: string;
  account_name?: string;
  description: string;
  debit: number;
  credit: number;
  reference?: string;
  line_date?: string;
  cost_center?: string;
  cost_center_id?: string;
}

export interface JournalTemplate {
  name: string;
  defaultDescription: string;
  lines: Array<{
    accountCode: string;
    accountName: string;
    description: string;
    side: 'debit' | 'credit';
  }>;
}

const emptyLine = (): JournalLine => ({
  account_id: '', description: '', debit: 0, credit: 0,
  reference: '', line_date: format(new Date(), 'yyyy-MM-dd'), cost_center: '',
});

export function useJournalEntryForm() {
  const { t, direction, language } = useLanguage();
  const { company } = useCompany();
  const { data: entries = [], isLoading } = useJournalEntries();
  const { data: accounts = [] } = useLeafAccounts();
  const { data: costCenters = [] } = useCostCenters();
  const { filterByFiscalYear } = useFiscalYearFilter();
  const { printReport } = useUnifiedPrintReport();
  const { printDetailedJournal } = useDetailedJournalPrint();
  const isRealEstate = useIndustryFeatures().hasRealEstateProjects;
  const createJournalEntry = useCreateJournalEntry();
  const deleteJournalEntry = useDeleteJournalEntry();

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null);
  const [attachmentEntryId, setAttachmentEntryId] = useState<string | null>(null);
  const [printingEntryId, setPrintingEntryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: viewingEntry } = useJournalEntry(viewingEntryId);
  const { data: printingEntry } = useJournalEntry(printingEntryId);

  // Form state
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [notes1, setNotes1] = useState('');
  const [notes2, setNotes2] = useState('');
  const [includeVat, setIncludeVat] = useState(false);
  const [vatType, setVatType] = useState<'sales' | 'purchases'>('purchases');
  const [taxNumber, setTaxNumber] = useState('');
  const [supplierCustomer, setSupplierCustomer] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()]);

  const resetForm = () => {
    setEntryDate(new Date());
    setDescription(''); setNotes1(''); setNotes2('');
    setIncludeVat(false); setVatType('purchases');
    setTaxNumber(''); setSupplierCustomer('');
    setProjectId(null);
    setLines([emptyLine(), emptyLine()]);
  };

  const handleTemplateSelect = (template: JournalTemplate) => {
    resetForm();
    setDescription(template.defaultDescription);
    const templateLines = template.lines.map(tl => {
      const account = accounts.find(a => a.code === tl.accountCode);
      return {
        account_id: account?.id || '',
        account_code: account?.code || tl.accountCode,
        account_name: account?.name || tl.accountName,
        description: tl.description,
        debit: 0, credit: 0,
        reference: '', line_date: format(new Date(), 'yyyy-MM-dd'), cost_center: '',
      };
    });
    setLines(templateLines);
    setIsDialogOpen(true);
    toast.success(`تم تحميل قالب: ${template.name} — أدخل المبالغ`);
  };

  const addLine = () => setLines([...lines, emptyLine()]);
  const removeLine = (index: number) => {
    if (lines.length > 2) setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof JournalLine, value: string | number) => {
    const newLines = [...lines];
    if (field === 'debit' || field === 'credit') {
      newLines[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else if (field === 'account_id') {
      const account = accounts.find(a => a.id === value);
      newLines[index].account_id = value as string;
      newLines[index].account_code = account?.code;
      newLines[index].account_name = account?.name;
    } else {
      (newLines[index] as any)[field] = value;
    }
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = async () => {
    if (!description) { toast.error(t.je_statement); return; }
    const validLines = lines.filter(l => l.account_id && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) { toast.error(t.acc_error); return; }
    if (!isBalanced) { toast.error(t.je_unbalanced); return; }

    try {
      await createJournalEntry.mutateAsync({
        entry: {
          entry_date: format(entryDate, 'yyyy-MM-dd'),
          description: `${description}${notes1 ? ` | ${notes1}` : ''}${notes2 ? ` | ${notes2}` : ''}`,
          is_posted: true, total_debit: totalDebit, total_credit: totalCredit,
          reference_type: 'manual', reference_id: null, created_by: null,
          project_id: projectId || null,
        },
        lines: validLines.map(l => ({
          account_id: l.account_id, description: l.description,
          debit: l.debit, credit: l.credit, cost_center_id: l.cost_center_id || null,
        })),
      });
      toast.success(t.acc_added);
      setIsDialogOpen(false);
      resetForm();
    } catch { toast.error(t.acc_error); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteJournalEntry.mutateAsync(id); toast.success(t.acc_deleted); }
    catch { toast.error(t.acc_error); }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : accountId;
  };

  const getReferenceTypeLabel = (type: string | null) => {
    switch (type) {
      case 'manual': return t.je_type_manual;
      case 'sale': return t.je_type_sales;
      case 'purchase': return t.je_type_purchases;
      case 'expense': return t.je_type_expenses;
      case 'voucher': return t.je_type_voucher;
      default: return t.je_type_auto;
    }
  };

  const filteredEntries = useMemo(() => {
    let result = filterByFiscalYear(entries, 'entry_date');
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((entry: any) => {
        const entryNum = String(entry.entry_number || '');
        const entryDate = entry.entry_date ? format(new Date(entry.entry_date), 'yyyy/MM/dd') : '';
        const desc = (entry.description || '').toLowerCase();
        return entryNum.includes(q) || entryDate.includes(q) || desc.includes(q)
          || String(entry.total_debit || 0).includes(q) || String(entry.total_credit || 0).includes(q);
      });
    }
    return result;
  }, [entries, filterByFiscalYear, searchQuery]);

  const nextEntryNumber = filteredEntries.length > 0
    ? Math.max(...filteredEntries.map((e: any) => e.entry_number)) + 1 : 1;

  const fmt = (n: number) => plainFormat(n);

  const printJournalSheet = () => {
    if (!filteredEntries.length) {
      toast.error(language === 'ar' ? 'لا توجد قيود للطباعة' : 'No entries to print');
      return;
    }
    const columns = [
      { header: t.je_col_number, key: 'entry_number' },
      { header: t.je_col_date, key: 'date' },
      { header: t.je_col_type, key: 'type' },
      { header: t.je_col_desc, key: 'description' },
      { header: t.je_col_debit, key: 'debit' },
      { header: t.je_col_credit, key: 'credit' },
      { header: t.je_col_status, key: 'status' },
    ];
    const data = filteredEntries.map((entry: any) => ({
      entry_number: entry.entry_number,
      date: format(new Date(entry.entry_date), 'yyyy/MM/dd'),
      type: getReferenceTypeLabel(entry.reference_type),
      description: entry.description,
      debit: fmt(entry.total_debit), credit: fmt(entry.total_credit),
      status: entry.is_posted ? (language === 'ar' ? 'مرحّل' : 'Posted') : (language === 'ar' ? 'مسودة' : 'Draft'),
    }));
    const totalDebitAll = filteredEntries.reduce((s: number, e: any) => s + e.total_debit, 0);
    const totalCreditAll = filteredEntries.reduce((s: number, e: any) => s + e.total_credit, 0);
    printReport({
      title: language === 'ar' ? 'كشف القيود اليومية' : 'Journal Entries Sheet',
      columns, data,
      headerInfo: [
        { label: language === 'ar' ? 'عدد القيود' : 'Entries Count', value: filteredEntries.length.toString() },
        { label: language === 'ar' ? 'إجمالي المدين' : 'Total Debit', value: fmt(totalDebitAll) + ' ر.س' },
        { label: language === 'ar' ? 'إجمالي الدائن' : 'Total Credit', value: fmt(totalCreditAll) + ' ر.س' },
      ],
      summaryRow: {
        entry_number: '', date: '', type: '',
        description: language === 'ar' ? 'الإجمالي' : 'Total',
        debit: fmt(totalDebitAll), credit: fmt(totalCreditAll), status: '',
      },
    });
  };

  return {
    // Language
    t, direction, language, company, isRealEstate,
    // Data
    accounts, costCenters, entries, filteredEntries, isLoading,
    nextEntryNumber,
    // Dialog states
    isDialogOpen, setIsDialogOpen,
    viewingEntryId, setViewingEntryId, viewingEntry,
    attachmentEntryId, setAttachmentEntryId,
    printingEntryId, setPrintingEntryId, printingEntry,
    searchQuery, setSearchQuery,
    // Form state
    entryDate, setEntryDate,
    description, setDescription,
    notes1, setNotes1, notes2, setNotes2,
    includeVat, setIncludeVat,
    vatType, setVatType,
    taxNumber, setTaxNumber,
    supplierCustomer, setSupplierCustomer,
    projectId, setProjectId,
    lines, addLine, removeLine, updateLine,
    totalDebit, totalCredit, difference, isBalanced,
    // Actions
    resetForm, handleTemplateSelect, handleSubmit, handleDelete,
    getAccountName, getReferenceTypeLabel,
    printJournalSheet, printDetailedJournal,
    createJournalEntry,
    fmt,
  };
}
