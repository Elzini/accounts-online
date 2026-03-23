/**
 * Companies Page - All Dialogs (Add, Edit, Delete, Details)
 */
import { Building2, Users, Car, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompanyAccountingSettings } from '@/components/super-admin/CompanyAccountingSettings';
import { ACTIVITY_TYPE_LABELS, type CompanyActivityType, type useCompaniesData } from './useCompaniesData';

type HookReturn = ReturnType<typeof useCompaniesData>;

interface CompanyDialogsProps {
  hook: HookReturn;
}

export function CompanyDialogs({ hook }: CompanyDialogsProps) {
  const {
    formData, setFormData, selectedCompany,
    addDialogOpen, setAddDialogOpen, editDialogOpen, setEditDialogOpen,
    deleteDialogOpen, setDeleteDialogOpen, detailsDialogOpen, setDetailsDialogOpen,
    accountingSettingsOpen, setAccountingSettingsOpen,
    addCompany, updateCompany, deleteCompany, getCompanyStats, formatDate,
  } = hook;

  const companyFormFields = (prefix: string) => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor={`${prefix}-name`}>اسم الشركة *</Label>
        <Input id={`${prefix}-name`} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="أدخل اسم الشركة" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${prefix}-company_type`}>نوع النشاط {prefix === 'add' ? '*' : ''}</Label>
        <Select value={formData.company_type} onValueChange={(v) => setFormData({ ...formData, company_type: v as CompanyActivityType })} disabled={prefix === 'edit'}>
          <SelectTrigger><SelectValue placeholder="اختر نوع النشاط" /></SelectTrigger>
          <SelectContent>{Object.entries(ACTIVITY_TYPE_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
        </Select>
        {prefix === 'edit' && <p className="text-xs text-muted-foreground">لا يمكن تغيير نوع النشاط بعد الإنشاء</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${prefix}-phone`}>الهاتف</Label>
        <Input id={`${prefix}-phone`} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="رقم الهاتف" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${prefix}-address`}>العنوان</Label>
        <Input id={`${prefix}-address`} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="عنوان الشركة" />
      </div>
      <div className="flex items-center gap-3">
        <Switch id={`${prefix}-is_active`} checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
        <Label htmlFor={`${prefix}-is_active`}>شركة نشطة</Label>
      </div>
    </div>
  );

  return (
    <>
      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader><DialogTitle>إضافة شركة جديدة</DialogTitle><DialogDescription>قم بإدخال بيانات الشركة الجديدة</DialogDescription></DialogHeader>
          {companyFormFields('add')}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>إلغاء</Button>
            <Button onClick={() => addCompany.mutate(formData)} disabled={!formData.name || addCompany.isPending}>{addCompany.isPending ? 'جاري الإضافة...' : 'إضافة الشركة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader><DialogTitle>تعديل الشركة</DialogTitle><DialogDescription>قم بتعديل بيانات الشركة</DialogDescription></DialogHeader>
          {companyFormFields('edit')}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>إلغاء</Button>
            <Button onClick={() => selectedCompany && updateCompany.mutate({ id: selectedCompany.id, data: formData })} disabled={!formData.name || updateCompany.isPending}>{updateCompany.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف شركة "{selectedCompany?.name}"؟<br />سيتم حذف جميع البيانات المرتبطة بها ولا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedCompany && deleteCompany.mutate(selectedCompany.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleteCompany.isPending ? 'جاري الحذف...' : 'حذف الشركة'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />تفاصيل الشركة</DialogTitle></DialogHeader>
          {selectedCompany && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground text-sm">اسم الشركة</Label><p className="font-semibold text-lg">{selectedCompany.name}</p></div>
                <div><Label className="text-muted-foreground text-sm">نوع النشاط</Label><p className="font-medium">{ACTIVITY_TYPE_LABELS[(selectedCompany.company_type || 'general_trading') as CompanyActivityType]}</p></div>
                <div><Label className="text-muted-foreground text-sm">الحالة</Label><div className="mt-1">{selectedCompany.is_active ? <Badge className="bg-success/10 text-success">نشط</Badge> : <Badge variant="secondary">غير نشط</Badge>}</div></div>
                <div><Label className="text-muted-foreground text-sm">الهاتف</Label><p className="font-medium">{selectedCompany.phone || '-'}</p></div>
                <div><Label className="text-muted-foreground text-sm">العنوان</Label><p className="font-medium">{selectedCompany.address || '-'}</p></div>
                <div><Label className="text-muted-foreground text-sm">تاريخ الإنشاء</Label><p className="font-medium">{formatDate(selectedCompany.created_at)}</p></div>
                <div><Label className="text-muted-foreground text-sm">آخر تحديث</Label><p className="font-medium">{formatDate(selectedCompany.updated_at)}</p></div>
              </div>
              <div className="border-t pt-4">
                <Label className="text-muted-foreground text-sm mb-3 block">إحصائيات الشركة</Label>
                <div className="grid grid-cols-4 gap-3">
                  {(() => {
                    const stats = getCompanyStats(selectedCompany.id);
                    return (<>
                      <div className="bg-muted/50 rounded-lg p-3 text-center"><Users className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{stats.users_count}</p><p className="text-xs text-muted-foreground">مستخدم</p></div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center"><Car className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{stats.cars_count}</p><p className="text-xs text-muted-foreground">سيارة</p></div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center"><DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{stats.sales_count}</p><p className="text-xs text-muted-foreground">مبيعة</p></div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center"><Users className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{stats.customers_count}</p><p className="text-xs text-muted-foreground">عميل</p></div>
                    </>);
                  })()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accounting Settings */}
      {selectedCompany && (
        <CompanyAccountingSettings companyId={selectedCompany.id} companyName={selectedCompany.name} open={accountingSettingsOpen} onOpenChange={setAccountingSettingsOpen} />
      )}
    </>
  );
}
