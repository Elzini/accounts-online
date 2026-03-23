import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Eye, EyeOff, Pencil, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/ui/table-skeleton';

const TABLES = [
  { key: 'journal_entries', label: 'القيود المحاسبية' },
  { key: 'invoices', label: 'الفواتير' },
  { key: 'sales', label: 'المبيعات' },
  { key: 'customers', label: 'العملاء' },
  { key: 'suppliers', label: 'الموردين' },
  { key: 'hr_employees', label: 'الموظفين' },
  { key: 'payroll_records', label: 'الرواتب' },
  { key: 'bank_accounts', label: 'الحسابات البنكية' },
  { key: 'checks', label: 'الشيكات' },
  { key: 'cars', label: 'السيارات' },
];

const FIELDS: Record<string, { key: string; label: string }[]> = {
  hr_employees: [
    { key: 'salary', label: 'الراتب' },
    { key: 'phone', label: 'الهاتف' },
    { key: 'national_id', label: 'رقم الهوية' },
  ],
  bank_accounts: [
    { key: 'iban_encrypted', label: 'الآيبان' },
    { key: 'account_number_encrypted', label: 'رقم الحساب' },
  ],
  payroll_records: [
    { key: 'net_salary', label: 'صافي الراتب' },
    { key: 'deductions', label: 'الخصومات' },
  ],
  customers: [
    { key: 'phone', label: 'الهاتف' },
    { key: 'email', label: 'البريد' },
  ],
  suppliers: [
    { key: 'phone', label: 'الهاتف' },
    { key: 'tax_number', label: 'الرقم الضريبي' },
  ],
};

const ROLES = ['admin', 'accountant', 'sales', 'hr', 'purchases', 'viewer'];

export function EmployeePermissionsManager() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState('hr_employees');
  const [selectedRole, setSelectedRole] = useState('accountant');

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['field-permissions', companyId, selectedTable, selectedRole],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('field_permissions')
        .select('*')
        .eq('company_id', companyId)
        .eq('table_name', selectedTable)
        .eq('role_name', selectedRole);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const togglePermission = useMutation({
    mutationFn: async ({ fieldName, canView, canEdit }: { fieldName: string; canView: boolean; canEdit: boolean }) => {
      if (!companyId) throw new Error('لا يوجد سياق شركة');
      const existing = permissions.find((p: any) => p.field_name === fieldName);
      if (existing) {
        const { error } = await supabase
          .from('field_permissions')
          .update({ can_view: canView, can_edit: canEdit, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('field_permissions')
          .insert({ company_id: companyId, table_name: selectedTable, role_name: selectedRole, field_name: fieldName, can_view: canView, can_edit: canEdit });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-permissions', companyId, selectedTable, selectedRole] });
      toast.success('تم تحديث الصلاحية');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const fields = FIELDS[selectedTable] || [{ key: 'all', label: 'جميع الحقول' }];

  const getPermission = (fieldName: string) => {
    const perm = permissions.find((p: any) => p.field_name === fieldName);
    return { canView: perm?.can_view ?? true, canEdit: perm?.can_edit ?? true };
  };

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          إدارة صلاحيات الموظفين
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="الدور" /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r === 'admin' ? 'مدير' : r === 'accountant' ? 'محاسب' : r === 'sales' ? 'مبيعات' : r === 'hr' ? 'موارد بشرية' : r === 'purchases' ? 'مشتريات' : 'مشاهد'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="الجدول" /></SelectTrigger>
            <SelectContent>
              {TABLES.map((t) => (
                <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="text-center py-8"><TableSkeleton columns={3} rows={4} /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الحقل</TableHead>
                  <TableHead className="text-center"><Eye className="h-4 w-4 mx-auto" /> عرض</TableHead>
                  <TableHead className="text-center"><Pencil className="h-4 w-4 mx-auto" /> تعديل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field) => {
                  const perm = getPermission(field.key);
                  return (
                    <TableRow key={field.key}>
                      <TableCell className="font-medium">{field.label}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={perm.canView}
                          onCheckedChange={(checked) =>
                            togglePermission.mutate({ fieldName: field.key, canView: checked, canEdit: checked ? perm.canEdit : false })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={perm.canEdit}
                          disabled={!perm.canView}
                          onCheckedChange={(checked) =>
                            togglePermission.mutate({ fieldName: field.key, canView: perm.canView, canEdit: checked })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <span>ملاحظة: تغيير الصلاحيات يطبق فوراً على جميع مستخدمي الدور المحدد في هذه الشركة</span>
        </div>
      </CardContent>
    </Card>
  );
}
