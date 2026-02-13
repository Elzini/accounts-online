import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useHREmployees, useCreateHREmployee, useUpdateHREmployee, useDeleteHREmployee } from '@/hooks/useHR';
import { HREmployee } from '@/services/hr';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Users, Search } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';

const defaultForm = {
  full_name: '', job_title: '', department: '', base_salary: 0,
  housing_allowance: 0, transport_allowance: 0, other_allowances: 0,
  phone: '', national_id: '', email: '', bank_name: '', iban: '',
  contract_type: 'full_time',
  hire_date: new Date().toISOString().split('T')[0], is_active: true, notes: '',
};

export function EmployeesPage() {
  const { data: employees = [], isLoading } = useHREmployees();
  const createEmployee = useCreateHREmployee();
  const updateEmployee = useUpdateHREmployee();
  const deleteEmployee = useDeleteHREmployee();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<HREmployee | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...defaultForm });

  const resetForm = () => { setFormData({ ...defaultForm }); setEditingEmployee(null); };

  const openEditDialog = (emp: HREmployee) => {
    setEditingEmployee(emp);
    setFormData({
      full_name: emp.full_name, job_title: emp.job_title || '', department: emp.department || '',
      base_salary: emp.base_salary, housing_allowance: emp.housing_allowance,
      transport_allowance: emp.transport_allowance, other_allowances: emp.other_allowances,
      phone: emp.phone || '', national_id: emp.national_id || '', email: emp.email || '',
      bank_name: emp.bank_name || '', iban: emp.iban || '', contract_type: emp.contract_type,
      hire_date: emp.hire_date || new Date().toISOString().split('T')[0],
      is_active: emp.is_active, notes: emp.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await updateEmployee.mutateAsync({ id: editingEmployee.id, ...formData });
        toast.success(t.employee_updated);
      } else {
        await createEmployee.mutateAsync(formData);
        toast.success(t.employee_added);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch { toast.error(t.error_occurred); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEmployee.mutateAsync(deleteId);
      toast.success(t.employee_deleted);
      setDeleteId(null);
    } catch { toast.error(t.error_occurred); }
  };

  const filtered = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.job_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fmt = (n: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Users className="w-6 h-6" />{t.employees_title}</h1>
          <p className="text-muted-foreground">{t.employees_subtitle}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.add_employee}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingEmployee ? t.edit_employee : t.add_new_employee}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t.employee_name} *</Label><Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required /></div>
                <div className="space-y-2"><Label>{t.job_title}</Label><Input value={formData.job_title} onChange={e => setFormData({ ...formData, job_title: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t.department || 'القسم'}</Label><Input value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t.email || 'البريد الإلكتروني'}</Label><Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2"><Label>{t.base_salary}</Label><Input type="number" value={formData.base_salary} onChange={e => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>{t.housing_allowance}</Label><Input type="number" value={formData.housing_allowance} onChange={e => setFormData({ ...formData, housing_allowance: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>{t.transport_allowance}</Label><Input type="number" value={formData.transport_allowance} onChange={e => setFormData({ ...formData, transport_allowance: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>{'بدلات أخرى'}</Label><Input type="number" value={formData.other_allowances} onChange={e => setFormData({ ...formData, other_allowances: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t.phone}</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t.id_number}</Label><Input value={formData.national_id} onChange={e => setFormData({ ...formData, national_id: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t.bank_name}</Label><Input value={formData.bank_name} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t.iban_number}</Label><Input value={formData.iban} onChange={e => setFormData({ ...formData, iban: e.target.value })} dir="ltr" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t.hire_date}</Label><Input type="date" value={formData.hire_date} onChange={e => setFormData({ ...formData, hire_date: e.target.value })} /></div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <Label>{t.active_status}</Label>
                  <Switch checked={formData.is_active} onCheckedChange={checked => setFormData({ ...formData, is_active: checked })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t.cancel}</Button>
                <Button type="submit" disabled={createEmployee.isPending || updateEmployee.isPending}>
                  {(createEmployee.isPending || updateEmployee.isPending) && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  {editingEmployee ? t.update_btn : t.add}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{employees.length}</div><p className="text-sm text-muted-foreground">{t.total_employees}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{employees.filter(e => e.is_active).length}</div><p className="text-sm text-muted-foreground">{t.active_employees}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{fmt(employees.reduce((s, e) => s + e.base_salary, 0))}</div><p className="text-sm text-muted-foreground">{t.total_base_salaries}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{fmt(employees.reduce((s, e) => s + e.base_salary + e.housing_allowance + e.transport_allowance + e.other_allowances, 0))}</div><p className="text-sm text-muted-foreground">{t.total_with_allowances}</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t.search_employee} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
        </div>
      </CardContent></Card>

      <Card>
        <CardHeader><CardTitle>{t.employees_list}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead className="text-right">{t.name}</TableHead>
                  <TableHead className="text-right">{t.department || 'القسم'}</TableHead>
                  <TableHead className="text-right">{t.job_title}</TableHead>
                  <TableHead className="text-right">{t.base_salary}</TableHead>
                  <TableHead className="text-right">{t.housing_allowance}</TableHead>
                  <TableHead className="text-right">{t.transport_allowance}</TableHead>
                  <TableHead className="text-right">{t.total}</TableHead>
                  <TableHead className="text-right">{t.status}</TableHead>
                  <TableHead className="text-center">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp, idx) => {
                  const total = emp.base_salary + emp.housing_allowance + emp.transport_allowance + emp.other_allowances;
                  return (
                    <TableRow key={emp.id}>
                      <TableCell>{emp.employee_number || idx + 1}</TableCell>
                      <TableCell className="font-medium">{emp.full_name}</TableCell>
                      <TableCell>{emp.department || '-'}</TableCell>
                      <TableCell>{emp.job_title || '-'}</TableCell>
                      <TableCell>{fmt(emp.base_salary)}</TableCell>
                      <TableCell>{fmt(emp.housing_allowance)}</TableCell>
                      <TableCell>{fmt(emp.transport_allowance)}</TableCell>
                      <TableCell className="font-bold">{fmt(total)}</TableCell>
                      <TableCell><Badge variant={emp.is_active ? 'default' : 'secondary'}>{emp.is_active ? t.active_status : t.inactive_status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(emp)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(emp.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">{t.no_employees}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirm_delete}</AlertDialogTitle>
            <AlertDialogDescription>{t.employee_delete_confirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
