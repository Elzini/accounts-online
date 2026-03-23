/**
 * Chart of Accounts - Logic Hook
 * Extracted from ChartOfAccountsPage.tsx (710 lines)
 */
import { useState, useMemo } from 'react';
import { useAccounts, useAddAccount, useUpdateAccount, useDeleteAccount, useCreateDefaultAccounts } from '@/hooks/useAccounting';
import { toast } from 'sonner';
import { AccountCategory, AccountType } from '@/services/accounting';
import { useLanguage } from '@/contexts/LanguageContext';

export const accountTypes: Array<{ value: AccountType; labelKey: string; color: string; bgColor: string }> = [
  { value: 'assets', labelKey: 'coa_type_assets', color: 'bg-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950' },
  { value: 'liabilities', labelKey: 'coa_type_liabilities', color: 'bg-red-500', bgColor: 'bg-red-50 dark:bg-red-950' },
  { value: 'equity', labelKey: 'coa_type_equity', color: 'bg-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-950' },
  { value: 'revenue', labelKey: 'coa_type_revenue', color: 'bg-green-500', bgColor: 'bg-green-50 dark:bg-green-950' },
  { value: 'expenses', labelKey: 'coa_type_expenses', color: 'bg-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950' },
];

export function useChartOfAccounts() {
  const { t, direction } = useLanguage();
  const { data: accounts = [], isLoading } = useAccounts();
  const addAccount = useAddAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createDefaultAccounts = useCreateDefaultAccounts();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<AccountType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<{ code: string; name: string; type: AccountType; description: string; parent_id: string | null; is_system: boolean }>({
    code: '', name: '', type: 'assets', description: '', parent_id: null, is_system: false,
  });

  const filteredAccounts = useMemo(() => accounts.filter(a => {
    const matchesSearch = searchQuery === '' || a.name.includes(searchQuery) || a.code.includes(searchQuery) || (a.description && a.description.includes(searchQuery));
    return matchesSearch && (selectedType === 'all' || a.type === selectedType);
  }), [accounts, searchQuery, selectedType]);

  const rootAccounts = useMemo(() => filteredAccounts.filter(a => !a.parent_id || !filteredAccounts.some(p => p.id === a.parent_id)).sort((a, b) => a.code.localeCompare(b.code)), [filteredAccounts]);

  const toggleNode = (id: string) => { const n = new Set(expandedNodes); n.has(id) ? n.delete(id) : n.add(id); setExpandedNodes(n); };
  const expandAll = () => setExpandedNodes(new Set(accounts.map(a => a.id)));
  const collapseAll = () => setExpandedNodes(new Set());

  const resetForm = () => { setFormData({ code: '', name: '', type: 'assets', description: '', parent_id: null, is_system: false }); setEditingAccount(null); };

  const handleEdit = (account: AccountCategory) => {
    setEditingAccount(account);
    setFormData({ code: account.code, name: account.name, type: account.type, description: account.description || '', parent_id: account.parent_id, is_system: account.is_system });
    setIsDialogOpen(true);
  };

  const suggestCode = (parentId: string | null, type: AccountType) => {
    if (parentId) {
      const parent = accounts.find(a => a.id === parentId);
      if (parent) { const siblings = accounts.filter(a => a.parent_id === parentId); const maxCode = siblings.reduce((max, a) => { const num = parseInt(a.code); return num > max ? num : max; }, parseInt(parent.code)); return String(maxCode + 1); }
    }
    const typeAccounts = accounts.filter(a => a.type === type);
    if (typeAccounts.length === 0) { const prefixes: Record<AccountType, string> = { assets: '1000', liabilities: '2000', equity: '3000', revenue: '4000', expenses: '5000' }; return prefixes[type]; }
    return String(typeAccounts.reduce((max, a) => { const num = parseInt(a.code); return num > max ? num : max; }, 0) + 1);
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) { toast.error(t.coa_toast_fill_required); return; }
    if (accounts.find(a => a.code === formData.code && a.id !== editingAccount?.id)) { toast.error(t.coa_toast_code_exists); return; }
    try {
      if (editingAccount) { await updateAccount.mutateAsync({ id: editingAccount.id, updates: formData }); toast.success(t.coa_toast_updated); }
      else { await addAccount.mutateAsync(formData); toast.success(t.coa_toast_added); }
      setIsDialogOpen(false); resetForm();
    } catch { toast.error(t.coa_toast_save_error); }
  };

  const handleDelete = async (id: string) => { try { await deleteAccount.mutateAsync(id); toast.success(t.coa_toast_deleted); } catch { toast.error(t.coa_toast_delete_error); } };

  const handleCreateDefaults = async () => { try { await createDefaultAccounts.mutateAsync(); toast.success(t.coa_toast_defaults_created); expandAll(); } catch { toast.error(t.coa_toast_defaults_error); } };

  const getParentName = (parentId: string | null) => { if (!parentId) return '-'; const p = accounts.find(a => a.id === parentId); return p ? `${p.code} - ${p.name}` : '-'; };

  const groupedAccounts = accountTypes.map(type => ({ ...type, accounts: filteredAccounts.filter(a => a.type === type.value).sort((a, b) => a.code.localeCompare(b.code)) }));

  return {
    t, direction, isLoading, accounts, filteredAccounts, rootAccounts, groupedAccounts,
    isDialogOpen, setIsDialogOpen, editingAccount, formData, setFormData,
    searchQuery, setSearchQuery, selectedType, setSelectedType,
    viewMode, setViewMode, expandedNodes, toggleNode, expandAll, collapseAll,
    resetForm, handleEdit, handleSubmit, handleDelete, handleCreateDefaults,
    suggestCode, getParentName,
    addAccount, updateAccount, createDefaultAccounts,
  };
}
