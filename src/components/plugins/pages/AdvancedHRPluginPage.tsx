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
  Users, GraduationCap, Shield, Star, Award, CheckCircle, UserCheck, Plus, Trash2, Edit 
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
  const { t, direction } = useLanguage();
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddEval, setShowAddEval] = useState(false);

  // Form states
  const [empForm, setEmpForm] = useState({ full_name: '', department: '', job_title: '', phone: '', base_salary: 0 });
  const [courseForm, setCourseForm] = useState({ name: '', provider: '', course_date: '', status: 'upcoming' });
  const [evalForm, setEvalForm] = useState({ employee_id: '', overall_score: 0, evaluation_period: '', strengths: '', weaknesses: '' });
  const [insForm, setInsForm] = useState({ employee_id: '', gosi_number: '', status: 'pending' });

  // Queries
  const { data: employees = [], isLoading: empLoading } = useHREmployees();
  const { data: insurance = [] } = useHRInsurance();
  const { data: evaluations = [] } = useHREvaluations();
  const { data: courses = [] } = useHRTrainingCourses();

  // Mutations
  const createEmp = useCreateHREmployee();
  const deleteEmp = useDeleteHREmployee();
  const upsertIns = useUpsertHRInsurance();
  const createEval = useCreateHREvaluation();
  const createCourse = useCreateHRTrainingCourse();
  const deleteCourse = useDeleteHRTrainingCourse();

  const handleAddEmployee = () => {
    if (!empForm.full_name) return toast.error('اسم الموظف مطلوب');
    createEmp.mutate(empForm, {
      onSuccess: () => { toast.success('تم إضافة الموظف'); setShowAddEmployee(false); setEmpForm({ full_name: '', department: '', job_title: '', phone: '', base_salary: 0 }); },
    });
  };

  const handleAddCourse = () => {
    if (!courseForm.name) return toast.error('اسم الدورة مطلوب');
    createCourse.mutate(courseForm, {
      onSuccess: () => { toast.success('تم إضافة الدورة'); setShowAddCourse(false); setCourseForm({ name: '', provider: '', course_date: '', status: 'upcoming' }); },
    });
  };

  const handleAddEvaluation = () => {
    if (!evalForm.employee_id) return toast.error('اختر موظف');
    createEval.mutate(evalForm, {
      onSuccess: () => { toast.success('تم إضافة التقييم'); setShowAddEval(false); setEvalForm({ employee_id: '', overall_score: 0, evaluation_period: '', strengths: '', weaknesses: '' }); },
    });
  };

  const handleRegisterInsurance = () => {
    if (!insForm.employee_id) return toast.error('اختر موظف');
    upsertIns.mutate(insForm, {
      onSuccess: () => { toast.success('تم تسجيل التأمين'); setInsForm({ employee_id: '', gosi_number: '', status: 'pending' }); },
    });
  };

  const activeCount = employees.filter(e => e.is_active).length;
  const insuredCount = insurance.filter((i: any) => i.status === 'registered').length;
  const avgScore = evaluations.length > 0 
    ? (evaluations.reduce((s: number, e: any) => s + Number(e.overall_score || 0), 0) / evaluations.length).toFixed(1) 
    : '0';

  return (
    <div className="space-y-6 animate-fade-in" dir={direction}>
      <div className="flex items-center gap-4">
        <div className="text-4xl">👥</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.hr_title || 'الموارد البشرية المتقدمة'}</h1>
          <p className="text-muted-foreground">{t.hr_subtitle || 'إدارة شاملة للموظفين والتأمينات والتقييم والتدريب'}</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1"><CheckCircle className="w-3 h-3 text-green-500" />v1.5.0</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Users className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{activeCount}</p><p className="text-xs text-muted-foreground">إجمالي الموظفين</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Shield className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold">{insuredCount}</p><p className="text-xs text-muted-foreground">مؤمن عليهم</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <GraduationCap className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{courses.length}</p><p className="text-xs text-muted-foreground">دورات تدريبية</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Star className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <p className="text-2xl font-bold">{avgScore}</p><p className="text-xs text-muted-foreground">متوسط التقييم</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees" className="gap-2"><Users className="w-4 h-4" />الموظفين</TabsTrigger>
          <TabsTrigger value="insurance" className="gap-2"><Shield className="w-4 h-4" />التأمينات</TabsTrigger>
          <TabsTrigger value="evaluation" className="gap-2"><Star className="w-4 h-4" />التقييم</TabsTrigger>
          <TabsTrigger value="training" className="gap-2"><GraduationCap className="w-4 h-4" />التدريب</TabsTrigger>
        </TabsList>

        {/* EMPLOYEES TAB */}
        <TabsContent value="employees" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">سجل الموظفين</CardTitle>
              <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 me-1" />إضافة موظف</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>إضافة موظف جديد</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>الاسم الكامل *</Label><Input value={empForm.full_name} onChange={e => setEmpForm(p => ({ ...p, full_name: e.target.value }))} /></div>
                    <div><Label>القسم</Label><Input value={empForm.department} onChange={e => setEmpForm(p => ({ ...p, department: e.target.value }))} /></div>
                    <div><Label>المسمى الوظيفي</Label><Input value={empForm.job_title} onChange={e => setEmpForm(p => ({ ...p, job_title: e.target.value }))} /></div>
                    <div><Label>الهاتف</Label><Input value={empForm.phone} onChange={e => setEmpForm(p => ({ ...p, phone: e.target.value }))} /></div>
                    <div><Label>الراتب الأساسي</Label><Input type="number" value={empForm.base_salary} onChange={e => setEmpForm(p => ({ ...p, base_salary: Number(e.target.value) }))} /></div>
                    <Button onClick={handleAddEmployee} disabled={createEmp.isPending} className="w-full">{createEmp.isPending ? 'جاري الحفظ...' : 'حفظ'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {empLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> : employees.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">لا يوجد موظفين. أضف أول موظف.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>الاسم</TableHead><TableHead>القسم</TableHead><TableHead>المسمى</TableHead><TableHead>الراتب</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {employees.map(emp => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                        <TableCell>{emp.department || '-'}</TableCell>
                        <TableCell>{emp.job_title || '-'}</TableCell>
                        <TableCell>{Number(emp.base_salary).toLocaleString()} ر.س</TableCell>
                        <TableCell><Badge variant={emp.is_active ? 'default' : 'secondary'}>{emp.is_active ? 'نشط' : 'غير نشط'}</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm('حذف هذا الموظف؟')) deleteEmp.mutate(emp.id, { onSuccess: () => toast.success('تم الحذف') }); }}>
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
            <CardHeader><CardTitle className="text-base">سجل التأمينات الاجتماعية (GOSI)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label>الموظف</Label>
                  <Select value={insForm.employee_id} onValueChange={v => setInsForm(p => ({ ...p, employee_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر موظف" /></SelectTrigger>
                    <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>رقم GOSI</Label><Input value={insForm.gosi_number} onChange={e => setInsForm(p => ({ ...p, gosi_number: e.target.value }))} /></div>
                <div className="flex items-end"><Button onClick={handleRegisterInsurance} disabled={upsertIns.isPending}><UserCheck className="w-4 h-4 me-1" />تسجيل</Button></div>
              </div>
              {insurance.length > 0 && (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>الموظف</TableHead><TableHead>القسم</TableHead><TableHead>رقم GOSI</TableHead><TableHead>الحالة</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {insurance.map((rec: any) => (
                      <TableRow key={rec.id}>
                        <TableCell className="font-medium">{rec.hr_employees?.full_name}</TableCell>
                        <TableCell>{rec.hr_employees?.department || '-'}</TableCell>
                        <TableCell className="font-mono">{rec.gosi_number || '-'}</TableCell>
                        <TableCell><Badge variant={rec.status === 'registered' ? 'default' : 'outline'}>{rec.status === 'registered' ? 'مسجل' : rec.status === 'pending' ? 'قيد التسجيل' : rec.status}</Badge></TableCell>
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
              <CardTitle className="text-base">تقييم الأداء</CardTitle>
              <Dialog open={showAddEval} onOpenChange={setShowAddEval}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 me-1" />تقييم جديد</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>إضافة تقييم</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>الموظف *</Label>
                      <Select value={evalForm.employee_id} onValueChange={v => setEvalForm(p => ({ ...p, employee_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر موظف" /></SelectTrigger>
                        <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>الفترة</Label><Input placeholder="مثال: Q1 2026" value={evalForm.evaluation_period} onChange={e => setEvalForm(p => ({ ...p, evaluation_period: e.target.value }))} /></div>
                    <div><Label>الدرجة (من 5)</Label><Input type="number" min={0} max={5} step={0.1} value={evalForm.overall_score} onChange={e => setEvalForm(p => ({ ...p, overall_score: Number(e.target.value) }))} /></div>
                    <div><Label>نقاط القوة</Label><Input value={evalForm.strengths} onChange={e => setEvalForm(p => ({ ...p, strengths: e.target.value }))} /></div>
                    <div><Label>نقاط التحسين</Label><Input value={evalForm.weaknesses} onChange={e => setEvalForm(p => ({ ...p, weaknesses: e.target.value }))} /></div>
                    <Button onClick={handleAddEvaluation} disabled={createEval.isPending} className="w-full">حفظ التقييم</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {evaluations.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">لا توجد تقييمات بعد.</p>
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
              <CardTitle className="text-base">الدورات التدريبية</CardTitle>
              <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 me-1" />دورة جديدة</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>إضافة دورة تدريبية</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>اسم الدورة *</Label><Input value={courseForm.name} onChange={e => setCourseForm(p => ({ ...p, name: e.target.value }))} /></div>
                    <div><Label>مقدم الدورة</Label><Input value={courseForm.provider} onChange={e => setCourseForm(p => ({ ...p, provider: e.target.value }))} /></div>
                    <div><Label>التاريخ</Label><Input type="date" value={courseForm.course_date} onChange={e => setCourseForm(p => ({ ...p, course_date: e.target.value }))} /></div>
                    <Button onClick={handleAddCourse} disabled={createCourse.isPending} className="w-full">حفظ</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">لا توجد دورات بعد.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>الدورة</TableHead><TableHead>مقدم الدورة</TableHead><TableHead>التاريخ</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {courses.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.provider || '-'}</TableCell>
                        <TableCell>{c.course_date || '-'}</TableCell>
                        <TableCell><Badge variant={c.status === 'completed' ? 'default' : 'outline'}>{c.status === 'completed' ? 'مكتملة' : c.status === 'upcoming' ? 'قادمة' : c.status}</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteCourse.mutate(c.id, { onSuccess: () => toast.success('تم الحذف') })}>
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
