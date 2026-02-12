import { useState, useMemo } from 'react';
import { Building2, FileText, AlertTriangle, Plus, Wallet, TrendingUp, Calendar, Phone, Loader2, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useFinancingCompanies, useFinancingContracts, useAddFinancingCompany, useAddFinancingContract, useRecordFinancingPayment, useOverdueFinancingPayments } from '@/hooks/useFinancing';
import { useCustomers, useCars, useSales } from '@/hooks/useDatabase';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { useLanguage } from '@/contexts/LanguageContext';

export function FinancingPage() {
  const { t, language } = useLanguage();
  const { company } = useCompany();
  const { data: companies = [], isLoading: loadingCompanies } = useFinancingCompanies();
  const { data: contracts = [], isLoading: loadingContracts } = useFinancingContracts();
  const { data: overduePayments = [] } = useOverdueFinancingPayments();
  const { data: customers = [] } = useCustomers();
  const { data: cars = [] } = useCars();
  const { filterByFiscalYear } = useFiscalYearFilter();
  
  const addCompany = useAddFinancingCompany();
  const addContract = useAddFinancingContract();
  const recordPayment = useRecordFinancingPayment();
  
  const filteredContracts = useMemo(() => filterByFiscalYear(contracts, 'contract_date'), [contracts, filterByFiscalYear]);
  
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  
  const [companyForm, setCompanyForm] = useState({ name: '', bank_name: '', contact_person: '', phone: '', email: '', commission_rate: 0, notes: '' });
  const [contractForm, setContractForm] = useState({ contract_number: '', financing_company_id: '', customer_id: '', car_id: '', sale_id: '', total_amount: 0, down_payment: 0, profit_rate: 0, number_of_months: 12, first_payment_date: new Date().toISOString().split('T')[0], notes: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: 0, payment_method: 'bank_transfer', bank_reference: '', paid_date: new Date().toISOString().split('T')[0] });
  
  const currency = language === 'ar' ? 'ريال' : 'SAR';
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';
  const formatCurrency = (value: number) => new Intl.NumberFormat(locale).format(value);
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', active: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800', defaulted: 'bg-red-100 text-red-800', cancelled: 'bg-gray-100 text-gray-800', paid: 'bg-green-100 text-green-800', partial: 'bg-orange-100 text-orange-800', overdue: 'bg-red-100 text-red-800' };
    const labels: Record<string, string> = { pending: t.fin_status_pending, active: t.fin_status_active, completed: t.fin_status_completed, defaulted: t.fin_status_defaulted, cancelled: t.fin_status_cancelled, paid: t.fin_status_paid, partial: t.fin_status_partial, overdue: t.fin_status_overdue };
    return <Badge className={styles[status]}>{labels[status] || status}</Badge>;
  };
  
  const handleAddCompany = async () => {
    if (!companyForm.name || !company?.id) { toast.error(t.voucher_fill_required); return; }
    try { await addCompany.mutateAsync({ ...companyForm, company_id: company.id, is_active: true }); toast.success(language === 'ar' ? 'تمت إضافة شركة التمويل بنجاح' : 'Financing company added'); setShowCompanyDialog(false); setCompanyForm({ name: '', bank_name: '', contact_person: '', phone: '', email: '', commission_rate: 0, notes: '' }); }
    catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء الإضافة' : 'Error adding'); }
  };
  
  const handleAddContract = async () => {
    if (!contractForm.contract_number || !contractForm.financing_company_id || !company?.id) { toast.error(t.voucher_fill_required); return; }
    const financedAmount = contractForm.total_amount - contractForm.down_payment;
    const totalWithProfit = financedAmount * (1 + contractForm.profit_rate / 100);
    const monthlyPayment = totalWithProfit / contractForm.number_of_months;
    try { await addContract.mutateAsync({ ...contractForm, company_id: company.id, financed_amount: financedAmount, monthly_payment: Math.round(monthlyPayment * 100) / 100, contract_date: new Date().toISOString().split('T')[0], status: 'active', amount_received_from_bank: 0 }); toast.success(language === 'ar' ? 'تمت إضافة عقد التمويل بنجاح' : 'Financing contract added'); setShowContractDialog(false); }
    catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء الإضافة' : 'Error adding'); }
  };
  
  const handleRecordPayment = async () => {
    if (!selectedPayment || paymentForm.amount <= 0) { toast.error(t.voucher_fill_required); return; }
    try { await recordPayment.mutateAsync({ paymentId: selectedPayment.id, paidAmount: paymentForm.amount, paymentMethod: paymentForm.payment_method, bankReference: paymentForm.bank_reference, paidDate: paymentForm.paid_date }); toast.success(language === 'ar' ? 'تم تسجيل الدفعة بنجاح' : 'Payment recorded'); setShowPaymentDialog(false); setSelectedPayment(null); }
    catch { toast.error(language === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'Error recording'); }
  };
  
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const totalFinanced = contracts.reduce((sum, c) => sum + Number(c.financed_amount), 0);
  const overdueCount = overduePayments.length;
  
  if (loadingCompanies || loadingContracts) return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl md:text-3xl font-bold text-foreground">{t.fin_title}</h1><p className="text-sm text-muted-foreground mt-1">{t.fin_subtitle}</p></div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCompanyDialog(true)} variant="outline"><Building2 className="w-4 h-4 ml-2" />{t.fin_add_company}</Button>
          <Button onClick={() => setShowContractDialog(true)} className="gradient-primary"><Plus className="w-4 h-4 ml-2" />{t.fin_new_contract}</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><FileText className="w-5 h-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">{t.fin_total_contracts}</p><p className="text-xl font-bold">{totalContracts}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-500" /></div><div><p className="text-sm text-muted-foreground">{t.fin_active_contracts}</p><p className="text-xl font-bold">{activeContracts}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-500/10 rounded-lg"><Wallet className="w-5 h-5 text-green-500" /></div><div><p className="text-sm text-muted-foreground">{t.fin_total_financing}</p><p className="text-xl font-bold">{formatCurrency(totalFinanced)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-red-500/10 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-500" /></div><div><p className="text-sm text-muted-foreground">{t.fin_overdue_installments}</p><p className="text-xl font-bold text-red-600">{overdueCount}</p></div></div></CardContent></Card>
      </div>
      
      <Tabs defaultValue="contracts">
        <TabsList>
          <TabsTrigger value="contracts">{t.fin_contracts_tab}</TabsTrigger>
          <TabsTrigger value="companies">{t.fin_companies_tab}</TabsTrigger>
          <TabsTrigger value="overdue" className="relative">{t.fin_overdue_tab}{overdueCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{overdueCount}</span>}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="contracts" className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-right">{t.fin_contract_number}</TableHead>
                <TableHead className="text-right">{t.fin_financing_company}</TableHead>
                <TableHead className="text-right">{t.fin_customer}</TableHead>
                <TableHead className="text-right">{t.fin_financed_amount}</TableHead>
                <TableHead className="text-right">{t.fin_monthly_payment}</TableHead>
                <TableHead className="text-right">{t.status}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredContracts.map(contract => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.contract_number}</TableCell>
                    <TableCell>{contract.financing_company?.name || '-'}</TableCell>
                    <TableCell>{contract.customer?.name || '-'}</TableCell>
                    <TableCell>{formatCurrency(Number(contract.financed_amount))} {currency}</TableCell>
                    <TableCell>{formatCurrency(Number(contract.monthly_payment))} {currency}</TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => { setSelectedContract(contract); setShowDetailsDialog(true); }}><Eye className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {contracts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t.fin_no_contracts}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        
        <TabsContent value="companies" className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-right">{t.fin_company_name}</TableHead>
                <TableHead className="text-right">{t.fin_bank}</TableHead>
                <TableHead className="text-right">{t.fin_contact_person}</TableHead>
                <TableHead className="text-right">{t.phone}</TableHead>
                <TableHead className="text-right">{t.fin_commission_rate}</TableHead>
                <TableHead className="text-right">{t.status}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {companies.map(company => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.bank_name || '-'}</TableCell>
                    <TableCell>{company.contact_person || '-'}</TableCell>
                    <TableCell dir="ltr">{company.phone || '-'}</TableCell>
                    <TableCell>{company.commission_rate}%</TableCell>
                    <TableCell><Badge className={company.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{company.is_active ? t.fin_active : t.fin_inactive}</Badge></TableCell>
                  </TableRow>
                ))}
                {companies.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t.fin_no_companies}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        
        <TabsContent value="overdue" className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-right">{t.fin_contract_number}</TableHead>
                <TableHead className="text-right">{t.fin_customer}</TableHead>
                <TableHead className="text-right">{t.fin_installment_number}</TableHead>
                <TableHead className="text-right">{t.fin_due_date}</TableHead>
                <TableHead className="text-right">{t.fin_due_amount}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {overduePayments.map((payment: any) => (
                  <TableRow key={payment.id} className="bg-red-50">
                    <TableCell className="font-medium">{payment.contract?.contract_number}</TableCell>
                    <TableCell>{payment.contract?.customer?.name || '-'}</TableCell>
                    <TableCell>{payment.payment_number}</TableCell>
                    <TableCell className="text-red-600">{payment.due_date}</TableCell>
                    <TableCell>{formatCurrency(Number(payment.amount) - Number(payment.paid_amount || 0))} {currency}</TableCell>
                    <TableCell><Button size="sm" onClick={() => { setSelectedPayment(payment); setPaymentForm({ amount: Number(payment.amount) - Number(payment.paid_amount || 0), payment_method: 'bank_transfer', bank_reference: '', paid_date: new Date().toISOString().split('T')[0] }); setShowPaymentDialog(true); }}>{t.fin_record_payment}</Button></TableCell>
                  </TableRow>
                ))}
                {overduePayments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{language === 'ar' ? 'لا توجد أقساط متأخرة 🎉' : 'No overdue installments 🎉'}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Company Dialog */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t.fin_add_company}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t.fin_company_name} *</Label><Input value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} /></div>
            <div><Label>{t.fin_bank}</Label><Input value={companyForm.bank_name} onChange={e => setCompanyForm({ ...companyForm, bank_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t.fin_contact_person}</Label><Input value={companyForm.contact_person} onChange={e => setCompanyForm({ ...companyForm, contact_person: e.target.value })} /></div>
              <div><Label>{t.phone}</Label><Input value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t.email}</Label><Input value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} /></div>
              <div><Label>{t.fin_commission_rate} %</Label><Input type="number" value={companyForm.commission_rate} onChange={e => setCompanyForm({ ...companyForm, commission_rate: Number(e.target.value) })} /></div>
            </div>
            <div><Label>{t.notes}</Label><Textarea value={companyForm.notes} onChange={e => setCompanyForm({ ...companyForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompanyDialog(false)}>{t.cancel}</Button>
            <Button onClick={handleAddCompany} disabled={addCompany.isPending}>{addCompany.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Contract Dialog */}
      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t.fin_new_contract}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t.fin_contract_number} *</Label><Input value={contractForm.contract_number} onChange={e => setContractForm({ ...contractForm, contract_number: e.target.value })} /></div>
              <div><Label>{t.fin_financing_company} *</Label><Select value={contractForm.financing_company_id} onValueChange={v => setContractForm({ ...contractForm, financing_company_id: v })}><SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر شركة التمويل' : 'Select company'} /></SelectTrigger><SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t.fin_customer}</Label><Select value={contractForm.customer_id} onValueChange={v => setContractForm({ ...contractForm, customer_id: v })}><SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر العميل' : 'Select customer'} /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>{language === 'ar' ? 'السيارة' : 'Car'}</Label><Select value={contractForm.car_id} onValueChange={v => setContractForm({ ...contractForm, car_id: v })}><SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر السيارة' : 'Select car'} /></SelectTrigger><SelectContent>{cars.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.model}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>{language === 'ar' ? 'إجمالي المبلغ *' : 'Total Amount *'}</Label><Input type="number" value={contractForm.total_amount} onChange={e => setContractForm({ ...contractForm, total_amount: Number(e.target.value) })} /></div>
              <div><Label>{language === 'ar' ? 'الدفعة المقدمة' : 'Down Payment'}</Label><Input type="number" value={contractForm.down_payment} onChange={e => setContractForm({ ...contractForm, down_payment: Number(e.target.value) })} /></div>
              <div><Label>{language === 'ar' ? 'معدل الربح %' : 'Profit Rate %'}</Label><Input type="number" value={contractForm.profit_rate} onChange={e => setContractForm({ ...contractForm, profit_rate: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{language === 'ar' ? 'عدد الأشهر' : 'Number of Months'}</Label><Input type="number" value={contractForm.number_of_months} onChange={e => setContractForm({ ...contractForm, number_of_months: Number(e.target.value) })} /></div>
              <div><Label>{language === 'ar' ? 'تاريخ أول قسط' : 'First Payment Date'}</Label><Input type="date" value={contractForm.first_payment_date} onChange={e => setContractForm({ ...contractForm, first_payment_date: e.target.value })} /></div>
            </div>
            {contractForm.total_amount > 0 && contractForm.number_of_months > 0 && (
              <Card className="bg-muted/50"><CardContent className="p-4"><div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-sm text-muted-foreground">{t.fin_financed_amount}</p><p className="font-bold">{formatCurrency(contractForm.total_amount - contractForm.down_payment)} {currency}</p></div>
                <div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الربح' : 'Total Profit'}</p><p className="font-bold text-primary">{formatCurrency((contractForm.total_amount - contractForm.down_payment) * (contractForm.profit_rate / 100))} {currency}</p></div>
                <div><p className="text-sm text-muted-foreground">{t.fin_monthly_payment}</p><p className="font-bold text-green-600">{formatCurrency(Math.round(((contractForm.total_amount - contractForm.down_payment) * (1 + contractForm.profit_rate / 100)) / contractForm.number_of_months))} {currency}</p></div>
              </div></CardContent></Card>
            )}
            <div><Label>{t.notes}</Label><Textarea value={contractForm.notes} onChange={e => setContractForm({ ...contractForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContractDialog(false)}>{t.cancel}</Button>
            <Button onClick={handleAddContract} disabled={addContract.isPending}>{addContract.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Contract Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{language === 'ar' ? 'تفاصيل عقد التمويل' : 'Financing Contract Details'}</DialogTitle></DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-sm text-muted-foreground">{t.fin_contract_number}</p><p className="font-bold">{selectedContract.contract_number}</p></div>
                <div><p className="text-sm text-muted-foreground">{t.fin_financing_company}</p><p className="font-bold">{selectedContract.financing_company?.name}</p></div>
                <div><p className="text-sm text-muted-foreground">{t.status}</p>{getStatusBadge(selectedContract.status)}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-sm text-muted-foreground">{t.fin_customer}</p><p className="font-bold">{selectedContract.customer?.name || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'السيارة' : 'Car'}</p><p className="font-bold">{selectedContract.car?.name} - {selectedContract.car?.model}</p></div>
                <div><p className="text-sm text-muted-foreground">{t.date}</p><p className="font-bold">{selectedContract.contract_date}</p></div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المبلغ' : 'Total Amount'}</p><p className="font-bold">{formatCurrency(Number(selectedContract.total_amount))} {currency}</p></div>
                <div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'الدفعة المقدمة' : 'Down Payment'}</p><p className="font-bold">{formatCurrency(Number(selectedContract.down_payment))} {currency}</p></div>
                <div><p className="text-sm text-muted-foreground">{t.fin_financed_amount}</p><p className="font-bold text-primary">{formatCurrency(Number(selectedContract.financed_amount))} {currency}</p></div>
                <div><p className="text-sm text-muted-foreground">{t.fin_monthly_payment}</p><p className="font-bold text-green-600">{formatCurrency(Number(selectedContract.monthly_payment))} {currency}</p></div>
              </div>
              
              <h4 className="font-bold mt-4">{language === 'ar' ? 'جدول الأقساط' : 'Payment Schedule'}</h4>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-right">{language === 'ar' ? 'القسط' : 'Inst.'}</TableHead>
                  <TableHead className="text-right">{t.fin_due_date}</TableHead>
                  <TableHead className="text-right">{t.amount}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'المدفوع' : 'Paid'}</TableHead>
                  <TableHead className="text-right">{t.status}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(selectedContract.financing_payments || []).sort((a: any, b: any) => a.payment_number - b.payment_number).map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.payment_number}</TableCell>
                      <TableCell>{payment.due_date}</TableCell>
                      <TableCell>{formatCurrency(Number(payment.amount))} {currency}</TableCell>
                      <TableCell>{formatCurrency(Number(payment.paid_amount || 0))} {currency}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>{payment.status !== 'paid' && payment.status !== 'waived' && <Button size="sm" variant="outline" onClick={() => { setSelectedPayment(payment); setPaymentForm({ amount: Number(payment.amount) - Number(payment.paid_amount || 0), payment_method: 'bank_transfer', bank_reference: '', paid_date: new Date().toISOString().split('T')[0] }); setShowPaymentDialog(true); }}>{language === 'ar' ? 'سداد' : 'Pay'}</Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.fin_record_payment}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t.amount} *</Label><Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })} /></div>
            <div><Label>{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</Label><Select value={paymentForm.payment_method} onValueChange={v => setPaymentForm({ ...paymentForm, payment_method: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bank_transfer">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</SelectItem><SelectItem value="cash">{language === 'ar' ? 'نقدي' : 'Cash'}</SelectItem><SelectItem value="cheque">{language === 'ar' ? 'شيك' : 'Cheque'}</SelectItem></SelectContent></Select></div>
            <div><Label>{language === 'ar' ? 'رقم المرجع البنكي' : 'Bank Reference'}</Label><Input value={paymentForm.bank_reference} onChange={e => setPaymentForm({ ...paymentForm, bank_reference: e.target.value })} /></div>
            <div><Label>{t.date}</Label><Input type="date" value={paymentForm.paid_date} onChange={e => setPaymentForm({ ...paymentForm, paid_date: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>{t.cancel}</Button>
            <Button onClick={handleRecordPayment} disabled={recordPayment.isPending}>{recordPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.fin_record_payment}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
