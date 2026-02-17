import { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Loader2, Printer, Save, RefreshCw, X, BookOpen, Pencil, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useAddVoucher, useDeleteVoucher, useVouchers } from '@/hooks/useVouchers';
import { useCompany } from '@/contexts/CompanyContext';
import { useAccounts } from '@/hooks/useAccounting';
import { useCustomers, useSuppliers } from '@/hooks/useDatabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { Voucher } from '@/services/vouchers';
import { AccountSearchSelect } from '@/components/accounting/AccountSearchSelect';

interface VoucherLine {
  id: string;
  account_id: string;
  amount: number;
  description: string;
  cost_center: string;
  reference: string;
}

interface VoucherFormViewProps {
  type: 'receipt' | 'payment';
}

export function VoucherFormView({ type }: VoucherFormViewProps) {
  const { t, language } = useLanguage();
  const { companyId } = useCompany();
  const { data: allVouchers = [], isLoading } = useVouchers();
  const { data: accounts = [] } = useAccounts();
  const { data: customers = [] } = useCustomers();
  const { data: suppliers = [] } = useSuppliers();
  const { filterByFiscalYear } = useFiscalYearFilter();
  const addVoucher = useAddVoucher();
  const deleteVoucher = useDeleteVoucher();

  const filteredVouchers = useMemo(() => {
    return filterByFiscalYear(allVouchers, 'voucher_date')
      .filter(v => v.voucher_type === type)
      .sort((a, b) => a.voucher_number - b.voucher_number);
  }, [allVouchers, filterByFiscalYear, type]);

  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = new voucher mode
  const [isNewMode, setIsNewMode] = useState(true);

  const currentVoucher = !isNewMode && currentIndex >= 0 && currentIndex < filteredVouchers.length
    ? filteredVouchers[currentIndex]
    : null;

  // Form state
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mainAccountId, setMainAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [relatedTo, setRelatedTo] = useState('');
  const [relatedParty, setRelatedParty] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [lines, setLines] = useState<VoucherLine[]>([
    { id: crypto.randomUUID(), account_id: '', amount: 0, description: '', cost_center: '', reference: '' }
  ]);

  const flatAccounts = useMemo(() => {
    return accounts.map(a => ({ id: a.id, code: a.code, name: a.name }));
  }, [accounts]);

  const getAccountName = (id: string) => {
    const acc = flatAccounts.find(a => a.id === id);
    return acc ? `${acc.code} ${acc.name}` : '';
  };

  const loadVoucher = useCallback((voucher: Voucher | null) => {
    if (!voucher) {
      resetForm();
      return;
    }
    setVoucherDate(voucher.voucher_date);
    setPaymentMethod(voucher.payment_method);
    setDescription(voucher.description);
    setRelatedTo(voucher.related_to || '');
    setMainAccountId('');
    setLines([
      { id: crypto.randomUUID(), account_id: '', amount: Number(voucher.amount), description: voucher.description, cost_center: '', reference: '' }
    ]);
  }, []);

  const resetForm = () => {
    setVoucherDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
    setMainAccountId('');
    setDescription('');
    setRelatedTo('');
    setRelatedParty('');
    setTaxNumber('');
    setLines([
      { id: crypto.randomUUID(), account_id: '', amount: 0, description: '', cost_center: '', reference: '' }
    ]);
  };

  const handleNewVoucher = () => {
    setIsNewMode(true);
    setCurrentIndex(-1);
    resetForm();
  };

  const navigateTo = (index: number) => {
    if (index < 0 || index >= filteredVouchers.length) return;
    setIsNewMode(false);
    setCurrentIndex(index);
    loadVoucher(filteredVouchers[index]);
  };

  const totalAmount = lines.reduce((sum, l) => sum + (l.amount || 0), 0);

  const handleAddLine = () => {
    setLines(prev => [...prev, {
      id: crypto.randomUUID(),
      account_id: '',
      amount: 0,
      description: '',
      cost_center: '',
      reference: ''
    }]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: keyof VoucherLine, value: any) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleSave = async () => {
    if (totalAmount <= 0) {
      toast.error('يجب إدخال مبلغ صحيح');
      return;
    }
    if (!description) {
      toast.error('يجب إدخال البيان');
      return;
    }

    try {
      await addVoucher.mutateAsync({
        company_id: companyId!,
        voucher_type: type,
        amount: totalAmount,
        description,
        voucher_date: voucherDate,
        payment_method: paymentMethod,
        related_to: relatedTo || null,
        related_id: null,
        created_by: null
      });
      toast.success(type === 'receipt' ? 'تم اعتماد سند القبض بنجاح' : 'تم اعتماد سند الصرف بنجاح');
      handleNewVoucher();
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ السند');
    }
  };

  const handleDelete = async () => {
    if (!currentVoucher) return;
    if (!confirm('هل أنت متأكد من حذف هذا السند؟')) return;
    try {
      await deleteVoucher.mutateAsync(currentVoucher.id);
      toast.success('تم حذف السند');
      handleNewVoucher();
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isReceipt = type === 'receipt';
  const title = isReceipt ? 'سند قبض' : 'سند صرف';
  const mainAccountLabel = isReceipt ? 'رقم حساب القبض' : 'رقم حساب الصرف';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-0 max-w-6xl mx-auto">
      {/* Title Bar */}
      <div className="bg-muted/50 border border-border rounded-t-lg px-4 py-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <span className="text-sm text-muted-foreground">
          {isNewMode ? 'جديد' : `${currentIndex + 1} / ${filteredVouchers.length}`}
        </span>
      </div>

      {/* Header Section */}
      <div className="border border-t-0 border-border bg-card p-4 space-y-3">
        {/* Row 1: Voucher Number, Work Order, Date, Journal Entry Number */}
        <div className="grid grid-cols-4 gap-4 items-end">
          <div>
            <Label className="text-xs text-muted-foreground">رقم السند</Label>
            <Input
              value={currentVoucher ? `${isReceipt ? 'ق' : 'ص'}-${currentVoucher.voucher_number}` : 'جديد'}
              readOnly
              className="bg-muted/30 font-mono font-bold text-base"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">أمر التشغيل</Label>
            <Input placeholder="" className="bg-muted/10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">التاريخ</Label>
            <Input
              type="date"
              value={voucherDate}
              onChange={e => setVoucherDate(e.target.value)}
              disabled={!isNewMode}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">رقم القيد</Label>
            <Input
              value={currentVoucher?.journal_entry_id ? '✓' : '-'}
              readOnly
              className="bg-muted/30"
            />
          </div>
        </div>

        {/* Row 2: Payment Method, Salesman, Periodic */}
        <div className="grid grid-cols-4 gap-4 items-end">
          <div>
            <Label className="text-xs text-muted-foreground">طريقة الدفع</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={!isNewMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقدي</SelectItem>
                <SelectItem value="bank">تحويل بنكي</SelectItem>
                <SelectItem value="card">بطاقة</SelectItem>
                <SelectItem value="check">شيك</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">المندوب</Label>
            <Input placeholder="" disabled={!isNewMode} className="bg-muted/10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">سند دوري</Label>
            <Select disabled={!isNewMode}>
              <SelectTrigger>
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div />
        </div>

        {/* Row 3: Main Account */}
        <div className="grid grid-cols-4 gap-4 items-end">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground font-semibold">{mainAccountLabel}</Label>
            <AccountSearchSelect
              accounts={flatAccounts}
              value={mainAccountId}
              onChange={setMainAccountId}
              placeholder="اختر الحساب..."
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">مركز التكلفة</Label>
            <Input placeholder="" disabled={!isNewMode} className="bg-muted/10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">فترة من / إلى</Label>
            <div className="flex gap-1">
              <Input type="date" className="text-xs" disabled={!isNewMode} />
              <Input type="date" className="text-xs" disabled={!isNewMode} />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label className="text-xs text-muted-foreground">البيان</Label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={!isNewMode}
            rows={2}
            className="resize-none"
            placeholder="أدخل بيان السند..."
          />
        </div>
      </div>

      {/* Lines Table Section */}
      <div className="border border-t-0 border-border bg-card">
        <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-muted/30">
          {isNewMode && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAddLine}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                if (lines.length > 1) handleRemoveLine(lines[lines.length - 1].id);
              }}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-center w-[160px]">الحساب</TableHead>
                <TableHead className="text-center w-[160px]">اسم الحساب</TableHead>
                <TableHead className="text-center w-[120px]">القيمة</TableHead>
                <TableHead className="text-center">البيان</TableHead>
                <TableHead className="text-center w-[100px]">المرجع</TableHead>
                <TableHead className="text-center w-[120px]">مركز التكلفة</TableHead>
                {isNewMode && <TableHead className="text-center w-[50px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="p-1">
                    <AccountSearchSelect
                      accounts={flatAccounts}
                      value={line.account_id}
                      onChange={(v) => updateLine(line.id, 'account_id', v)}
                      placeholder="الحساب"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground p-1">
                    {getAccountName(line.account_id)}
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      type="number"
                      value={line.amount || ''}
                      onChange={e => updateLine(line.id, 'amount', parseFloat(e.target.value) || 0)}
                      disabled={!isNewMode}
                      className="text-center font-mono"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={line.description}
                      onChange={e => updateLine(line.id, 'description', e.target.value)}
                      disabled={!isNewMode}
                      placeholder="البيان"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={line.reference}
                      onChange={e => updateLine(line.id, 'reference', e.target.value)}
                      disabled={!isNewMode}
                      placeholder=""
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={line.cost_center}
                      onChange={e => updateLine(line.id, 'cost_center', e.target.value)}
                      disabled={!isNewMode}
                      placeholder=""
                    />
                  </TableCell>
                  {isNewMode && (
                    <TableCell className="p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveLine(line.id)}
                        disabled={lines.length <= 1}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {/* Empty rows to match ERP look */}
              {lines.length < 5 && Array.from({ length: 5 - lines.length }).map((_, i) => (
                <TableRow key={`empty-${i}`} className="h-8">
                  <TableCell colSpan={isNewMode ? 7 : 6} />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Tax / Party Section */}
      <div className="border border-t-0 border-border bg-muted/30 px-4 py-2">
        <div className="grid grid-cols-4 gap-4 items-center">
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" id="tax-check" />
            <Label htmlFor="tax-check" className="text-sm cursor-pointer">تسجيل الضريبة</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">العميل/المورد</Label>
            <Select value={relatedTo} onValueChange={setRelatedTo} disabled={!isNewMode}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">عميل</SelectItem>
                <SelectItem value="supplier">مورد</SelectItem>
                <SelectItem value="expense">مصروفات</SelectItem>
                <SelectItem value="installment">قسط</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">الرقم الضريبي</Label>
            <Input value={taxNumber} onChange={e => setTaxNumber(e.target.value)} className="h-8" disabled={!isNewMode} />
          </div>
          <div className="text-sm text-muted-foreground text-left">
            {isReceipt ? 'مبيعات بالنسبة الأساسية' : 'مشتريات بالنسبة الأساسية'}
          </div>
        </div>
      </div>

      {/* Totals Footer */}
      <div className="border border-t-0 border-border bg-muted/50 px-4 py-3">
        <div className="grid grid-cols-5 gap-4 items-center text-sm">
          <div className="text-center">
            <span className="text-muted-foreground">المجموع قبل الضريبة: </span>
            <span className="font-bold font-mono">{totalAmount.toLocaleString()}</span>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground">الضريبة: </span>
            <span className="font-bold font-mono">0</span>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground">المجموع: </span>
            <span className="font-bold font-mono text-lg">{totalAmount.toLocaleString()}</span>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground">رصيد الحساب: </span>
            <span className="font-bold font-mono">0</span>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground">رصيد الحساب الكلي: </span>
            <span className="font-bold font-mono">0</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="border border-t-0 border-border rounded-b-lg bg-card px-4 py-3 flex items-center justify-between">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => navigateTo(filteredVouchers.length - 1)} disabled={filteredVouchers.length === 0}>
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateTo(currentIndex + 1)} disabled={isNewMode || currentIndex >= filteredVouchers.length - 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-2 text-sm font-mono min-w-[40px] text-center">
            {isNewMode ? '*' : currentIndex + 1}
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateTo(currentIndex - 1)} disabled={isNewMode || currentIndex <= 0}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateTo(0)} disabled={filteredVouchers.length === 0}>
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={!isNewMode || addVoucher.isPending} className="gap-2 rounded-full">
            <Save className="w-4 h-4" />
            اعتماد
          </Button>
          <Button variant="outline" onClick={handleNewVoucher} className="gap-2 rounded-full">
            <Plus className="w-4 h-4" />
            سند جديد
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2 rounded-full">
            <Printer className="w-4 h-4" />
            طباعة
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isNewMode || !currentVoucher}
            className="gap-2 rounded-full text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            حذف
          </Button>
        </div>
      </div>
    </div>
  );
}
