import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, GraduationCap, Shield, Star, Award, CheckCircle, UserCheck, Plus, Trash2 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  useHREmployees, useCreateHREmployee, useDeleteHREmployee,
  useHRInsurance, useUpsertHRInsurance,
  useHREvaluations, useCreateHREvaluation,
  useHRTrainingCourses, useCreateHRTrainingCourse, useDeleteHRTrainingCourse,
} from '@/hooks/useHR';

export function AdvancedHRPluginPage() {
  const { t, direction, language } = useLanguage();
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddEval, setShowAddEval] = useState(false);

  const [empForm, setEmpForm] = useState({ full_name: '', department: '', job_title: '', phone: '', base_salary: 0 });
  const [courseForm, setCourseForm] = useState({ name: '', provider: '', course_date: '', status: 'upcoming' });
  const [evalForm, setEvalForm] = useState({ employee_id: '', overall_score: 0, evaluation_period: '', strengths: '', weaknesses: '' });
  const [insForm, setInsForm] = useState({ employee_id: '', gosi_number: '', status: 'pending' });

  const { data: employees = [], isLoading: empLoading } = useHREmployees();
  const { data: insurance = [] } = useHRInsurance();
  const { data: evaluations = [] } = useHREvaluations();
  const { data: courses = [] } = useHRTrainingCourses();

  const createEmp = useCreateHREmployee();
  const deleteEmp = useDeleteHREmployee();
  const upsertIns = useUpsertHRInsurance();
  const createEval = useCreateHREvaluation();
  const createCourse = useCreateHRTrainingCourse();
  const deleteCourse = useDeleteHRTrainingCourse();

  const handleAddEmployee = () => {
    if (!empForm.full_name) return toast.error(t.hr_name_required);
    createEmp.mutate(empForm, {
      onSuccess: () => { toast.success(t.hr_employee_added); setShowAddEmployee(false); setEmpForm({ full_name: '', department: '', job_title: '', phone: '', base_salary: 0 }); },
    });
  };

  const handleAddCourse = () => {
    if (!courseForm.name) return toast.error(t.hr_course_name_required);
    createCourse.mutate(courseForm, {
      onSuccess: () => { toast.success(t.hr_course_added); setShowAddCourse(false); setCourseForm({ name: '', provider: '', course_date: '', status: 'upcoming' }); },
    });
  };

  const handleAddEvaluation = () => {
    if (!evalForm.employee_id) return toast.error(t.hr_select_employee_required);
    createEval.mutate(evalForm, {
      onSuccess: () => { toast.success(t.hr_eval_added); setShowAddEval(false); setEvalForm({ employee_id: '', overall_score: 0, evaluation_period: '', strengths: '', weaknesses: '' }); },
    });
  };

  const handleRegisterInsurance = () => {
    if (!insForm.employee_id) return toast.error(t.hr_select_employee_required);
    upsertIns.mutate(insForm, {
      onSuccess: () => { toast.success(t.hr_insurance_registered); setInsForm({ employee_id: '', gosi_number: '', status: 'pending' }); },
    });
  };

  const activeCount = employees.filter(e => e.is_active).length;
  const insuredCount = insurance.filter((i: any) => i.status === 'registered').length;
  const avgScore = evaluations.length > 0 
    ? (evaluations.reduce((s: number, e: any) => s + Number(e.overall_score || 0), 0) / evaluations.length).toFixed(1) 
    : '0';

  const currencyLabel = language === 'en' ? 'SAR' : 'ر.س';

  return (
    <div className="space-y-6 animate-fade-in" dir={direction}>
      <div className="flex items-center gap-4">
        <div className="text-4xl">👥</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.hr_title}</h1>
          <p className="text-muted-foreground">{t.hr_subtitle}</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1"><CheckCircle className="w-3 h-3 text-green-500" />v1.5.0</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Users className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{activeCount}</p><p className="text-xs text-muted-foreground">{t.hr_total_employees}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Shield className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold">{insuredCount}</p><p className="text-xs text-muted-foreground">{t.hr_insured}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <GraduationCap className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{courses.length}</p><p className="text-xs text-muted-foreground">{t.hr_training_courses}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Star className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <p className="text-2xl font-bold">{avgScore}</p><p className="text-xs text-muted-foreground">{t.hr_avg_evaluation}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees" className="gap-2"><Users className="w-4 h-4" />{t.hr_tab_employees}</TabsTrigger>
          <TabsTrigger value="insurance" className="gap-2"><Shield className="w-4 h-4" />{t.hr_tab_insurance}</TabsTrigger>
          <TabsTrigger value="evaluation" className="gap-2"><Star className="w-4 h-4" />{t.hr_tab_evaluation}</TabsTrigger>
          <TabsTrigger value="training" className="gap-2"><GraduationCap className="w-4 h-4" />{t.hr_tab_training}</TabsTrigger>
        </TabsList>

        {/* EMPLOYEES TAB */}
        <TabsContent value="employees" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t.hr_employee_record}</CardTitle>
              <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 me-1" />{t.hr_add_employee}</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t.hr_add_new_employee}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>{t.hr_full_name} *</Label><Input value={empForm.full_name} onChange={e => setEmpForm(p => ({ ...p, full_name: e.target.value }))} /></div>
                    <div><Label>{t.hr_department}</Label><Input value={empForm.department} onChange={e => setEmpForm(p => ({ ...p, department: e.target.value }))} /></div>
                    <div><Label>{t.hr_job_title}</Label><Input value={empForm.job_title} onChange={e => setEmpForm(p => ({ ...p, job_title: e.target.value }))} /></div>
                    <div><Label>{t.hr_phone}</Label><Input value={empForm.phone} onChange={e => setEmpForm(p => ({ ...p, phone: e.target.value }))} /></div>
                    <div><Label>{t.hr_base_salary}</Label><Input type="number" value={empForm.base_salary} onChange={e => setEmpForm(p => ({ ...p, base_salary: Number(e.target.value) }))} /></div>
                    <Button onClick={handleAddEmployee} disabled={createEmp.isPending} className="w-full">{createEmp.isPending ? t.hr_saving : t.hr_save}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {empLoading ? <p className="text-center py-8 text-muted-foreground">{t.hr_loading}</p> : employees.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{t.hr_no_employees}</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>{t.hr_name}</TableHead><TableHead>{t.hr_department}</TableHead><TableHead>{t.hr_job_title}</TableHead><TableHead>{t.hr_salary}</TableHead><TableHead>{t.hr_status}</TableHead><TableHead>{t.hr_actions}</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {employees.map(emp => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                        <TableCell>{emp.department || '-'}</TableCell>
                        <TableCell>{emp.job_title || '-'}</TableCell>
                        <TableCell>{Number(emp.base_salary).toLocaleString()} {currencyLabel}</TableCell>
                        <TableCell><Badge variant={emp.is_active ? 'default' : 'secondary'}>{emp.is_active ? t.hr_active : t.hr_inactive}</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(t.hr_confirm_delete)) deleteEmp.mutate(emp.id, { onSuccess: () => toast.success(t.hr_deleted) }); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* INSURANCE TAB */}
        <TabsContent value="insurance" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t.hr_insurance_title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label>{t.hr_tab_employees}</Label>
                  <Select value={insForm.employee_id} onValueChange={v => setInsForm(p => ({ ...p, employee_id: v }))}>
                    <SelectTrigger><SelectValue placeholder={t.hr_select_employee} /></SelectTrigger>
                    <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>{t.hr_gosi_number}</Label><Input value={insForm.gosi_number} onChange={e => setInsForm(p => ({ ...p, gosi_number: e.target.value }))} /></div>
                <div className="flex items-end"><Button onClick={handleRegisterInsurance} disabled={upsertIns.isPending}><UserCheck className="w-4 h-4 me-1" />{t.hr_register}</Button></div>
              </div>
              {insurance.length > 0 && (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>{t.hr_name}</TableHead><TableHead>{t.hr_department}</TableHead><TableHead>{t.hr_gosi_number}</TableHead><TableHead>{t.hr_status}</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {insurance.map((rec: any) => (
                      <TableRow key={rec.id}>
                        <TableCell className="font-medium">{rec.hr_employees?.full_name}</TableCell>
                        <TableCell>{rec.hr_employees?.department || '-'}</TableCell>
                        <TableCell className="font-mono">{rec.gosi_number || '-'}</TableCell>
                        <TableCell><Badge variant={rec.status === 'registered' ? 'default' : 'outline'}>{rec.status === 'registered' ? t.hr_gosi_status_registered : rec.status === 'pending' ? t.hr_gosi_status_pending : rec.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EVALUATION TAB */}
        <TabsContent value="evaluation" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t.hr_evaluation_title}</CardTitle>
              <Dialog open={showAddEval} onOpenChange={setShowAddEval}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 me-1" />{t.hr_new_evaluation}</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t.hr_add_evaluation}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>{t.hr_tab_employees} *</Label>
                      <Select value={evalForm.employee_id} onValueChange={v => setEvalForm(p => ({ ...p, employee_id: v }))}>
                        <SelectTrigger><SelectValue placeholder={t.hr_select_employee} /></SelectTrigger>
                        <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>{t.hr_period}</Label><Input placeholder={t.hr_period_placeholder} value={evalForm.evaluation_period} onChange={e => setEvalForm(p => ({ ...p, evaluation_period: e.target.value }))} /></div>
                    <div><Label>{t.hr_score}</Label><Input type="number" min={0} max={5} step={0.1} value={evalForm.overall_score} onChange={e => setEvalForm(p => ({ ...p, overall_score: Number(e.target.value) }))} /></div>
                    <div><Label>{t.hr_strengths}</Label><Input value={evalForm.strengths} onChange={e => setEvalForm(p => ({ ...p, strengths: e.target.value }))} /></div>
                    <div><Label>{t.hr_improvements}</Label><Input value={evalForm.weaknesses} onChange={e => setEvalForm(p => ({ ...p, weaknesses: e.target.value }))} /></div>
                    <Button onClick={handleAddEvaluation} disabled={createEval.isPending} className="w-full">{t.hr_save_evaluation}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {evaluations.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{t.hr_no_evaluations}</p>
              ) : evaluations.map((ev: any) => (
                <div key={ev.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">{ev.hr_employees?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{ev.hr_employees?.department} • {ev.evaluation_period || '-'}</p>
                  </div>
                  <div className="flex items-center gap-2 w-48">
                    <Progress value={Number(ev.overall_score) * 20} className="flex-1" />
                    <span className="text-sm font-bold">{Number(ev.overall_score).toFixed(1)}/5</span>
                  </div>
                  <Award className="w-5 h-5 text-yellow-500" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRAINING TAB */}
        <TabsContent value="training" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t.hr_training_title}</CardTitle>
              <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 me-1" />{t.hr_new_course}</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t.hr_add_course}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>{t.hr_course_name} *</Label><Input value={courseForm.name} onChange={e => setCourseForm(p => ({ ...p, name: e.target.value }))} /></div>
                    <div><Label>{t.hr_provider}</Label><Input value={courseForm.provider} onChange={e => setCourseForm(p => ({ ...p, provider: e.target.value }))} /></div>
                    <div><Label>{t.hr_date}</Label><Input type="date" value={courseForm.course_date} onChange={e => setCourseForm(p => ({ ...p, course_date: e.target.value }))} /></div>
                    <Button onClick={handleAddCourse} disabled={createCourse.isPending} className="w-full">{t.hr_save}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{t.hr_no_courses}</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>{t.hr_course_name}</TableHead><TableHead>{t.hr_provider}</TableHead><TableHead>{t.hr_date}</TableHead><TableHead>{t.hr_status}</TableHead><TableHead>{t.hr_actions}</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {courses.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.provider || '-'}</TableCell>
                        <TableCell>{c.course_date || '-'}</TableCell>
                        <TableCell><Badge variant={c.status === 'completed' ? 'default' : 'outline'}>{c.status === 'completed' ? t.hr_course_completed : c.status === 'upcoming' ? t.hr_course_upcoming : c.status}</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteCourse.mutate(c.id, { onSuccess: () => toast.success(t.hr_deleted) })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
