import { useState } from 'react';
import { Pencil, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateCar, useDeleteCar, useSuppliers } from '@/hooks/useDatabase';
import { useTaxSettings, useAccounts } from '@/hooks/useAccounting';
import { InvoicePreviewDialog } from '@/components/invoices/InvoicePreviewDialog';
import { PaymentAccountSelector } from '@/components/forms/PaymentAccountSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Car = Database['public']['Tables']['cars']['Row'] & {
  supplier?: { name: string; phone?: string; address?: string } | null;
};

interface EditCarDialogProps {
  car: Car;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCarDialog({ car, open, onOpenChange }: EditCarDialogProps) {
  const { data: suppliers = [] } = useSuppliers();
  const [formData, setFormData] = useState({
    name: car.name,
    model: car.model || '',
    color: car.color || '',
    chassis_number: car.chassis_number,
    purchase_price: car.purchase_price.toString(),
    purchase_date: car.purchase_date,
    supplier_id: car.supplier_id || '',
    payment_account_id: car.payment_account_id || '',
  });
  
  const updateCar = useUpdateCar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCar.mutateAsync({ 
        id: car.id, 
        car: {
          ...formData,
          purchase_price: parseFloat(formData.purchase_price),
          supplier_id: formData.supplier_id || null,
          payment_account_id: formData.payment_account_id || null,
        }
      });
      toast.success('تم تحديث بيانات السيارة بنجاح');
      onOpenChange(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث البيانات');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل بيانات السيارة</DialogTitle>
          <DialogDescription>
            قم بتعديل بيانات السيارة ثم اضغط حفظ
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">اسم السيارة</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">الموديل</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="color">اللون</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="chassis_number">رقم الهيكل</Label>
                <Input
                  id="chassis_number"
                  value={formData.chassis_number}
                  onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchase_price">سعر الشراء</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchase_date">تاريخ الشراء</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="supplier">المورد</Label>
                <Select 
                  value={formData.supplier_id} 
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <PaymentAccountSelector
                value={formData.payment_account_id}
                onChange={(v) => setFormData({ ...formData, payment_account_id: v })}
                label="طريقة الدفع"
                type="payment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateCar.isPending}>
              {updateCar.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteCarDialogProps {
  car: Car;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCarDialog({ car, open, onOpenChange }: DeleteCarDialogProps) {
  const deleteCar = useDeleteCar();

  const handleDelete = async () => {
    try {
      await deleteCar.mutateAsync(car.id);
      toast.success('تم حذف السيارة بنجاح');
      onOpenChange(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف السيارة. قد تكون مرتبطة بعملية بيع.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد من حذف السيارة؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حذف السيارة "{car.name}" نهائياً. لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteCar.isPending ? 'جاري الحذف...' : 'حذف'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface CarActionsProps {
  car: Car;
}

export function CarActions({ car }: CarActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const { data: taxSettings } = useTaxSettings();

  // Calculate tax for purchase
  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_purchases ? (taxSettings?.tax_rate || 0) : 0;
  const purchasePrice = Number(car.purchase_price);
  const taxAmount = purchasePrice * (taxRate / (100 + taxRate));
  const subtotal = purchasePrice - taxAmount;

  // Build address string
  const buildAddress = () => {
    const parts = [];
    if (taxSettings?.building_number) parts.push(`مبنى ${taxSettings.building_number}`);
    if (taxSettings?.national_address) parts.push(taxSettings.national_address);
    if (taxSettings?.city) parts.push(taxSettings.city);
    if (taxSettings?.postal_code) parts.push(`ص.ب ${taxSettings.postal_code}`);
    return parts.length > 0 ? parts.join('، ') : 'المملكة العربية السعودية';
  };

  const invoiceData = {
    invoiceNumber: car.inventory_number,
    invoiceDate: car.purchase_date,
    invoiceType: 'purchase' as const,
    sellerName: car.supplier?.name || 'مورد',
    sellerTaxNumber: '',
    sellerAddress: car.supplier?.address || '',
    buyerName: taxSettings?.company_name_ar || 'الشركة',
    buyerPhone: '',
    buyerAddress: buildAddress(),
    items: [
      {
        description: `${car.name} ${car.model || ''} - ${car.color || ''} - شاسيه: ${car.chassis_number}`,
        quantity: 1,
        unitPrice: subtotal,
        taxRate: taxRate,
        total: purchasePrice,
      }
    ],
    subtotal,
    taxAmount,
    total: purchasePrice,
    taxSettings,
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setInvoiceOpen(true)}
          className="h-8 w-8 text-primary hover:text-primary"
          title="عرض فاتورة الشراء"
        >
          <FileText className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditOpen(true)}
          className="h-8 w-8"
          title="تعديل"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteOpen(true)}
          className="h-8 w-8 text-destructive hover:text-destructive"
          title="حذف"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <EditCarDialog car={car} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteCarDialog car={car} open={deleteOpen} onOpenChange={setDeleteOpen} />
      <InvoicePreviewDialog 
        open={invoiceOpen} 
        onOpenChange={setInvoiceOpen} 
        data={invoiceData}
      />
    </>
  );
}
