import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, Eye, Pencil, Save, Loader2 } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
// Service layer - no direct DB access needed (feature under development)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ROLES = ['admin', 'accountant', 'sales', 'purchases', 'hr', 'warehouse', 'viewer'];

const TABLES_CONFIG: Record<string, { label: string; fields: { key: string; label: string }[] }> = {
  customers: {
    label: 'العملاء',
    fields: [
      { key: 'name', label: 'الاسم' },
      { key: 'phone', label: 'الهاتف' },
      { key: 'id_number', label: 'رقم الهوية' },
      { key: 'tax_number', label: 'الرقم الضريبي' },
      { key: 'address', label: 'العنوان' },
      { key: 'balance', label: 'الرصيد' },
    ],
  },
  suppliers: {
    label: 'الموردين',
    fields: [
      { key: 'name', label: 'الاسم' },
      { key: 'phone', label: 'الهاتف' },
      { key: 'registration_number', label: 'السجل التجاري' },
      { key: 'address', label: 'العنوان' },
      { key: 'balance', label: 'الرصيد' },
    ],
  },
  invoices: {
    label: 'الفواتير',
    fields: [
      { key: 'invoice_number', label: 'رقم الفاتورة' },
      { key: 'customer_name', label: 'اسم العميل' },
      { key: 'total', label: 'الإجمالي' },
      { key: 'discount', label: 'الخصم' },
      { key: 'tax', label: 'الضريبة' },
      { key: 'cost_price', label: 'سعر التكلفة' },
      { key: 'profit', label: 'الربح' },
      { key: 'notes', label: 'ملاحظات' },
    ],
  },
  inventory_items: {
    label: 'المخزون',
    fields: [
      { key: 'item_name', label: 'اسم الصنف' },
      { key: 'cost_price', label: 'سعر التكلفة' },
      { key: 'selling_price', label: 'سعر البيع' },
      { key: 'quantity_on_hand', label: 'الكمية' },
      { key: 'minimum_price', label: 'أقل سعر بيع' },
      { key: 'wholesale_price', label: 'سعر الجملة' },
    ],
  },
  hr_employees: {
    label: 'الموظفين',
    fields: [
      { key: 'full_name', label: 'الاسم' },
      { key: 'phone', label: 'الهاتف' },
      { key: 'national_id', label: 'رقم الهوية' },
      { key: 'basic_salary', label: 'الراتب الأساسي' },
      { key: 'bank_iban', label: 'IBAN' },
    ],
  },
};

interface FieldPermission {
  id?: string;
  table_name: string;
  field_name: string;
  can_view: boolean;
  can_edit: boolean;
}

export function FieldLevelSecurityPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState('sales');
  const [selectedTable, setSelectedTable] = useState('customers');
  const [localPerms, setLocalPerms] = useState<Record<string, FieldPermission>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['field-permissions', companyId, selectedRole, selectedTable],
    queryFn: async () => {
      // field_permissions table removed during schema cleanup
      const permsMap: Record<string, FieldPermission> = {};
      const tableConfig = TABLES_CONFIG[selectedTable];
      tableConfig.fields.forEach(f => {
        permsMap[f.key] = {
          id: undefined,
          table_name: selectedTable,
          field_name: f.key,
          can_view: true,
          can_edit: true,
        };
      });
      setLocalPerms(permsMap);
      setHasChanges(false);
      return [] as any[];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      toast.info('ميزة صلاحيات الحقول قيد التطوير');
    },
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['field-permissions'] });
    },
    onError: () => toast.error('خطأ في حفظ الصلاحيات'),
  });

  const togglePerm = (fieldKey: string, type: 'can_view' | 'can_edit') => {
    setLocalPerms(prev => {
      const updated = { ...prev };
      const current = updated[fieldKey];
      if (type === 'can_view' && current.can_view) {
        updated[fieldKey] = { ...current, can_view: false, can_edit: false };
      } else if (type === 'can_edit') {
        updated[fieldKey] = { ...current, can_edit: !current.can_edit };
      } else {
        updated[fieldKey] = { ...current, [type]: !current[type] };
      }
      return updated;
    });
    setHasChanges(true);
  };

  const tableConfig = TABLES_CONFIG[selectedTable];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          صلاحيات الحقول (Field-Level Security)
        </h1>
        <p className="text-muted-foreground">تحكم في إظهار وتعديل كل حقل حسب الدور الوظيفي</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات الصلاحيات</CardTitle>
          <CardDescription>اختر الدور والجدول لتخصيص صلاحيات الحقول</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-1">
              <label className="text-sm font-medium">الدور الوظيفي</label>
              <Select value={selectedRole} onValueChange={v => { setSelectedRole(v); setHasChanges(false); }}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r} value={r}>
                      {r === 'admin' ? 'مدير' : r === 'accountant' ? 'محاسب' : r === 'sales' ? 'مبيعات' : r === 'purchases' ? 'مشتريات' : r === 'hr' ? 'موارد بشرية' : r === 'warehouse' ? 'مستودع' : 'مشاهد'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">الجدول</label>
              <Select value={selectedTable} onValueChange={v => { setSelectedTable(v); setHasChanges(false); }}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TABLES_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasChanges && (
              <div className="flex items-end">
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ التغييرات
                </Button>
              </div>
            )}
          </div>

          {selectedRole === 'admin' && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
              <Shield className="w-4 h-4 inline ml-1" />
              دور المدير لديه صلاحيات كاملة تلقائياً ولا يتأثر بهذه الإعدادات
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الحقل</TableHead>
                  <TableHead className="text-center w-32">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="w-4 h-4" /> عرض
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-32">
                    <div className="flex items-center justify-center gap-1">
                      <Pencil className="w-4 h-4" /> تعديل
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableConfig.fields.map(field => {
                  const perm = localPerms[field.key];
                  if (!perm) return null;
                  return (
                    <TableRow key={field.key}>
                      <TableCell className="font-medium">{field.label}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={perm.can_view}
                            onCheckedChange={() => togglePerm(field.key, 'can_view')}
                            disabled={selectedRole === 'admin'}
                          />
                          <Badge variant={perm.can_view ? 'default' : 'secondary'} className="text-xs w-14 justify-center">
                            {perm.can_view ? 'مفعّل' : 'مخفي'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={perm.can_edit}
                            onCheckedChange={() => togglePerm(field.key, 'can_edit')}
                            disabled={selectedRole === 'admin' || !perm.can_view}
                          />
                          <Badge variant={perm.can_edit ? 'default' : 'secondary'} className="text-xs w-14 justify-center">
                            {perm.can_edit ? 'مفعّل' : 'قراءة'}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
