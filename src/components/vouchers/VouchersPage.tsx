import { useState, useMemo } from 'react';
import { Plus, Receipt, CreditCard, Trash2, Loader2, Printer, BookOpen, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useVouchers, useReceiptVouchers, usePaymentVouchers, useAddVoucher, useDeleteVoucher } from '@/hooks/useVouchers';
import { useCompany } from '@/contexts/CompanyContext';
import { useJournalEntries } from '@/hooks/useAccounting';
import { Voucher } from '@/services/vouchers';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { JournalEntryEditDialog } from '@/components/accounting/JournalEntryEditDialog';
import { useLanguage } from '@/contexts/LanguageContext';

export function VouchersPage() {
  const { t, language } = useLanguage();
  const { companyId } = useCompany();
  const { data: allVouchers = [], isLoading } = useVouchers();
  const { data: journalEntries = [] } = useJournalEntries();
  const { filterByFiscalYear } = useFiscalYearFilter();
  const [editingJournalEntryId, setEditingJournalEntryId] = useState<string | null>(null);
  const addVoucher = useAddVoucher();
  const deleteVoucher = useDeleteVoucher();
  
  const getJournalEntryNumber = (journalEntryId: string | null) => {
    if (!journalEntryId) return null;
    const entry = journalEntries.find(e => e.id === journalEntryId);
    return entry?.entry_number || null;
  };
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    voucher_type: 'receipt' as 'receipt' | 'payment',
    amount: '',
    description: '',
    voucher_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    related_to: ''
  });

  const filteredVouchers = useMemo(() => {
    return filterByFiscalYear(allVouchers, 'voucher_date');
  }, [allVouchers, filterByFiscalYear]);

  const receiptVouchers = filteredVouchers.filter(v => v.voucher_type === 'receipt');
  const paymentVouchers = filteredVouchers.filter(v => v.voucher_type === 'payment');

  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';
  const currencyCode = language === 'ar' ? 'SAR' : 'SAR';

  const handleSubmit = async () => {
    if (!form.amount || !form.description) {
      toast.error(t.voucher_fill_required);
      return;
    }

    try {
      await addVoucher.mutateAsync({
        company_id: companyId!,
        voucher_type: form.voucher_type,
        amount: parseFloat(form.amount),
        description: form.description,
        voucher_date: form.voucher_date,
        payment_method: form.payment_method,
        related_to: form.related_to || null,
        related_id: null,
        created_by: null
      });
      toast.success(t.voucher_created_success);
      setIsDialogOpen(false);
      setForm({
        voucher_type: 'receipt',
        amount: '',
        description: '',
        voucher_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        related_to: ''
      });
    } catch (error) {
      toast.error(t.voucher_create_error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.voucher_delete_confirm)) return;
    try {
      await deleteVoucher.mutateAsync(id);
      toast.success(t.voucher_deleted);
    } catch (error) {
      toast.error(t.voucher_delete_error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(amount);
  };

  const paymentMethodLabel = (method: string) => {
    const map: Record<string, string> = {
      cash: language === 'ar' ? 'نقداً' : 'Cash',
      bank: language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer',
      card: language === 'ar' ? 'بطاقة' : 'Card',
      check: language === 'ar' ? 'شيك' : 'Check',
    };
    return map[method] || method;
  };

  const totalReceipts = receiptVouchers.reduce((sum, v) => sum + Number(v.amount), 0);
  const totalPayments = paymentVouchers.reduce((sum, v) => sum + Number(v.amount), 0);

  const VoucherTable = ({ vouchers, type }: { vouchers: Voucher[], type: 'receipt' | 'payment' }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.voucher_number}</TableHead>
          <TableHead>{t.date}</TableHead>
          <TableHead>{t.voucher_description}</TableHead>
          <TableHead>{t.voucher_payment_method}</TableHead>
          <TableHead>{t.amount}</TableHead>
          <TableHead>{t.voucher_journal_number}</TableHead>
          <TableHead>{t.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vouchers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              {t.voucher_no_vouchers}
            </TableCell>
          </TableRow>
        ) : (
          vouchers.map((voucher) => {
            const journalEntryNum = getJournalEntryNumber(voucher.journal_entry_id);
            return (
              <TableRow key={voucher.id}>
                <TableCell className="font-mono">
                  {type === 'receipt' ? (language === 'ar' ? 'ق' : 'R') : (language === 'ar' ? 'ص' : 'P')}-{voucher.voucher_number}
                </TableCell>
                <TableCell>{new Date(voucher.voucher_date).toLocaleDateString(locale)}</TableCell>
                <TableCell>{voucher.description}</TableCell>
                <TableCell>{paymentMethodLabel(voucher.payment_method)}</TableCell>
                <TableCell className={`font-semibold ${type === 'receipt' ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(Number(voucher.amount))}
                </TableCell>
                <TableCell>
                  {voucher.journal_entry_id ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1 h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingJournalEntryId(voucher.journal_entry_id);
                            }}
                          >
                            <BookOpen className="w-3 h-3" />
                            {journalEntryNum}
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t.voucher_view_edit_entry}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => window.print()}>
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(voucher.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.voucher_total_receipts}</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceipts)}</p>
              </div>
              <Receipt className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.voucher_total_payments}</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalPayments)}</p>
              </div>
              <CreditCard className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.voucher_net}</p>
                <p className={`text-2xl font-bold ${totalReceipts - totalPayments >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(totalReceipts - totalPayments)}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm({...form, voucher_type: 'receipt'})}>
              <Plus className="w-4 h-4 ml-2" /> {t.voucher_add_receipt}
            </Button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setForm({...form, voucher_type: 'payment'})}>
              <Plus className="w-4 h-4 ml-2" /> {t.voucher_add_payment}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {form.voucher_type === 'receipt' ? t.voucher_new_receipt : t.voucher_new_payment}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t.voucher_type}</Label>
                <Select 
                  value={form.voucher_type} 
                  onValueChange={(v) => setForm({...form, voucher_type: v as 'receipt' | 'payment'})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt">{t.voucher_type_receipt}</SelectItem>
                    <SelectItem value="payment">{t.voucher_type_payment}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t.voucher_amount_required}</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({...form, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>{t.voucher_description_label}</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder={form.voucher_type === 'receipt' 
                    ? t.voucher_receipt_placeholder
                    : t.voucher_payment_placeholder
                  }
                />
              </div>
              <div>
                <Label>{t.voucher_date_label}</Label>
                <Input
                  type="date"
                  value={form.voucher_date}
                  onChange={(e) => setForm({...form, voucher_date: e.target.value})}
                />
              </div>
              <div>
                <Label>{t.voucher_payment_method}</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({...form, payment_method: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{paymentMethodLabel('cash')}</SelectItem>
                    <SelectItem value="bank">{paymentMethodLabel('bank')}</SelectItem>
                    <SelectItem value="card">{paymentMethodLabel('card')}</SelectItem>
                    <SelectItem value="check">{paymentMethodLabel('check')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t.voucher_related_to}</Label>
                <Select value={form.related_to} onValueChange={(v) => setForm({...form, related_to: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.voucher_optional} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">{t.voucher_customer}</SelectItem>
                    <SelectItem value="supplier">{t.voucher_supplier}</SelectItem>
                    <SelectItem value="expense">{t.voucher_expense}</SelectItem>
                    <SelectItem value="installment">{t.voucher_installment}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={addVoucher.isPending}>
                {addVoucher.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                {t.voucher_save}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="receipts" className="w-full">
        <TabsList>
          <TabsTrigger value="receipts" className="gap-2">
            <Receipt className="w-4 h-4" /> {t.voucher_receipts_tab} ({receiptVouchers.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" /> {t.voucher_payments_tab} ({paymentVouchers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <CardTitle>{t.voucher_receipts_tab}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <VoucherTable vouchers={receiptVouchers} type="receipt" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>{t.voucher_payments_tab}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <VoucherTable vouchers={paymentVouchers} type="payment" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <JournalEntryEditDialog
        entryId={editingJournalEntryId}
        open={!!editingJournalEntryId}
        onOpenChange={(open) => !open && setEditingJournalEntryId(null)}
        title={t.voucher_journal_entry_title}
        referenceType="voucher"
      />
    </div>
  );
}
