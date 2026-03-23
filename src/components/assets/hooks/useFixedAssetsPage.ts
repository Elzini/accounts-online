/**
 * Fixed Assets Page - Logic Hook
 * Extracted from FixedAssetsPage.tsx (772 lines)
 */
import { useState, useMemo } from 'react';
import { isAccountType } from '@/utils/accountTypes';
import {
  useFixedAssets,
  useCreateFixedAsset,
  useUpdateFixedAsset,
  useDeleteFixedAsset,
  useDisposeAsset,
  useCalculateDepreciation,
  useDepreciationEntries,
  useAssetsSummary,
  useAssetCategories,
  type FixedAsset,
  type CreateAssetInput,
} from '@/hooks/useFixedAssets';
import { useAccounts } from '@/hooks/useAccounting';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const emptyFormData: CreateAssetInput = {
  name: '', description: '', category: '',
  purchase_date: new Date().toISOString().split('T')[0],
  purchase_price: 0, salvage_value: 0, useful_life_years: 5,
  depreciation_method: 'straight_line', location: '', serial_number: '',
  notes: '', account_category_id: '', depreciation_account_id: '',
  accumulated_depreciation_account_id: '',
};

export function useFixedAssetsPage() {
  const { t, language, direction } = useLanguage();
  const { data: assets = [], isLoading } = useFixedAssets();
  const { data: summary } = useAssetsSummary();
  const { data: categories = [] } = useAssetCategories();
  const { data: depreciationEntries = [] } = useDepreciationEntries();
  const { data: accounts = [] } = useAccounts();

  const assetAccounts = useMemo(() =>
    accounts.filter(acc => isAccountType(acc.type, 'asset') && acc.code.startsWith('13')), [accounts]);
  const expenseAccounts = useMemo(() =>
    accounts.filter(acc => isAccountType(acc.type, 'expense')), [accounts]);

  const createAsset = useCreateFixedAsset();
  const updateAsset = useUpdateFixedAsset();
  const deleteAsset = useDeleteFixedAsset();
  const disposeAssetMut = useDisposeAsset();
  const calculateDepreciation = useCalculateDepreciation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [depreciationDialogOpen, setDepreciationDialogOpen] = useState(false);
  const [disposeDialogOpen, setDisposeDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateAssetInput>({ ...emptyFormData });
  const [depreciationPeriod, setDepreciationPeriod] = useState({ start: '', end: '' });
  const [disposeData, setDisposeData] = useState({ date: new Date().toISOString().split('T')[0], value: 0, notes: '' });

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: t.fa_status_active, disposed: t.fa_status_disposed,
      fully_depreciated: t.fa_status_fully_dep, under_maintenance: t.fa_status_maintenance,
    };
    return labels[status] || status;
  };

  const getMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      straight_line: t.fa_method_straight, declining_balance: t.fa_method_declining,
      units_of_production: t.fa_method_units,
    };
    return methods[method] || method;
  };

  const openCreateDialog = () => {
    setEditingAsset(null);
    setFormData({ ...emptyFormData });
    setDialogOpen(true);
  };

  const openEditDialog = (asset: FixedAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name, description: asset.description || '', category: asset.category || '',
      purchase_date: asset.purchase_date, purchase_price: asset.purchase_price,
      salvage_value: asset.salvage_value, useful_life_years: asset.useful_life_years,
      depreciation_method: asset.depreciation_method, depreciation_rate: asset.depreciation_rate,
      location: asset.location || '', serial_number: asset.serial_number || '', notes: asset.notes || '',
      account_category_id: asset.account_category_id || '',
      depreciation_account_id: asset.depreciation_account_id || '',
      accumulated_depreciation_account_id: asset.accumulated_depreciation_account_id || '',
    });
    setDialogOpen(true);
  };

  const openDepreciationDialog = (assetId: string) => {
    setSelectedAssetId(assetId);
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDepreciationPeriod({ start: firstDay.toISOString().split('T')[0], end: lastDay.toISOString().split('T')[0] });
    setDepreciationDialogOpen(true);
  };

  const openDisposeDialog = (asset: FixedAsset) => {
    setSelectedAssetId(asset.id);
    setDisposeData({
      date: new Date().toISOString().split('T')[0],
      value: asset.current_value || (asset.purchase_price - asset.accumulated_depreciation),
      notes: '',
    });
    setDisposeDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.purchase_price || !formData.useful_life_years) {
      toast.error(t.fa_toast_required); return;
    }
    try {
      if (editingAsset) await updateAsset.mutateAsync({ id: editingAsset.id, updates: formData });
      else await createAsset.mutateAsync(formData);
      setDialogOpen(false);
    } catch (error) { console.error('Error saving asset:', error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.fa_toast_confirm_delete)) return;
    try { await deleteAsset.mutateAsync(id); } catch (error) { console.error('Error deleting asset:', error); }
  };

  const handleCalculateDepreciation = async () => {
    if (!selectedAssetId || !depreciationPeriod.start || !depreciationPeriod.end) {
      toast.error(t.fa_toast_required); return;
    }
    try {
      await calculateDepreciation.mutateAsync({ assetId: selectedAssetId, periodStart: depreciationPeriod.start, periodEnd: depreciationPeriod.end });
      setDepreciationDialogOpen(false);
    } catch (error) { console.error('Error calculating depreciation:', error); }
  };

  const handleDispose = async () => {
    if (!selectedAssetId) return;
    try {
      await disposeAssetMut.mutateAsync({ id: selectedAssetId, disposalDate: disposeData.date, disposalValue: disposeData.value, notes: disposeData.notes });
      setDisposeDialogOpen(false);
    } catch (error) { console.error('Error disposing asset:', error); }
  };

  return {
    t, language, direction, isLoading,
    assets, summary, categories, depreciationEntries, assetAccounts, expenseAccounts,
    dialogOpen, setDialogOpen, depreciationDialogOpen, setDepreciationDialogOpen,
    disposeDialogOpen, setDisposeDialogOpen, editingAsset,
    formData, setFormData, depreciationPeriod, setDepreciationPeriod,
    disposeData, setDisposeData,
    createAsset, updateAsset, disposeAssetMut, calculateDepreciation,
    formatCurrency, getStatusLabel, getMethodLabel,
    openCreateDialog, openEditDialog, openDepreciationDialog, openDisposeDialog,
    handleSave, handleDelete, handleCalculateDepreciation, handleDispose,
  };
}
