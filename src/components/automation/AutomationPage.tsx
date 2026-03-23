/**
 * Automation Page - Slim Orchestrator
 * Logic in hooks/useAutomationPage. Form dialogs kept as sub-components.
 */
import { useState } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useMiscServices';
import { format } from 'date-fns';
import {
  Zap, Plus, RefreshCw, Bell, Trash2, Receipt, Settings, Pause, Play, Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useAutomationPage } from './hooks/useAutomationPage';

export function AutomationPage() {
  const h = useAutomationPage();
  const { isAr, activeTab, setActiveTab, recurringInvoices, reminders, reminderRules,
    toggleRecurring, deleteRecurring, toggleRuleActive,
    activeRecurring, pendingReminders, sentReminders,
    frequencyLabels, reminderTypeLabels, statusColors,
    showRecurringForm, setShowRecurringForm, showRuleForm, setShowRuleForm,
    companyId, queryClient } = h;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Zap className="w-6 h-6 text-primary" />{isAr ? 'أتمتة العمليات' : 'Process Automation'}</h1>
          <p className="text-muted-foreground text-sm mt-1">{isAr ? 'فواتير دورية، تذكيرات تحصيل، وقيود تلقائية' : 'Recurring invoices, collection reminders, and auto journal entries'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Receipt className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{recurringInvoices.length}</div><p className="text-xs text-muted-foreground">{isAr ? 'فاتورة دورية' : 'Recurring Invoices'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Play className="w-8 h-8 mx-auto mb-2 text-success" /><div className="text-2xl font-bold">{activeRecurring}</div><p className="text-xs text-muted-foreground">{isAr ? 'نشطة' : 'Active'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Bell className="w-8 h-8 mx-auto mb-2 text-yellow-500" /><div className="text-2xl font-bold">{pendingReminders}</div><p className="text-xs text-muted-foreground">{isAr ? 'تذكير قيد الانتظار' : 'Pending Reminders'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Send className="w-8 h-8 mx-auto mb-2 text-blue-500" /><div className="text-2xl font-bold">{sentReminders}</div><p className="text-xs text-muted-foreground">{isAr ? 'تذكير مُرسل' : 'Sent Reminders'}</p></CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recurring" className="gap-1.5"><Receipt className="w-4 h-4" /><span className="hidden sm:inline">{isAr ? 'الفواتير الدورية' : 'Recurring Invoices'}</span></TabsTrigger>
          <TabsTrigger value="reminders" className="gap-1.5"><Bell className="w-4 h-4" /><span className="hidden sm:inline">{isAr ? 'تذكيرات التحصيل' : 'Collection Reminders'}</span></TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5"><Settings className="w-4 h-4" /><span className="hidden sm:inline">{isAr ? 'قواعد التذكير' : 'Reminder Rules'}</span></TabsTrigger>
        </TabsList>

        {/* Recurring Invoices Tab */}
        <TabsContent value="recurring" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">{isAr ? 'الفواتير الدورية المجدولة' : 'Scheduled Recurring Invoices'}</h3>
            <Button onClick={() => setShowRecurringForm(true)} className="gap-2"><Plus className="w-4 h-4" />{isAr ? 'فاتورة دورية جديدة' : 'New Recurring Invoice'}</Button>
          </div>
          {recurringInvoices.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" /><h3 className="font-semibold mb-2">{isAr ? 'لا توجد فواتير دورية' : 'No recurring invoices'}</h3><p className="text-sm text-muted-foreground mb-4">{isAr ? 'أنشئ فاتورة دورية لتتم تلقائياً حسب الجدول المحدد' : 'Create a recurring invoice to auto-generate on schedule'}</p><Button onClick={() => setShowRecurringForm(true)} variant="outline" className="gap-2"><Plus className="w-4 h-4" />{isAr ? 'إنشاء أول فاتورة دورية' : 'Create First Recurring Invoice'}</Button></CardContent></Card>
          ) : (
            <div className="rounded-md border overflow-auto"><Table><TableHeader><TableRow>
              <TableHead>{isAr ? 'النوع' : 'Type'}</TableHead><TableHead>{isAr ? 'العميل/المورد' : 'Customer/Supplier'}</TableHead><TableHead>{isAr ? 'التكرار' : 'Frequency'}</TableHead><TableHead>{isAr ? 'المبلغ' : 'Amount'}</TableHead><TableHead>{isAr ? 'الموعد القادم' : 'Next Due'}</TableHead><TableHead>{isAr ? 'المولّدة' : 'Generated'}</TableHead><TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead><TableHead>{isAr ? 'الإجراءات' : 'Actions'}</TableHead>
            </TableRow></TableHeader><TableBody>
              {recurringInvoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell><Badge variant={inv.invoice_type === 'sale' ? 'default' : 'secondary'}>{inv.invoice_type === 'sale' ? (isAr ? 'مبيعات' : 'Sale') : (isAr ? 'مشتريات' : 'Purchase')}</Badge></TableCell>
                  <TableCell className="font-medium">{inv.customers?.name || inv.suppliers?.name || '-'}</TableCell>
                  <TableCell>{frequencyLabels[inv.frequency] || inv.frequency}</TableCell>
                  <TableCell>{Number(inv.total_amount).toLocaleString()}</TableCell>
                  <TableCell>{inv.next_due_date ? format(new Date(inv.next_due_date), 'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell><Badge variant="outline">{inv.generated_count}{inv.max_occurrences ? `/${inv.max_occurrences}` : ''}</Badge></TableCell>
                  <TableCell><Badge className={inv.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}>{inv.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'متوقف' : 'Paused')}</Badge></TableCell>
                  <TableCell><div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleRecurring.mutate({ id: inv.id, is_active: !inv.is_active })}>{inv.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}</Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm(isAr ? 'حذف الفاتورة الدورية؟' : 'Delete recurring invoice?')) deleteRecurring.mutate(inv.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody></Table></div>
          )}
        </TabsContent>

        {/* Collection Reminders Tab */}
        <TabsContent value="reminders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">{isAr ? 'سجل التذكيرات' : 'Reminders Log'}</h3>
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['collection-reminders'] })} className="gap-2"><RefreshCw className="w-4 h-4" />{isAr ? 'تحديث' : 'Refresh'}</Button>
          </div>
          {reminders.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" /><h3 className="font-semibold mb-2">{isAr ? 'لا توجد تذكيرات' : 'No reminders yet'}</h3><p className="text-sm text-muted-foreground">{isAr ? 'سيتم إنشاء تذكيرات تلقائياً بناءً على قواعد التذكير المحددة' : 'Reminders will be auto-generated based on your reminder rules'}</p></CardContent></Card>
          ) : (
            <div className="rounded-md border overflow-auto"><Table><TableHeader><TableRow>
              <TableHead>{isAr ? 'العميل' : 'Customer'}</TableHead><TableHead>{isAr ? 'النوع' : 'Type'}</TableHead><TableHead>{isAr ? 'المبلغ' : 'Amount'}</TableHead><TableHead>{isAr ? 'الطريقة' : 'Method'}</TableHead><TableHead>{isAr ? 'المستوى' : 'Level'}</TableHead><TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead><TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
            </TableRow></TableHeader><TableBody>
              {reminders.map((rem: any) => (
                <TableRow key={rem.id}>
                  <TableCell className="font-medium">{rem.customers?.name || '-'}</TableCell>
                  <TableCell>{reminderTypeLabels[rem.reminder_type] || rem.reminder_type}</TableCell>
                  <TableCell>{Number(rem.amount_due).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{rem.reminder_method === 'notification' ? '🔔' : rem.reminder_method === 'email' ? '📧' : rem.reminder_method === 'sms' ? '📱' : '💬'} {rem.reminder_method}</Badge></TableCell>
                  <TableCell><Badge variant="outline">L{rem.escalation_level}</Badge></TableCell>
                  <TableCell><Badge className={statusColors[rem.status] || ''}>{rem.status === 'pending' ? (isAr ? 'قيد الانتظار' : 'Pending') : rem.status === 'sent' ? (isAr ? 'مُرسل' : 'Sent') : rem.status === 'paid' ? (isAr ? 'تم السداد' : 'Paid') : rem.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(rem.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></div>
          )}
        </TabsContent>

        {/* Reminder Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <div><h3 className="font-semibold">{isAr ? 'قواعد التذكير التلقائي' : 'Auto-Reminder Rules'}</h3><p className="text-xs text-muted-foreground mt-0.5">{isAr ? 'حدد متى وكيف يتم إرسال تذكيرات التحصيل تلقائياً' : 'Define when and how collection reminders are sent'}</p></div>
            <Button onClick={() => setShowRuleForm(true)} className="gap-2"><Plus className="w-4 h-4" />{isAr ? 'قاعدة جديدة' : 'New Rule'}</Button>
          </div>
          {reminderRules.length === 0 ? (
            <Card><CardContent className="py-8 text-center"><Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" /><h3 className="font-semibold mb-2">{isAr ? 'لا توجد قواعد تذكير' : 'No reminder rules'}</h3><p className="text-sm text-muted-foreground mb-4">{isAr ? 'أنشئ قواعد لتذكير العملاء تلقائياً بالفواتير المستحقة' : 'Create rules to automatically remind customers of due invoices'}</p><Button onClick={() => setShowRuleForm(true)} variant="outline" className="gap-2"><Plus className="w-4 h-4" />{isAr ? 'إنشاء أول قاعدة' : 'Create First Rule'}</Button></CardContent></Card>
          ) : (
            <div className="grid gap-3">{reminderRules.map((rule: any) => (
              <Card key={rule.id}><CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${rule.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}><Bell className="w-5 h-5" /></div>
                <div><h4 className="font-medium text-sm">{rule.name}</h4><div className="flex items-center gap-2 mt-0.5"><Badge variant="outline" className="text-[10px]">{reminderTypeLabels[rule.reminder_type]} {rule.days_offset > 0 ? `+${rule.days_offset}` : rule.days_offset} {isAr ? 'يوم' : 'days'}</Badge><Badge variant="outline" className="text-[10px]">L{rule.escalation_level}</Badge><Badge variant="outline" className="text-[10px]">{rule.reminder_method}</Badge></div></div>
              </div><Switch checked={rule.is_active} onCheckedChange={(checked) => toggleRuleActive(rule.id, checked)} /></div>
              {rule.message_template && <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">{rule.message_template}</p>}
              </CardContent></Card>
            ))}</div>
          )}
        </TabsContent>
      </Tabs>

      <RecurringInvoiceForm open={showRecurringForm} onClose={() => setShowRecurringForm(false)} companyId={companyId} isAr={isAr} />
      <ReminderRuleForm open={showRuleForm} onClose={() => setShowRuleForm(false)} companyId={companyId} isAr={isAr} />
    </div>
  );
}

// ========== Form Dialogs (kept as sub-components) ==========

function RecurringInvoiceForm({ open, onClose, companyId, isAr }: { open: boolean; onClose: () => void; companyId: string | null; isAr: boolean }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ invoice_type: 'sale', frequency: 'monthly', start_date: format(new Date(), 'yyyy-MM-dd'), next_due_date: format(new Date(), 'yyyy-MM-dd'), total_amount: '', notes: '', auto_approve: false, max_occurrences: '' });
  const { data: customers = [] } = useQuery({ queryKey: ['customers-list', companyId], queryFn: async () => { if (!companyId) return []; const { data } = await (supabase.from('customers') as any).select('id, name').eq('company_id', companyId).eq('is_active', true); return data || []; }, enabled: !!companyId && open, staleTime: 5 * 60 * 1000 });
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const createMutation = useMutation({
    mutationFn: async () => { if (!companyId) throw new Error('No company'); const { error } = await supabase.from('recurring_invoices').insert({ company_id: companyId, customer_id: selectedCustomerId || null, invoice_type: form.invoice_type, frequency: form.frequency, start_date: form.start_date, next_due_date: form.next_due_date, total_amount: Number(form.total_amount) || 0, notes: form.notes, auto_approve: form.auto_approve, max_occurrences: form.max_occurrences ? Number(form.max_occurrences) : null }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] }); toast.success(isAr ? 'تم إنشاء الفاتورة الدورية' : 'Recurring invoice created'); onClose(); },
    onError: () => toast.error(isAr ? 'حدث خطأ' : 'Error'),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" />{isAr ? 'فاتورة دورية جديدة' : 'New Recurring Invoice'}</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><Label>{isAr ? 'نوع الفاتورة' : 'Invoice Type'}</Label><Select value={form.invoice_type} onValueChange={v => setForm({ ...form, invoice_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sale">{isAr ? 'مبيعات' : 'Sale'}</SelectItem><SelectItem value="purchase">{isAr ? 'مشتريات' : 'Purchase'}</SelectItem></SelectContent></Select></div><div><Label>{isAr ? 'التكرار' : 'Frequency'}</Label><Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weekly">{isAr ? 'أسبوعي' : 'Weekly'}</SelectItem><SelectItem value="monthly">{isAr ? 'شهري' : 'Monthly'}</SelectItem><SelectItem value="quarterly">{isAr ? 'ربع سنوي' : 'Quarterly'}</SelectItem><SelectItem value="semi_annual">{isAr ? 'نصف سنوي' : 'Semi-Annual'}</SelectItem><SelectItem value="annual">{isAr ? 'سنوي' : 'Annual'}</SelectItem></SelectContent></Select></div></div>
        <div><Label>{isAr ? 'العميل' : 'Customer'}</Label><Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}><SelectTrigger><SelectValue placeholder={isAr ? 'اختر العميل' : 'Select customer'} /></SelectTrigger><SelectContent>{customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>{isAr ? 'تاريخ البداية' : 'Start Date'}</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value, next_due_date: e.target.value })} /></div><div><Label>{isAr ? 'المبلغ' : 'Amount'}</Label><Input type="number" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} placeholder="0" /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>{isAr ? 'الحد الأقصى للتكرار' : 'Max Occurrences'}</Label><Input type="number" value={form.max_occurrences} onChange={e => setForm({ ...form, max_occurrences: e.target.value })} placeholder={isAr ? 'بدون حد' : 'Unlimited'} /></div><div className="flex items-end"><label className="flex items-center gap-2 pb-2 cursor-pointer"><Switch checked={form.auto_approve} onCheckedChange={v => setForm({ ...form, auto_approve: v })} /><span className="text-sm">{isAr ? 'اعتماد تلقائي' : 'Auto-approve'}</span></label></div></div>
        <div><Label>{isAr ? 'ملاحظات' : 'Notes'}</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>{isAr ? 'إلغاء' : 'Cancel'}</Button><Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="gap-2"><Plus className="w-4 h-4" />{isAr ? 'إنشاء' : 'Create'}</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}

function ReminderRuleForm({ open, onClose, companyId, isAr }: { open: boolean; onClose: () => void; companyId: string | null; isAr: boolean }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', reminder_type: 'overdue', days_offset: '7', reminder_method: 'notification', escalation_level: '1', message_template: '' });
  const createMutation = useMutation({
    mutationFn: async () => { if (!companyId) throw new Error('No company'); await (await import('@/services/automation')).createCollectionReminderRule(companyId, { name: form.name, reminder_type: form.reminder_type, days_offset: Number(form.days_offset), reminder_method: form.reminder_method, escalation_level: Number(form.escalation_level), message_template: form.message_template || null }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['collection-reminder-rules'] }); toast.success(isAr ? 'تم إنشاء القاعدة' : 'Rule created'); onClose(); },
    onError: () => toast.error(isAr ? 'حدث خطأ' : 'Error'),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-primary" />{isAr ? 'قاعدة تذكير جديدة' : 'New Reminder Rule'}</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div><Label>{isAr ? 'اسم القاعدة' : 'Rule Name'}</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={isAr ? 'مثال: تذكير بعد 7 أيام' : 'e.g. Reminder after 7 days'} /></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>{isAr ? 'نوع التذكير' : 'Reminder Type'}</Label><Select value={form.reminder_type} onValueChange={v => setForm({ ...form, reminder_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="before_due">{isAr ? 'قبل الاستحقاق' : 'Before Due'}</SelectItem><SelectItem value="on_due">{isAr ? 'يوم الاستحقاق' : 'On Due Date'}</SelectItem><SelectItem value="overdue">{isAr ? 'بعد التأخر' : 'After Overdue'}</SelectItem><SelectItem value="escalation">{isAr ? 'تصعيد' : 'Escalation'}</SelectItem></SelectContent></Select></div><div><Label>{isAr ? 'عدد الأيام' : 'Days Offset'}</Label><Input type="number" value={form.days_offset} onChange={e => setForm({ ...form, days_offset: e.target.value })} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>{isAr ? 'طريقة الإرسال' : 'Method'}</Label><Select value={form.reminder_method} onValueChange={v => setForm({ ...form, reminder_method: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="notification">{isAr ? '🔔 إشعار نظام' : '🔔 Notification'}</SelectItem><SelectItem value="email">{isAr ? '📧 بريد إلكتروني' : '📧 Email'}</SelectItem><SelectItem value="sms">{isAr ? '📱 رسالة SMS' : '📱 SMS'}</SelectItem><SelectItem value="whatsapp">{isAr ? '💬 واتساب' : '💬 WhatsApp'}</SelectItem></SelectContent></Select></div><div><Label>{isAr ? 'مستوى التصعيد' : 'Escalation Level'}</Label><Select value={form.escalation_level} onValueChange={v => setForm({ ...form, escalation_level: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1 - {isAr ? 'عادي' : 'Normal'}</SelectItem><SelectItem value="2">2 - {isAr ? 'متوسط' : 'Medium'}</SelectItem><SelectItem value="3">3 - {isAr ? 'عاجل' : 'Urgent'}</SelectItem></SelectContent></Select></div></div>
        <div><Label>{isAr ? 'نص الرسالة' : 'Message Template'}</Label><Textarea value={form.message_template} onChange={e => setForm({ ...form, message_template: e.target.value })} rows={3} placeholder={isAr ? 'عميلنا الكريم، نود تذكيركم بفاتورة مستحقة بقيمة {amount} ر.س...' : 'Dear customer, this is a reminder for invoice #{invoice_number}...'} /><p className="text-[10px] text-muted-foreground mt-1">{isAr ? 'المتغيرات: {customer_name}, {amount}, {invoice_number}, {due_date}' : 'Variables: {customer_name}, {amount}, {invoice_number}, {due_date}'}</p></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>{isAr ? 'إلغاء' : 'Cancel'}</Button><Button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending} className="gap-2"><Plus className="w-4 h-4" />{isAr ? 'إنشاء' : 'Create'}</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}
