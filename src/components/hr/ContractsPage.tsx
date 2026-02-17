import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Plus, FileText, CheckCircle, AlertTriangle, Clock, Trash2, Lock, PlusCircle, MinusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHREmployees } from '@/hooks/useHR';

interface AllowanceItem {
  name: string;
  formula: string;
  amount: string;
}

const initialForm = {
  employeeId: '',
  employeeName: '',
  contractCode: '',
  contractType: 'full-time',
  position: '',
  jobLevel: '',
  mainContract: '',
  description: '',
  startDate: '',
  autoRenew: false,
  durationType: 'duration' as 'duration' | 'end_date',
  durationValue: '1',
  durationUnit: 'year',
  endDate: '',
  joinDate: '',
  probationEndDate: '',
  signingDate: new Date().toISOString().split('T')[0],
  currency: 'SAR',
  payCycle: 'monthly',
  basicSalary: '',
  housingAllowance: '',
  transportAllowance: '',
  department: '',
};

export function EmployeeContractsPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [otherAllowances, setOtherAllowances] = useState<AllowanceItem[]>([]);
  const [deductions, setDeductions] = useState<AllowanceItem[]>([]);

  const { data: hrEmployees = [] } = useHREmployees();

  const typeLabels: Record<string, string> = {
    'full-time': t.ec_type_fulltime,
    'part-time': t.ec_type_parttime,
    temporary: t.ec_type_temporary,
  };

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['employee-contracts', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_contracts')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('employee_contracts').insert({
        company_id: companyId!,
        employee_id: form.employeeId || null,
        employee_name: form.employeeName,
        contract_code: form.contractCode || null,
        contract_type: form.contractType,
        position: form.position || null,
        job_level: form.jobLevel || null,
        main_contract: form.mainContract || null,
        description: form.description || null,
        start_date: form.startDate,
        auto_renew: form.autoRenew,
        duration_type: form.durationType,
        duration_value: Number(form.durationValue) || 1,
        duration_unit: form.durationUnit,
        end_date: form.durationType === 'end_date' ? form.endDate || null : null,
        join_date: form.joinDate || null,
        probation_end_date: form.probationEndDate || null,
        signing_date: form.signingDate || null,
        currency: form.currency,
        pay_cycle: form.payCycle,
        salary: Number(form.basicSalary) || 0,
        housing_allowance: Number(form.housingAllowance) || 0,
        transport_allowance: Number(form.transportAllowance) || 0,
        other_allowances_json: otherAllowances,
        deductions_json: deductions,
        department: form.department || null,
        status: 'active',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-contracts'] });
      toast.success(t.ec_created);
      setShowAdd(false);
      setForm(initialForm);
      setOtherAllowances([]);
      setDeductions([]);
    },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employee_contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-contracts'] });
      toast.success(t.mod_deleted);
    },
  });

  const handleEmployeeSelect = (empId: string) => {
    const emp = hrEmployees.find((e: any) => e.id === empId);
    if (emp) {
      setForm(p => ({
        ...p,
        employeeId: emp.id,
        employeeName: emp.full_name,
        position: emp.job_title || '',
        department: emp.department || '',
      }));
    }
  };

  const addAllowanceRow = (type: 'allowance' | 'deduction') => {
    const newItem: AllowanceItem = { name: '', formula: '', amount: '' };
    if (type === 'allowance') setOtherAllowances(prev => [...prev, newItem]);
    else setDeductions(prev => [...prev, newItem]);
  };

  const updateRow = (type: 'allowance' | 'deduction', index: number, field: keyof AllowanceItem, value: string) => {
    const setter = type === 'allowance' ? setOtherAllowances : setDeductions;
    setter(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeRow = (type: 'allowance' | 'deduction', index: number) => {
    const setter = type === 'allowance' ? setOtherAllowances : setDeductions;
    setter(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.ec_title}</h1>
          <p className="text-muted-foreground">{t.ec_subtitle}</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />{t.ec_new}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{t.ec_new_title}</DialogTitle></DialogHeader>

            {/* Section 1: Contract Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t.ec_contract_info}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Employee & Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t.ec_employee} *</Label>
                    <Select value={form.employeeId} onValueChange={handleEmployeeSelect}>
                      <SelectTrigger><SelectValue placeholder={t.ec_select_employee} /></SelectTrigger>
                      <SelectContent>
                        {hrEmployees.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name} {emp.department ? `- ${emp.department}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.ec_contract_code} *</Label>
                    <Input value={form.contractCode} onChange={e => setForm(p => ({ ...p, contractCode: e.target.value }))} />
                  </div>
                </div>

                {/* Job Title & Job Level */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t.ec_position}</Label>
                    <Input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} placeholder={t.ec_select_job_title} />
                  </div>
                  <div>
                    <Label>{t.ec_job_level}</Label>
                    <Select value={form.jobLevel} onValueChange={v => setForm(p => ({ ...p, jobLevel: v }))}>
                      <SelectTrigger><SelectValue placeholder={t.ec_select_job_level} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">{t.ec_level_junior}</SelectItem>
                        <SelectItem value="mid">{t.ec_level_mid}</SelectItem>
                        <SelectItem value="senior">{t.ec_level_senior}</SelectItem>
                        <SelectItem value="lead">{t.ec_level_lead}</SelectItem>
                        <SelectItem value="manager">{t.ec_level_manager}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Main Contract & Description */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t.ec_main_contract}</Label>
                    <Select value={form.mainContract} onValueChange={v => setForm(p => ({ ...p, mainContract: v }))}>
                      <SelectTrigger><SelectValue placeholder={t.ec_select_main_contract} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">{t.ec_type_fulltime}</SelectItem>
                        <SelectItem value="part-time">{t.ec_type_parttime}</SelectItem>
                        <SelectItem value="temporary">{t.ec_type_temporary}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.ec_description}</Label>
                    <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder={t.ec_enter_description} rows={2} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Dates */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Start Date & Auto Renew */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t.ec_start_date} *</Label>
                    <Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox
                      id="autoRenew"
                      checked={form.autoRenew}
                      onCheckedChange={(v) => setForm(p => ({ ...p, autoRenew: !!v }))}
                    />
                    <Label htmlFor="autoRenew" className="cursor-pointer">{t.ec_auto_renew}</Label>
                  </div>
                </div>

                {/* Duration Type Toggle */}
                <RadioGroup
                  value={form.durationType}
                  onValueChange={(v) => setForm(p => ({ ...p, durationType: v as 'duration' | 'end_date' }))}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="duration" id="dt-duration" />
                    <Label htmlFor="dt-duration" className="cursor-pointer">{t.ec_duration} *</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="end_date" id="dt-end" />
                    <Label htmlFor="dt-end" className="cursor-pointer">{t.ec_end_date_option} *</Label>
                  </div>
                </RadioGroup>

                {form.durationType === 'duration' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input type="number" min="1" value={form.durationValue} onChange={e => setForm(p => ({ ...p, durationValue: e.target.value }))} />
                    </div>
                    <div>
                      <Select value={form.durationUnit} onValueChange={v => setForm(p => ({ ...p, durationUnit: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="year">{t.ec_unit_year}</SelectItem>
                          <SelectItem value="month">{t.ec_unit_month}</SelectItem>
                          <SelectItem value="day">{t.ec_unit_day}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                  </div>
                )}

                <Separator />

                {/* Join Date & Probation End */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t.ec_join_date} *</Label>
                    <Input type="date" value={form.joinDate} onChange={e => setForm(p => ({ ...p, joinDate: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{t.ec_probation_end} *</Label>
                    <Input type="date" value={form.probationEndDate} onChange={e => setForm(p => ({ ...p, probationEndDate: e.target.value }))} />
                  </div>
                </div>

                <Separator />

                {/* Signing Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t.ec_signing_date}</Label>
                    <Input type="date" value={form.signingDate} onChange={e => setForm(p => ({ ...p, signingDate: e.target.value }))} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Salary Data */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t.ec_salary_data}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Currency & Pay Cycle */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t.ec_currency} *</Label>
                    <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.ec_pay_cycle} *</Label>
                    <Select value={form.payCycle} onValueChange={v => setForm(p => ({ ...p, payCycle: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">{t.ec_pay_monthly}</SelectItem>
                        <SelectItem value="weekly">{t.ec_pay_weekly}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Earnings */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">{t.ec_earnings}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>{t.ec_salary_item}</TableHead>
                        <TableHead>{t.ec_formula}</TableHead>
                        <TableHead>{t.ec_amount}</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Basic Salary - locked */}
                      <TableRow>
                        <TableCell><Lock className="w-4 h-4 text-muted-foreground" /></TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            Basic
                            <Badge variant="outline" className="text-xs">{t.ec_main}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="bg-muted/50"></TableCell>
                        <TableCell>
                          <Input type="number" value={form.basicSalary} onChange={e => setForm(p => ({ ...p, basicSalary: e.target.value }))} placeholder={t.ec_enter_value} className="h-8" />
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      {/* Housing Allowance */}
                      <TableRow>
                        <TableCell></TableCell>
                        <TableCell>{t.ec_housing_allowance}</TableCell>
                        <TableCell>
                          <Input placeholder={t.ec_enter_formula} className="h-8" disabled />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={form.housingAllowance} onChange={e => setForm(p => ({ ...p, housingAllowance: e.target.value }))} placeholder={t.ec_enter_value} className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setForm(p => ({ ...p, housingAllowance: '' }))}>
                            <MinusCircle className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {/* Transport Allowance */}
                      <TableRow>
                        <TableCell></TableCell>
                        <TableCell>{t.ec_transport_allowance}</TableCell>
                        <TableCell>
                          <Input placeholder={t.ec_enter_formula} className="h-8" disabled />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={form.transportAllowance} onChange={e => setForm(p => ({ ...p, transportAllowance: e.target.value }))} placeholder={t.ec_enter_value} className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setForm(p => ({ ...p, transportAllowance: '' }))}>
                            <MinusCircle className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {/* Dynamic allowances */}
                      {otherAllowances.map((item, idx) => (
                        <TableRow key={`a-${idx}`}>
                          <TableCell></TableCell>
                          <TableCell>
                            <Input value={item.name} onChange={e => updateRow('allowance', idx, 'name', e.target.value)} className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Input value={item.formula} onChange={e => updateRow('allowance', idx, 'formula', e.target.value)} placeholder={t.ec_enter_formula} className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={item.amount} onChange={e => updateRow('allowance', idx, 'amount', e.target.value)} placeholder={t.ec_enter_value} className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeRow('allowance', idx)}>
                              <MinusCircle className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => addAllowanceRow('allowance')}>
                    <PlusCircle className="w-4 h-4" />{t.ec_add_item}
                  </Button>
                </div>

                {/* Deductions */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">{t.ec_deductions}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.ec_salary_item}</TableHead>
                        <TableHead>{t.ec_formula}</TableHead>
                        <TableHead>{t.ec_amount}</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deductions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-4">—</TableCell>
                        </TableRow>
                      )}
                      {deductions.map((item, idx) => (
                        <TableRow key={`d-${idx}`}>
                          <TableCell>
                            <Input value={item.name} onChange={e => updateRow('deduction', idx, 'name', e.target.value)} className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Input value={item.formula} onChange={e => updateRow('deduction', idx, 'formula', e.target.value)} placeholder={t.ec_enter_formula} className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={item.amount} onChange={e => updateRow('deduction', idx, 'amount', e.target.value)} placeholder={t.ec_enter_value} className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeRow('deduction', idx)}>
                              <MinusCircle className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => addAllowanceRow('deduction')}>
                    <PlusCircle className="w-4 h-4" />{t.ec_add_item}
                  </Button>
                </div>

                {/* Submit */}
                <Button
                  className="w-full"
                  onClick={() => addMutation.mutate()}
                  disabled={addMutation.isPending || !form.employeeName || !form.startDate}
                >
                  {t.save}
                </Button>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><FileText className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{contracts.length}</div><p className="text-sm text-muted-foreground">{t.ec_total_contracts}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{contracts.filter((c: any) => c.status === 'active').length}</div><p className="text-sm text-muted-foreground">{t.ec_active}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">{contracts.filter((c: any) => c.status === 'expiring_soon').length}</div><p className="text-sm text-muted-foreground">{t.ec_expiring_soon}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{contracts.filter((c: any) => c.status === 'expired').length}</div><p className="text-sm text-muted-foreground">{t.ec_expired}</p></CardContent></Card>
      </div>

      {/* Contracts Table */}
      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : contracts.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.ec_no_contracts}</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t.ec_employee}</TableHead>
              <TableHead>{t.ec_department}</TableHead>
              <TableHead>{t.ec_type}</TableHead>
              <TableHead>{t.ec_position}</TableHead>
              <TableHead>{t.ec_start}</TableHead>
              <TableHead>{t.ec_end}</TableHead>
              <TableHead>{t.ec_salary}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>{t.actions}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {contracts.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.employee_name}</TableCell>
                  <TableCell>{c.department || '-'}</TableCell>
                  <TableCell>{typeLabels[c.contract_type] || c.contract_type}</TableCell>
                  <TableCell>{c.position || '-'}</TableCell>
                  <TableCell>{c.start_date}</TableCell>
                  <TableCell>{c.end_date || '-'}</TableCell>
                  <TableCell>{Number(c.salary || 0).toLocaleString()} {c.currency || t.mod_currency}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'active' ? 'default' : c.status === 'expired' ? 'destructive' : 'secondary'}>
                      {c.status === 'active' ? t.ec_status_active : c.status === 'expiring_soon' ? t.ec_status_expiring : t.ec_status_expired}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(c.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
