import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AccountSearchSelect } from '@/components/accounting/AccountSearchSelect';
import { type CreateAssetInput, type AssetCategory } from '@/hooks/useFixedAssets';

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editingAsset: any;
  formData: CreateAssetInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateAssetInput>>;
  categories: AssetCategory[];
  assetAccounts: { id: string; code: string; name: string }[];
  expenseAccounts: { id: string; code: string; name: string }[];
  onSave: () => void;
  isSaving: boolean;
  direction: string;
  t: any;
}

export function AssetFormDialog({ open, onOpenChange, editingAsset, formData, setFormData, categories, assetAccounts, expenseAccounts, onSave, isSaving, direction, t }: AssetFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={direction}>
        <DialogHeader>
          <DialogTitle>{editingAsset ? t.fa_add : t.fa_add}</DialogTitle>
          <DialogDescription>{t.fa_subtitle}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.fa_col_name} *</Label>
              <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder={t.fa_col_name} />
            </div>
            <div className="space-y-2">
              <Label>{t.fa_col_category}</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                <SelectTrigger><SelectValue placeholder={t.fa_col_category} /></SelectTrigger>
                <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.fa_col_purchase_date} *</Label>
              <Input type="date" value={formData.purchase_date} onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t.fa_col_purchase_price} *</Label>
              <Input type="number" min="0" step="0.01" value={formData.purchase_price} onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>القيمة التخريدية</Label>
              <Input type="number" min="0" step="0.01" value={formData.salvage_value} onChange={(e) => setFormData(prev => ({ ...prev, salvage_value: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label>العمر الإنتاجي (سنوات) *</Label>
              <Input type="number" min="1" value={formData.useful_life_years} onChange={(e) => setFormData(prev => ({ ...prev, useful_life_years: parseInt(e.target.value) || 1 }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>طريقة الإهلاك</Label>
              <Select value={formData.depreciation_method} onValueChange={(v) => setFormData(prev => ({ ...prev, depreciation_method: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر طريقة الإهلاك" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight_line">{t.fa_method_straight}</SelectItem>
                  <SelectItem value="declining_balance">{t.fa_method_declining}</SelectItem>
                  <SelectItem value="units_of_production">{t.fa_method_units}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الرقم التسلسلي</Label>
              <Input value={formData.serial_number} onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))} placeholder="اختياري" />
            </div>
          </div>
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium text-sm mb-4 text-muted-foreground">الحسابات المحاسبية</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>حساب الأصل الثابت *</Label>
                <AccountSearchSelect accounts={assetAccounts} value={formData.account_category_id || ''} onChange={(v) => setFormData(prev => ({ ...prev, account_category_id: v }))} placeholder="اختر حساب الأصل" />
                <p className="text-xs text-muted-foreground">الحساب الذي سيُقيد فيه الأصل</p>
              </div>
              <div className="space-y-2">
                <Label>حساب مصروف الإهلاك</Label>
                <AccountSearchSelect accounts={expenseAccounts} value={formData.depreciation_account_id || ''} onChange={(v) => setFormData(prev => ({ ...prev, depreciation_account_id: v }))} placeholder="اختر حساب مصروف الإهلاك" />
                <p className="text-xs text-muted-foreground">حساب المصروفات للإهلاك الدوري</p>
              </div>
              <div className="space-y-2">
                <Label>حساب الإهلاك المتراكم</Label>
                <AccountSearchSelect accounts={assetAccounts} value={formData.accumulated_depreciation_account_id || ''} onChange={(v) => setFormData(prev => ({ ...prev, accumulated_depreciation_account_id: v }))} placeholder="اختر حساب الإهلاك المتراكم" />
                <p className="text-xs text-muted-foreground">حساب مجمع الإهلاك</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
          <Button onClick={onSave} disabled={isSaving}>{editingAsset ? t.save : t.add}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
