import { useState } from 'react';
import { Plus, Pencil, Trash2, Power, PowerOff, Calculator } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccountSearchSelect } from '@/components/accounting/AccountSearchSelect';
import { 
  useJournalEntryRules, 
  useCreateJournalEntryRule, 
  useUpdateJournalEntryRule, 
  useDeleteJournalEntryRule 
} from '@/hooks/useSystemControl';
import { useAccounts } from '@/hooks/useAccounting';
import { TRIGGER_TYPES, JournalEntryRule } from '@/services/systemControl';
import { toast } from 'sonner';

export function JournalRulesTab() {
  const { data: rules = [], isLoading } = useJournalEntryRules();
  const { data: accounts = [] } = useAccounts();
  const createRule = useCreateJournalEntryRule();
  const updateRule = useUpdateJournalEntryRule();
  const deleteRule = useDeleteJournalEntryRule();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<JournalEntryRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: '',
    debit_account_id: '',
    credit_account_id: '',
    amount_field: '',
    description_template: '',
    priority: 0,
  });

  const openCreateDialog = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      trigger_type: '',
      debit_account_id: '',
      credit_account_id: '',
      amount_field: '',
      description_template: '',
      priority: 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (rule: JournalEntryRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      trigger_type: rule.trigger_type,
      debit_account_id: rule.debit_account_id || '',
      credit_account_id: rule.credit_account_id || '',
      amount_field: rule.amount_field || '',
      description_template: rule.description_template || '',
      priority: rule.priority,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.trigger_type) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    try {
      if (editingRule) {
        await updateRule.mutateAsync({
          id: editingRule.id,
          updates: {
            name: formData.name,
            trigger_type: formData.trigger_type,
            debit_account_id: formData.debit_account_id || null,
            credit_account_id: formData.credit_account_id || null,
            amount_field: formData.amount_field,
            description_template: formData.description_template,
            priority: formData.priority,
          },
        });
        toast.success('تم تحديث القاعدة بنجاح');
      } else {
        await createRule.mutateAsync({
          name: formData.name,
          trigger_type: formData.trigger_type,
          is_enabled: true,
          conditions: [],
          debit_account_id: formData.debit_account_id || null,
          credit_account_id: formData.credit_account_id || null,
          amount_field: formData.amount_field,
          description_template: formData.description_template,
          priority: formData.priority,
        });
        toast.success('تم إنشاء القاعدة بنجاح');
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('حدث خطأ أثناء حفظ القاعدة');
    }
  };

  const handleToggleEnabled = async (rule: JournalEntryRule) => {
    try {
      await updateRule.mutateAsync({
        id: rule.id,
        updates: { is_enabled: !rule.is_enabled },
      });
      toast.success(rule.is_enabled ? 'تم تعطيل القاعدة' : 'تم تفعيل القاعدة');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه القاعدة؟')) return;
    try {
      await deleteRule.mutateAsync(id);
      toast.success('تم حذف القاعدة');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const getAccountName = (accountId: string | null) => {
    if (!accountId) return '-';
    const account = accounts.find(a => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : accountId;
  };

  const getTriggerLabel = (type: string) => {
    return TRIGGER_TYPES.find(t => t.type === type)?.label || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>قواعد القيود التلقائية</CardTitle>
                <CardDescription>
                  إدارة القواعد التي تحدد متى وكيف يتم إنشاء القيود المحاسبية تلقائياً
                </CardDescription>
              </div>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة قاعدة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد قواعد مخصصة بعد</p>
              <p className="text-sm">النظام يستخدم القواعد الافتراضية</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>نوع العملية</TableHead>
                  <TableHead>حساب المدين</TableHead>
                  <TableHead>حساب الدائن</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTriggerLabel(rule.trigger_type)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{getAccountName(rule.debit_account_id)}</TableCell>
                    <TableCell className="text-sm">{getAccountName(rule.credit_account_id)}</TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_enabled}
                        onCheckedChange={() => handleToggleEnabled(rule)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(rule)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rule.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'تعديل القاعدة' : 'إضافة قاعدة جديدة'}</DialogTitle>
            <DialogDescription>
              حدد متى وكيف يتم إنشاء القيد المحاسبي تلقائياً
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم القاعدة *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: قيد مبيعات نقدية"
              />
            </div>

            <div className="space-y-2">
              <Label>نوع العملية *</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, trigger_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع العملية" />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>حساب المدين</Label>
              <AccountSearchSelect
                accounts={accounts}
                value={formData.debit_account_id}
                onChange={(value) => setFormData(prev => ({ ...prev, debit_account_id: value }))}
                placeholder="اختر حساب المدين..."
              />
            </div>

            <div className="space-y-2">
              <Label>حساب الدائن</Label>
              <AccountSearchSelect
                accounts={accounts}
                value={formData.credit_account_id}
                onChange={(value) => setFormData(prev => ({ ...prev, credit_account_id: value }))}
                placeholder="اختر حساب الدائن..."
              />
            </div>

            <div className="space-y-2">
              <Label>حقل المبلغ</Label>
              <Input
                value={formData.amount_field}
                onChange={(e) => setFormData(prev => ({ ...prev, amount_field: e.target.value }))}
                placeholder="مثال: sale_price, amount"
              />
            </div>

            <div className="space-y-2">
              <Label>الأولوية</Label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>قالب الوصف</Label>
              <Input
                value={formData.description_template}
                onChange={(e) => setFormData(prev => ({ ...prev, description_template: e.target.value }))}
                placeholder="مثال: مبيعات سيارة {car_name} للعميل {customer_name}"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={createRule.isPending || updateRule.isPending}>
              {editingRule ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
