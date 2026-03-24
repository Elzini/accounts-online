import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  projects: any[];
  isPending: boolean;
}

export function ContractFormDialog({ open, onOpenChange, isEditing, formData, setFormData, onSubmit, onClose, projects, isPending }: ContractFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل العقد' : 'إضافة عقد جديد'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>عنوان العقد *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>نوع العقد</Label>
              <Select value={formData.contract_type} onValueChange={(value) => setFormData({ ...formData, contract_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">عقد رئيسي</SelectItem>
                  <SelectItem value="subcontract">عقد باطن</SelectItem>
                  <SelectItem value="supply">عقد توريد</SelectItem>
                  <SelectItem value="service">عقد خدمات</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>المشروع</Label>
            <Select value={formData.project_id || 'none'} onValueChange={(value) => setFormData({ ...formData, project_id: value === 'none' ? '' : value })}>
              <SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون مشروع</SelectItem>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>{project.project_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المقاول/المورد</Label>
              <Input value={formData.contractor_name} onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input value={formData.contractor_phone} onChange={(e) => setFormData({ ...formData, contractor_phone: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>قيمة العقد (ر.س)</Label>
              <Input type="number" value={formData.contract_value} onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الدفعة المقدمة</Label>
              <Input type="number" value={formData.advance_payment} onChange={(e) => setFormData({ ...formData, advance_payment: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>نسبة الضمان %</Label>
              <Input type="number" value={formData.retention_percentage} onChange={(e) => setFormData({ ...formData, retention_percentage: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>تاريخ البدء</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الانتهاء</Label>
              <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="suspended">موقوف</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="terminated">منتهي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>شروط الدفع</Label>
            <Textarea value={formData.payment_terms} onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={isPending}>{isEditing ? 'تحديث' : 'إضافة'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
