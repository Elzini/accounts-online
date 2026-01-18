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
import { useUpdateSale, useDeleteSale } from '@/hooks/useDatabase';
import { useTaxSettings } from '@/hooks/useAccounting';
import { InvoicePreviewDialog } from '@/components/invoices/InvoicePreviewDialog';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Sale = Database['public']['Tables']['sales']['Row'] & {
  car?: Database['public']['Tables']['cars']['Row'] | null;
  customer?: { name: string; phone?: string; address?: string; id_number?: string } | null;
};

interface EditSaleDialogProps {
  sale: Sale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSaleDialog({ sale, open, onOpenChange }: EditSaleDialogProps) {
  const [formData, setFormData] = useState({
    sale_price: sale.sale_price.toString(),
    seller_name: sale.seller_name || '',
    commission: (sale.commission || 0).toString(),
    other_expenses: (sale.other_expenses || 0).toString(),
    sale_date: sale.sale_date,
  });
  
  const updateSale = useUpdateSale();

  // Calculate profit
  const purchasePrice = Number(sale.car?.purchase_price || 0);
  const salePrice = parseFloat(formData.sale_price) || 0;
  const commission = parseFloat(formData.commission) || 0;
  const otherExpenses = parseFloat(formData.other_expenses) || 0;
  const profit = salePrice - purchasePrice - commission - otherExpenses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSale.mutateAsync({ 
        id: sale.id, 
        sale: {
          sale_price: parseFloat(formData.sale_price),
          seller_name: formData.seller_name || null,
          commission: parseFloat(formData.commission) || 0,
          other_expenses: parseFloat(formData.other_expenses) || 0,
          sale_date: formData.sale_date,
          profit: profit,
        }
      });
      toast.success('تم تحديث بيانات البيع بنجاح');
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
          <DialogTitle>تعديل بيانات البيع</DialogTitle>
          <DialogDescription>
            قم بتعديل بيانات عملية البيع ثم اضغط حفظ
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Car Info (read only) */}
            <div className="grid gap-2 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">السيارة</p>
              <p className="font-semibold">{sale.car?.name || '-'} - {sale.car?.model || ''}</p>
              <p className="text-sm">سعر الشراء: {formatCurrency(purchasePrice)} ريال</p>
            </div>

            {/* Customer Info (read only) */}
            <div className="grid gap-2 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">العميل</p>
              <p className="font-semibold">{sale.customer?.name || '-'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sale_price">سعر البيع</Label>
                <Input
                  id="sale_price"
                  type="number"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="seller_name">اسم البائع</Label>
                <Input
                  id="seller_name"
                  value={formData.seller_name}
                  onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="commission">العمولة</Label>
                <Input
                  id="commission"
                  type="number"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="other_expenses">مصاريف أخرى</Label>
                <Input
                  id="other_expenses"
                  type="number"
                  value={formData.other_expenses}
                  onChange={(e) => setFormData({ ...formData, other_expenses: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sale_date">تاريخ البيع</Label>
              <Input
                id="sale_date"
                type="date"
                value={formData.sale_date}
                onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                required
              />
            </div>
            
            {/* Profit display */}
            <div className={`p-3 rounded-lg ${profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <p className="text-sm text-muted-foreground">الربح المتوقع</p>
              <p className={`text-xl font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(profit)} ريال
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateSale.isPending}>
              {updateSale.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteSaleDialogProps {
  sale: Sale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSaleDialog({ sale, open, onOpenChange }: DeleteSaleDialogProps) {
  const deleteSale = useDeleteSale();

  const handleDelete = async () => {
    try {
      await deleteSale.mutateAsync({ saleId: sale.id, carId: sale.car_id });
      toast.success('تم حذف عملية البيع بنجاح');
      onOpenChange(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف عملية البيع');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد من حذف عملية البيع؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حذف عملية البيع رقم "{sale.sale_number}" وإعادة السيارة للمخزون. لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteSale.isPending ? 'جاري الحذف...' : 'حذف'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface SaleActionsProps {
  sale: Sale;
}

export function SaleActions({ sale }: SaleActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const { data: taxSettings } = useTaxSettings();

  // Calculate tax
  const taxRate = taxSettings?.is_active ? (taxSettings?.tax_rate || 0) : 0;
  const salePrice = Number(sale.sale_price);
  const taxAmount = salePrice * (taxRate / (100 + taxRate));
  const subtotal = salePrice - taxAmount;

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
    invoiceNumber: sale.sale_number,
    invoiceDate: sale.sale_date,
    invoiceType: 'sale' as const,
    sellerName: taxSettings?.company_name_ar || 'الشركة',
    sellerTaxNumber: taxSettings?.tax_number || '',
    sellerAddress: buildAddress(),
    buyerName: sale.customer?.name || 'عميل',
    buyerPhone: sale.customer?.phone,
    buyerAddress: sale.customer?.address,
    buyerIdNumber: sale.customer?.id_number,
    items: [
      {
        description: `${sale.car?.name || 'سيارة'} ${sale.car?.model || ''} - ${sale.car?.color || ''} - شاسيه: ${sale.car?.chassis_number || ''}`,
        quantity: 1,
        unitPrice: subtotal,
        taxRate: taxRate,
        total: salePrice,
      }
    ],
    subtotal,
    taxAmount,
    total: salePrice,
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
          title="عرض الفاتورة"
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
      <EditSaleDialog sale={sale} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteSaleDialog sale={sale} open={deleteOpen} onOpenChange={setDeleteOpen} />
      <InvoicePreviewDialog 
        open={invoiceOpen} 
        onOpenChange={setInvoiceOpen} 
        data={invoiceData}
      />
    </>
  );
}
