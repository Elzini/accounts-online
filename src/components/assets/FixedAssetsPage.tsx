/**
 * Fixed Assets Page - Slim Orchestrator
 * Logic in useFixedAssetsPage hook. UI in sections/.
 */
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFixedAssetsPage } from './hooks/useFixedAssetsPage';
import { AssetsSummaryCards } from './sections/AssetsSummaryCards';
import { AssetsListTab } from './sections/AssetsListTab';
import { DepreciationLogTab } from './sections/DepreciationLogTab';
import { AssetFormDialog } from './sections/AssetFormDialog';

export function FixedAssetsPage() {
  const hook = useFixedAssetsPage();
  const {
    t, direction, isLoading,
    assets, summary, categories, depreciationEntries, assetAccounts, expenseAccounts,
    dialogOpen, setDialogOpen, depreciationDialogOpen, setDepreciationDialogOpen,
    disposeDialogOpen, setDisposeDialogOpen, editingAsset,
    formData, setFormData, depreciationPeriod, setDepreciationPeriod,
    disposeData, setDisposeData,
    createAsset, updateAsset, disposeAssetMut, calculateDepreciation,
    formatCurrency, getStatusLabel,
    openCreateDialog, openEditDialog, openDepreciationDialog, openDisposeDialog,
    handleSave, handleDelete, handleCalculateDepreciation, handleDispose,
  } = hook;

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 p-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">{t.fa_title}</h1><p className="text-muted-foreground">{t.fa_subtitle}</p></div>
        <Button onClick={openCreateDialog}><Plus className="w-4 h-4 ml-2" />{t.fa_add}</Button>
      </div>

      {summary && <AssetsSummaryCards summary={summary} formatCurrency={formatCurrency} t={t} />}

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">{t.fa_tab_assets}</TabsTrigger>
          <TabsTrigger value="depreciation">{t.fa_tab_depreciation}</TabsTrigger>
        </TabsList>
        <TabsContent value="assets">
          <AssetsListTab assets={assets} formatCurrency={formatCurrency} getStatusLabel={getStatusLabel} openEditDialog={openEditDialog} openDepreciationDialog={openDepreciationDialog} openDisposeDialog={openDisposeDialog} handleDelete={handleDelete} t={t} />
        </TabsContent>
        <TabsContent value="depreciation">
          <DepreciationLogTab entries={depreciationEntries} assets={assets} formatCurrency={formatCurrency} t={t} />
        </TabsContent>
      </Tabs>

      <AssetFormDialog
        open={dialogOpen} onOpenChange={setDialogOpen} editingAsset={editingAsset}
        formData={formData} setFormData={setFormData} categories={categories}
        assetAccounts={assetAccounts.map(a => ({ id: a.id, code: a.code, name: a.name }))}
        expenseAccounts={expenseAccounts.map(a => ({ id: a.id, code: a.code, name: a.name }))}
        onSave={handleSave} isSaving={createAsset.isPending || updateAsset.isPending}
        direction={direction} t={t}
      />

      {/* Depreciation Calculation Dialog */}
      <Dialog open={depreciationDialogOpen} onOpenChange={setDepreciationDialogOpen}>
        <DialogContent dir={direction}>
          <DialogHeader><DialogTitle>حساب الإهلاك</DialogTitle><DialogDescription>حدد فترة الإهلاك لحساب وتسجيل قيد الإهلاك</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>{t.fa_dep_col_period_start}</Label><Input type="date" value={depreciationPeriod.start} onChange={(e) => setDepreciationPeriod(prev => ({ ...prev, start: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{t.fa_dep_col_period_end}</Label><Input type="date" value={depreciationPeriod.end} onChange={(e) => setDepreciationPeriod(prev => ({ ...prev, end: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepreciationDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleCalculateDepreciation} disabled={calculateDepreciation.isPending}>حساب الإهلاك</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispose Asset Dialog */}
      <Dialog open={disposeDialogOpen} onOpenChange={setDisposeDialogOpen}>
        <DialogContent dir={direction}>
          <DialogHeader><DialogTitle>التخلص من الأصل</DialogTitle><DialogDescription>سجل عملية التخلص من الأصل (بيع أو إتلاف)</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>تاريخ التخلص</Label><Input type="date" value={disposeData.date} onChange={(e) => setDisposeData(prev => ({ ...prev, date: e.target.value }))} /></div>
            <div className="space-y-2"><Label>قيمة البيع/التخلص</Label><Input type="number" min="0" step="0.01" value={disposeData.value} onChange={(e) => setDisposeData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))} /></div>
            <div className="space-y-2"><Label>ملاحظات</Label><Textarea value={disposeData.notes} onChange={(e) => setDisposeData(prev => ({ ...prev, notes: e.target.value }))} placeholder="سبب التخلص..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisposeDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleDispose} disabled={disposeAssetMut.isPending} variant="destructive">تأكيد التخلص</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
