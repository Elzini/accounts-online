import { useState } from 'react';
import { Pencil, Trash2, FileText, BookOpen, RotateCcw, RefreshCw } from 'lucide-react';
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
import { useUpdateSale, useDeleteSale, useReverseSale } from '@/hooks/useDatabase';
import { useTaxSettings, useJournalEntries } from '@/hooks/useAccounting';
import { useCompany } from '@/contexts/CompanyContext';
import { InvoicePreviewDialog } from '@/components/invoices/InvoicePreviewDialog';
import { PaymentAccountSelector } from '@/components/forms/PaymentAccountSelector';
import { JournalEntryEditDialog } from '@/components/accounting/JournalEntryEditDialog';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type SaleItem = {
  id: string;
  car_id: string;
  sale_price: number;
  profit: number;
  car?: Database['public']['Tables']['cars']['Row'] | null;
};

type Sale = Database['public']['Tables']['sales']['Row'] & {
  car?: Database['public']['Tables']['cars']['Row'] | null;
  customer?: { name: string; phone?: string; address?: string; id_number?: string; registration_number?: string } | null;
  sale_items?: SaleItem[] | null;
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
    payment_account_id: sale.payment_account_id || '',
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
          payment_account_id: formData.payment_account_id || null,
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
            <div className="grid grid-cols-2 gap-4">
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
              <PaymentAccountSelector
                value={formData.payment_account_id}
                onChange={(v) => setFormData({ ...formData, payment_account_id: v })}
                label="طريقة الاستلام"
                type="receipt"
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

interface ReverseSaleDialogProps {
  sale: Sale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReverseSaleDialog({ sale, open, onOpenChange }: ReverseSaleDialogProps) {
  const reverseSale = useReverseSale();

  const handleReverse = async () => {
    try {
      await reverseSale.mutateAsync(sale.id);
      toast.success('تم إرجاع الفاتورة بنجاح وإعادة السيارات للمخزون');
      onOpenChange(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء إرجاع الفاتورة');
    }
  };

  const saleItems = sale.sale_items || [];
  const carCount = saleItems.length > 0 ? saleItems.length : 1;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-500" />
            إرجاع الفاتورة رقم {sale.sale_number}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>هل أنت متأكد من إرجاع هذه الفاتورة؟</p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>سيتم إعادة {carCount > 1 ? `${carCount} سيارات` : 'السيارة'} للمخزون</li>
              <li>سيتم حذف القيد المحاسبي المرتبط بالمبيعة</li>
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
            {reverseSale.isPending ? 'جاري الإرجاع...' : 'إرجاع الفاتورة'}
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
  const [journalEntryOpen, setJournalEntryOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const { data: taxSettings } = useTaxSettings();
  const { data: journalEntries = [] } = useJournalEntries();
  const { company } = useCompany();

  // Find journal entry for this sale
  const saleJournalEntry = journalEntries.find(
    e => e.reference_type === 'sale' && e.reference_id === sale.id
  );

  // Calculate tax - use sale_items for multi-car sales
  const taxRate = taxSettings?.is_active ? (taxSettings?.tax_rate || 0) : 0;
  
  // Build address string
  const buildAddress = () => {
    const parts = [];
    if (taxSettings?.building_number) parts.push(`مبنى ${taxSettings.building_number}`);
    if (taxSettings?.national_address) parts.push(taxSettings.national_address);
    if (taxSettings?.city) parts.push(taxSettings.city);
    if (taxSettings?.postal_code) parts.push(`ص.ب ${taxSettings.postal_code}`);
    return parts.length > 0 ? parts.join('، ') : 'المملكة العربية السعودية';
  };

  // Build invoice items and calculate totals from sale_items if available (multi-car sale)
  const buildInvoiceData = () => {
    if (sale.sale_items && sale.sale_items.length > 0) {
      // Multi-car sale: build from sale_items
      const items = sale.sale_items.map(item => {
        const itemPrice = Number(item.sale_price);
        const itemTaxAmount = itemPrice * (taxRate / (100 + taxRate));
        const itemSubtotal = itemPrice - itemTaxAmount;
        return {
          description: `${item.car?.name || 'سيارة'} ${item.car?.model || ''} - ${item.car?.color || ''} - شاسيه: ${item.car?.chassis_number || ''}`,
          quantity: 1,
          unitPrice: itemSubtotal,
          taxRate: taxRate,
          taxAmount: itemTaxAmount,
          total: itemPrice,
        };
      });
      
      const totalPrice = items.reduce((sum, item) => sum + item.total, 0);
      const totalTax = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
      const totalSubtotal = totalPrice - totalTax;
      
      return { items, subtotal: totalSubtotal, taxAmount: totalTax, total: totalPrice };
    } else {
      // Single car sale
      const salePrice = Number(sale.sale_price);
      const taxAmount = salePrice * (taxRate / (100 + taxRate));
      const subtotal = salePrice - taxAmount;
      
      return {
        items: [{
          description: `${sale.car?.name || 'سيارة'} ${sale.car?.model || ''} - ${sale.car?.color || ''} - شاسيه: ${sale.car?.chassis_number || ''}`,
          quantity: 1,
          unitPrice: subtotal,
          taxRate: taxRate,
          total: salePrice,
        }],
        subtotal,
        taxAmount,
        total: salePrice,
      };
    }
  };

  const invoiceCalcs = buildInvoiceData();

  // Get invoice settings from company
  const invoiceSettings = (company as any)?.invoice_settings || null;
  const invoiceLogoUrl = (company as any)?.invoice_logo_url || company?.logo_url;

  const invoiceData = {
    invoiceNumber: sale.sale_number,
    invoiceDate: sale.sale_date,
    invoiceType: 'sale' as const,
    sellerName: taxSettings?.company_name_ar || company?.name || 'الشركة',
    sellerTaxNumber: taxSettings?.tax_number || '',
    sellerAddress: buildAddress(),
    buyerName: sale.customer?.name || 'عميل',
    buyerPhone: sale.customer?.phone,
    buyerAddress: sale.customer?.address,
    buyerIdNumber: sale.customer?.id_number,
    buyerTaxNumber: sale.customer?.registration_number,
    items: invoiceCalcs.items,
    subtotal: invoiceCalcs.subtotal,
    taxAmount: invoiceCalcs.taxAmount,
    total: invoiceCalcs.total,
    taxSettings,
    companyLogoUrl: invoiceLogoUrl,
    invoiceSettings,
    voucherNumber: sale.sale_number,
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {saleJournalEntry && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setJournalEntryOpen(true)}
                  className="h-8 w-8 text-primary"
                  title="القيد المحاسبي"
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>عرض / تعديل القيد المحاسبي</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInvoiceOpen(true)}
                className="h-8 w-8 text-success"
                title="عرض الفاتورة"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>طباعة الفاتورة</p>
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
              <p>تعديل الفاتورة</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReverseOpen(true)}
                className="h-8 w-8 text-orange-500 hover:text-orange-600"
                title="إرجاع"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>إرجاع الفاتورة</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
              <p>حذف الفاتورة</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <EditSaleDialog sale={sale} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteSaleDialog sale={sale} open={deleteOpen} onOpenChange={setDeleteOpen} />
      <ReverseSaleDialog sale={sale} open={reverseOpen} onOpenChange={setReverseOpen} />
      <InvoicePreviewDialog 
        open={invoiceOpen} 
        onOpenChange={setInvoiceOpen} 
        data={invoiceData}
      />
      <JournalEntryEditDialog
        entryId={saleJournalEntry?.id || null}
        open={journalEntryOpen}
        onOpenChange={setJournalEntryOpen}
        title="القيد المحاسبي للمبيعة"
        referenceType="sale"
      />
    </>
  );
}
