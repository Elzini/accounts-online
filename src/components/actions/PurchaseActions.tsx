import { useState } from 'react';
import { Pencil, Trash2, FileText, RotateCcw } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateCar, useDeleteCar } from '@/hooks/useDatabase';
import { useTaxSettings } from '@/hooks/useAccounting';
import { useCompany } from '@/contexts/CompanyContext';
import { PurchaseInvoiceDialog } from '@/components/invoices/PurchaseInvoiceDialog';
import { PaymentAccountSelector } from '@/components/forms/PaymentAccountSelector';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Car = Database['public']['Tables']['cars']['Row'] & {
  supplier?: { name: string; phone?: string; address?: string; tax_number?: string } | null;
};

interface EditPurchaseDialogProps {
  car: Car;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPurchaseDialog({ car, open, onOpenChange }: EditPurchaseDialogProps) {
  const [formData, setFormData] = useState({
    name: car.name,
    model: car.model || '',
    chassis_number: car.chassis_number,
    color: car.color || '',
    purchase_price: car.purchase_price.toString(),
    purchase_date: car.purchase_date,
    payment_account_id: car.payment_account_id || '',
  });
  
  const updateCar = useUpdateCar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCar.mutateAsync({ 
        id: car.id, 
        car: {
          name: formData.name,
          model: formData.model || null,
          chassis_number: formData.chassis_number,
          color: formData.color || null,
          purchase_price: parseFloat(formData.purchase_price),
          purchase_date: formData.purchase_date,
          payment_account_id: formData.payment_account_id || null,
        }
      });
      toast.success('تم تحديث بيانات المشتريات بنجاح');
      onOpenChange(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث البيانات');
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('ar-SA').format(value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل بيانات الشراء</DialogTitle>
          <DialogDescription>
            قم بتعديل بيانات عملية الشراء ثم اضغط حفظ
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
                <Label htmlFor="chassis_number">رقم الهيكل</Label>
                <Input
                  id="chassis_number"
                  value={formData.chassis_number}
                  onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">اللون</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
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
            <PaymentAccountSelector
              value={formData.payment_account_id}
              onChange={(v) => setFormData({ ...formData, payment_account_id: v })}
              label="طريقة الدفع"
              type="payment"
            />

            {/* Supplier Info (read only) */}
            {car.supplier && (
              <div className="grid gap-2 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">المورد</p>
                <p className="font-semibold">{car.supplier.name}</p>
              </div>
            )}
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

interface DeletePurchaseDialogProps {
  car: Car;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletePurchaseDialog({ car, open, onOpenChange }: DeletePurchaseDialogProps) {
  const deleteCar = useDeleteCar();

  const handleDelete = async () => {
    try {
      await deleteCar.mutateAsync(car.id);
      toast.success('تم حذف عملية الشراء بنجاح');
      onOpenChange(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف عملية الشراء');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد من حذف عملية الشراء؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حذف السيارة "{car.name}" من المخزون. لا يمكن التراجع عن هذا الإجراء.
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

interface ReversePurchaseDialogProps {
  car: Car;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReversePurchaseDialog({ car, open, onOpenChange }: ReversePurchaseDialogProps) {
  const deleteCar = useDeleteCar();

  const handleReverse = async () => {
    try {
      await deleteCar.mutateAsync(car.id);
      toast.success('تم إرجاع فاتورة الشراء بنجاح وحذف السيارة من المخزون');
      onOpenChange(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء إرجاع فاتورة الشراء');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-500" />
            إرجاع فاتورة الشراء
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>هل أنت متأكد من إرجاع هذه الفاتورة؟</p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>سيتم حذف السيارة "{car.name}" من المخزون</li>
              <li>سيتم حذف القيد المحاسبي المرتبط بالمشتريات</li>
              <li>سيتم تحديث الإحصائيات والتقارير</li>
            </ul>
            <p className="text-destructive font-medium">لا يمكن التراجع عن هذا الإجراء.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReverse}
            className="bg-orange-600 text-white hover:bg-orange-700"
          >
            {deleteCar.isPending ? 'جاري الإرجاع...' : 'إرجاع الفاتورة'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface PurchaseActionsProps {
  car: Car;
}

export function PurchaseActions({ car }: PurchaseActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const { data: taxSettings } = useTaxSettings();
  const { company } = useCompany();

  // Calculate tax
  const taxRate = taxSettings?.is_active ? (taxSettings?.tax_rate || 0) : 0;
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
    supplierName: car.supplier?.name || 'مورد',
    supplierTaxNumber: car.supplier?.tax_number,
    supplierPhone: car.supplier?.phone,
    supplierAddress: car.supplier?.address,
    companyName: taxSettings?.company_name_ar || company?.name || 'الشركة',
    companyTaxNumber: taxSettings?.tax_number || '',
    companyAddress: buildAddress(),
    items: [{
      description: `${car.name} ${car.model || ''} - ${car.color || ''} - شاسيه: ${car.chassis_number}`,
      quantity: 1,
      unitPrice: subtotal,
      taxRate: taxRate,
      total: purchasePrice,
    }],
    subtotal,
    taxAmount,
    total: purchasePrice,
    taxSettings,
    companyLogoUrl: (company as any)?.invoice_logo_url || company?.logo_url,
  };

  // Check if car is sold - can't delete sold cars
  const isSold = car.status === 'sold';

  return (
    <>
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInvoiceOpen(true)}
                className="h-8 w-8 text-blue-600"
                title="عرض الفاتورة"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>طباعة فاتورة الشراء</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="تعديل"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>تعديل المشتريات</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {!isSold && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setReverseOpen(true)}
                  className="h-8 w-8 text-orange-500 hover:text-orange-600"
                  title="إرجاع الفاتورة"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>إرجاع فاتورة الشراء</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {!isSold && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteOpen(true)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>حذف المشتريات</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <EditPurchaseDialog car={car} open={editOpen} onOpenChange={setEditOpen} />
      <DeletePurchaseDialog car={car} open={deleteOpen} onOpenChange={setDeleteOpen} />
      <ReversePurchaseDialog car={car} open={reverseOpen} onOpenChange={setReverseOpen} />
      <PurchaseInvoiceDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} data={invoiceData} />
    </>
  );
}
