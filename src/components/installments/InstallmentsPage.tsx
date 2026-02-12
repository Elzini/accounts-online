import { useState, useMemo } from 'react';
import { CreditCard, AlertTriangle, CheckCircle, Clock, Loader2, Eye, Banknote, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useInstallmentSales, useOverduePayments, useRecordPayment, useAddInstallmentSale } from '@/hooks/useInstallments';
import { InstallmentSale, InstallmentPayment } from '@/services/installments';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { useSales } from '@/hooks/useDatabase';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function InstallmentsPage() {
  const { t } = useLanguage();
  const { data: installmentSales = [], isLoading } = useInstallmentSales();
  const { data: overduePayments = [] } = useOverduePayments();
  const { data: allSales = [] } = useSales();
  const { filterByFiscalYear } = useFiscalYearFilter();
  const recordPayment = useRecordPayment();
  const addInstallmentSale = useAddInstallmentSale();
  const companyId = useCompanyId();
  
  const filteredInstallmentSales = useMemo(() => {
    return filterByFiscalYear(installmentSales, 'start_date');
  }, [installmentSales, filterByFiscalYear]);

  const availableSalesForInstallment = useMemo(() => {
    const existingInstallmentSaleIds = installmentSales.map(is => is.sale_id);
    return allSales.filter(sale => !existingInstallmentSaleIds.includes(sale.id));
  }, [allSales, installmentSales]);
  
  const [selectedSale, setSelectedSale] = useState<InstallmentSale | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<InstallmentPayment | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', date: new Date().toISOString().split('T')[0] });
  const [newContractForm, setNewContractForm] = useState({ sale_id: '', down_payment: '', number_of_installments: '12', notes: '' });

  const selectedSaleForContract = allSales.find(s => s.id === newContractForm.sale_id);
  const contractTotalAmount = selectedSaleForContract ? Number(selectedSaleForContract.sale_price) : 0;
  const contractDownPayment = parseFloat(newContractForm.down_payment) || 0;
  const contractRemaining = contractTotalAmount - contractDownPayment;
  const contractInstallmentAmount = contractRemaining / (parseInt(newContractForm.number_of_installments) || 12);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);

  const handleRecordPayment = async () => {
    if (!selectedPayment || !paymentForm.amount) { toast.error(t.fill_required); return; }
    try {
      await recordPayment.mutateAsync({ paymentId: selectedPayment.id, amount: parseFloat(paymentForm.amount), method: paymentForm.method, date: paymentForm.date });
      toast.success(t.payment_recorded);
      setIsPaymentDialogOpen(false);
      setSelectedPayment(null);
      setPaymentForm({ amount: '', method: 'cash', date: new Date().toISOString().split('T')[0] });
    } catch (error) { toast.error(t.error_occurred); }
  };

  const handleAddContract = async () => {
    if (!newContractForm.sale_id || !companyId) { toast.error(t.select_sale); return; }
    if (contractDownPayment >= contractTotalAmount) { toast.error(t.down_payment_less); return; }
    try {
      await addInstallmentSale.mutateAsync({
        company_id: companyId, sale_id: newContractForm.sale_id, total_amount: contractTotalAmount,
        down_payment: contractDownPayment, remaining_amount: contractRemaining,
        number_of_installments: parseInt(newContractForm.number_of_installments) || 12,
        installment_amount: contractInstallmentAmount, start_date: new Date().toISOString().split('T')[0],
        status: 'active', notes: newContractForm.notes || null,
      });
      toast.success(t.contract_created);
      setIsAddDialogOpen(false);
      setNewContractForm({ sale_id: '', down_payment: '', number_of_installments: '12', notes: '' });
    } catch (error) { toast.error(t.error_occurred); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default">{t.active_status}</Badge>;
      case 'completed': return <Badge variant="secondary" className="bg-green-100 text-green-800">{t.approved_status}</Badge>;
      case 'overdue': return <Badge variant="destructive">{t.overdue_payments}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 ml-1" /> {t.paid_status}</Badge>;
      case 'partial': return <Badge variant="default" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 ml-1" /> {t.pending_status}</Badge>;
      case 'pending': return <Badge variant="outline"><Clock className="w-3 h-3 ml-1" /> {t.pending_status}</Badge>;
      case 'overdue': return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 ml-1" /> {t.overdue_payments}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalActive = installmentSales.filter(s => s.status === 'active').length;
  const totalRemaining = installmentSales.filter(s => s.status === 'active').reduce((sum, s) => sum + Number(s.remaining_amount), 0);

  if (isLoading) { return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>; }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t.total_installments}</p><p className="text-2xl font-bold">{installmentSales.length}</p></div><CreditCard className="w-8 h-8 text-primary" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t.active_contracts}</p><p className="text-2xl font-bold">{totalActive}</p></div><Clock className="w-8 h-8 text-warning" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t.remaining_amount}</p><p className="text-2xl font-bold">{formatCurrency(totalRemaining)}</p></div><Banknote className="w-8 h-8 text-destructive" /></div></CardContent></Card>
        <Card className={overduePayments.length > 0 ? 'border-destructive' : ''}><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t.overdue_payments}</p><p className="text-2xl font-bold text-destructive">{overduePayments.length}</p></div><AlertTriangle className="w-8 h-8 text-destructive" /></div></CardContent></Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">{t.all_contracts}</TabsTrigger>
          <TabsTrigger value="overdue" className="text-destructive">{t.overdue_tab} ({overduePayments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t.installment_contracts}</CardTitle>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2"><Plus className="w-4 h-4" />{t.new_contract}</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{t.customer_col}</TableHead><TableHead>{t.car_col}</TableHead><TableHead>{t.total_amount_col}</TableHead>
                  <TableHead>{t.down_payment}</TableHead><TableHead>{t.remaining_col}</TableHead><TableHead>{t.installments_count}</TableHead>
                  <TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {installmentSales.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t.no_installment_contracts}</TableCell></TableRow>
                  ) : (
                    filteredInstallmentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.sale?.customer?.name || '-'}</TableCell>
                        <TableCell>{sale.sale?.car?.name || '-'}</TableCell>
                        <TableCell>{formatCurrency(Number(sale.total_amount))}</TableCell>
                        <TableCell>{formatCurrency(Number(sale.down_payment))}</TableCell>
                        <TableCell className="font-semibold text-destructive">{formatCurrency(Number(sale.remaining_amount))}</TableCell>
                        <TableCell>{sale.number_of_installments}</TableCell>
                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => { setSelectedSale(sale); setIsDetailsDialogOpen(true); }}><Eye className="w-4 h-4" /></Button></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-destructive">{t.overdue_payments_title}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{t.installment_number}</TableHead><TableHead>{t.due_date_col}</TableHead><TableHead>{t.amount}</TableHead>
                  <TableHead>{t.paid_amount_col}</TableHead><TableHead>{t.remaining_col}</TableHead><TableHead>{t.actions}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {overduePayments.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t.no_overdue}</TableCell></TableRow>
                  ) : (
                    overduePayments.map((payment) => (
                      <TableRow key={payment.id} className="bg-destructive/5">
                        <TableCell>#{payment.payment_number}</TableCell>
                        <TableCell className="text-destructive">{new Date(payment.due_date).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                        <TableCell>{formatCurrency(Number(payment.paid_amount || 0))}</TableCell>
                        <TableCell className="font-semibold text-destructive">{formatCurrency(Number(payment.amount) - Number(payment.paid_amount || 0))}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => {
                            setSelectedPayment(payment);
                            setPaymentForm({ amount: String(Number(payment.amount) - Number(payment.paid_amount || 0)), method: 'cash', date: new Date().toISOString().split('T')[0] });
                            setIsPaymentDialogOpen(true);
                          }}>{t.record_payment}</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{t.contract_details}</DialogTitle></DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div><p className="text-sm text-muted-foreground">{t.customer_col}</p><p className="font-semibold">{selectedSale.sale?.customer?.name}</p></div>
                <div><p className="text-sm text-muted-foreground">{t.car_col}</p><p className="font-semibold">{selectedSale.sale?.car?.name}</p></div>
                <div><p className="text-sm text-muted-foreground">{t.total_amount_col}</p><p className="font-semibold">{formatCurrency(Number(selectedSale.total_amount))}</p></div>
                <div><p className="text-sm text-muted-foreground">{t.installment_value}</p><p className="font-semibold">{formatCurrency(Number(selectedSale.installment_amount))}</p></div>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{t.installment_number}</TableHead><TableHead>{t.due_date_col}</TableHead><TableHead>{t.amount}</TableHead>
                  <TableHead>{t.paid_amount_col}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {selectedSale.payments?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>#{payment.payment_number}</TableCell>
                      <TableCell>{new Date(payment.due_date).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                      <TableCell>{formatCurrency(Number(payment.paid_amount || 0))}</TableCell>
                      <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {payment.status !== 'paid' && (
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedPayment(payment);
                            setPaymentForm({ amount: String(Number(payment.amount) - Number(payment.paid_amount || 0)), method: 'cash', date: new Date().toISOString().split('T')[0] });
                            setIsPaymentDialogOpen(true);
                          }}>{t.record_payment}</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.record_payment}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t.payment_amount} *</Label><Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} placeholder="0.00" /></div>
            <div><Label>{t.payment_method_label}</Label>
              <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm({...paymentForm, method: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t.cash_payment}</SelectItem>
                  <SelectItem value="bank">{t.bank_payment}</SelectItem>
                  <SelectItem value="card">{t.card_payment}</SelectItem>
                  <SelectItem value="check">{t.check_payment}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t.date}</Label><Input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})} /></div>
            <Button onClick={handleRecordPayment} className="w-full" disabled={recordPayment.isPending}>
              {recordPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}{t.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Contract Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t.new_contract}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t.select_sale} *</Label>
              <Select value={newContractForm.sale_id} onValueChange={(v) => setNewContractForm({...newContractForm, sale_id: v})}>
                <SelectTrigger><SelectValue placeholder={t.select_sale} /></SelectTrigger>
                <SelectContent>
                  {availableSalesForInstallment.length === 0 ? (
                    <SelectItem value="" disabled>{t.no_data}</SelectItem>
                  ) : (
                    availableSalesForInstallment.map((sale) => (
                      <SelectItem key={sale.id} value={sale.id}>{sale.customer?.name || t.customer_col} - {sale.car?.name || t.car_col} ({formatCurrency(Number(sale.sale_price))})</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedSaleForContract && <div className="p-3 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">{t.total_amount_col}</p><p className="text-lg font-bold">{formatCurrency(contractTotalAmount)}</p></div>}
            <div><Label>{t.down_payment}</Label><Input type="number" value={newContractForm.down_payment} onChange={(e) => setNewContractForm({...newContractForm, down_payment: e.target.value})} placeholder="0" dir="ltr" /></div>
            <div><Label>{t.installments_count}</Label>
              <Select value={newContractForm.number_of_installments} onValueChange={(v) => setNewContractForm({...newContractForm, number_of_installments: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[3, 6, 9, 12, 18, 24, 36, 48, 60].map(num => (<SelectItem key={num} value={String(num)}>{num}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {selectedSaleForContract && <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
              <div><p className="text-sm text-muted-foreground">{t.remaining_col}</p><p className="font-semibold text-destructive">{formatCurrency(contractRemaining)}</p></div>
              <div><p className="text-sm text-muted-foreground">{t.installment_value}</p><p className="font-semibold text-primary">{formatCurrency(contractInstallmentAmount)}</p></div>
            </div>}
            <div><Label>{t.notes}</Label><Input value={newContractForm.notes} onChange={(e) => setNewContractForm({...newContractForm, notes: e.target.value})} placeholder={t.notes + '...'} /></div>
            <Button onClick={handleAddContract} className="w-full" disabled={addInstallmentSale.isPending || !newContractForm.sale_id}>
              {addInstallmentSale.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}{t.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
