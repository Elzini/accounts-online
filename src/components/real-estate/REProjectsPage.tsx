import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Building2, MapPin, Calendar, TrendingUp, Edit, Trash2, Eye, Search, FileText, BookOpen } from 'lucide-react';
import { useREProjects, useSaveREProject, useDeleteREProject, useREDashboardStats, useREProjectInvoices, useREProjectJournalEntries } from '@/hooks/useRealEstate';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  planning: { label: 'تخطيط', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  under_construction: { label: 'قيد الإنشاء', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  on_hold: { label: 'متوقف', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  cancelled: { label: 'ملغي', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
};

const TYPE_MAP: Record<string, string> = {
  residential: 'سكني',
  commercial: 'تجاري',
  mixed: 'متعدد الاستخدام',
  land_subdivision: 'تقسيم أراضي',
};

const emptyProject = {
  name: '', code: '', description: '', location: '', city: '', district: '',
  land_area: '', total_built_area: '', total_units: 0, project_type: 'residential',
  status: 'planning', start_date: '', expected_completion: '', total_budget: '',
  land_cost: '', construction_cost: '', manager_name: '', license_number: '',
  wafi_number: '', escrow_account: '', notes: '',
};

export function REProjectsPage() {
  const { data: projects = [], isLoading } = useREProjects();
  const { data: stats } = useREDashboardStats();
  const saveProject = useSaveREProject();
  const deleteProject = useDeleteREProject();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyProject);
  const [search, setSearch] = useState('');
  
  // Financial data for detail view
  const { data: projectInvoices = [] } = useREProjectInvoices(detailProjectId);
  const { data: projectEntries = [] } = useREProjectJournalEntries(detailProjectId);
  const detailProject = (projects as any[]).find((p: any) => p.id === detailProjectId);

  const openNew = () => { setForm(emptyProject); setDialogOpen(true); };
  const openEdit = (p: any) => { setForm(p); setDialogOpen(true); };
  const handleSave = () => {
    if (!form.name) return;
    const numericFields = ['land_area', 'total_built_area', 'total_units', 'total_budget', 'land_cost', 'construction_cost', 'progress_percentage', 'total_spent'];
    const cleaned = { ...form };
    numericFields.forEach(f => {
      if (cleaned[f] === '' || cleaned[f] === undefined) cleaned[f] = null;
      else if (cleaned[f] !== null) cleaned[f] = Number(cleaned[f]) || null;
    });
    // Clean empty date strings
    ['start_date', 'expected_completion'].forEach(f => {
      if (!cleaned[f]) cleaned[f] = null;
    });
    saveProject.mutate(cleaned, { onSuccess: () => setDialogOpen(false) });
  };

  const filtered = projects.filter((p: any) =>
    p.name?.includes(search) || p.code?.includes(search) || p.city?.includes(search)
  );

  const fmt = (n: number) => new Intl.NumberFormat('ar-SA').format(n);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats?.totalProjects || 0}</p>
            <p className="text-sm text-muted-foreground">إجمالي المشاريع</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats?.activeProjects || 0}</p>
            <p className="text-sm text-muted-foreground">قيد الإنشاء</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats?.totalUnits || 0}</p>
            <p className="text-sm text-muted-foreground">إجمالي الوحدات</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{fmt(stats?.totalBudget || 0)}</p>
            <p className="text-sm text-muted-foreground">إجمالي الميزانيات</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            المشاريع العقارية
          </h2>
          <p className="text-muted-foreground text-sm">إدارة ومتابعة المشاريع العقارية</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 w-48" />
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="w-4 h-4" />
            مشروع جديد
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>لا توجد مشاريع بعد</p>
            <Button variant="outline" onClick={openNew} className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              إضافة أول مشروع
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p: any) => (
            <Card key={p.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    {p.code && <p className="text-xs text-muted-foreground">{p.code}</p>}
                  </div>
                  <Badge className={STATUS_MAP[p.status]?.color || ''}>{STATUS_MAP[p.status]?.label || p.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {p.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{p.city}</span>}
                  <span>{TYPE_MAP[p.project_type] || p.project_type}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>نسبة الإنجاز</span>
                    <span className="font-semibold">{Number(p.progress_percentage || 0).toFixed(0)}%</span>
                  </div>
                  <Progress value={Number(p.progress_percentage || 0)} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/50 rounded p-2 text-center">
                    <p className="font-semibold">{p.total_units || 0}</p>
                    <p className="text-xs text-muted-foreground">وحدة</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2 text-center">
                    <p className="font-semibold">{fmt(Number(p.total_budget || 0))}</p>
                    <p className="text-xs text-muted-foreground">الميزانية</p>
                  </div>
                </div>
                {p.start_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {p.start_date} → {p.expected_completion || '...'}
                  </div>
                )}
                <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" onClick={() => setDetailProjectId(p.id)} className="flex-1 gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    عرض
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)} className="gap-1">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => { if (confirm('حذف المشروع؟')) deleteProject.mutate(p.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'تعديل المشروع' : 'مشروع جديد'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المشروع *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>كود المشروع</Label>
              <Input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>نوع المشروع</Label>
              <Select value={form.project_type} onValueChange={v => setForm({ ...form, project_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">سكني</SelectItem>
                  <SelectItem value="commercial">تجاري</SelectItem>
                  <SelectItem value="mixed">متعدد الاستخدام</SelectItem>
                  <SelectItem value="land_subdivision">تقسيم أراضي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المدينة</Label>
              <Input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الحي</Label>
              <Input value={form.district || ''} onChange={e => setForm({ ...form, district: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>مساحة الأرض (م²)</Label>
              <Input type="number" value={form.land_area || ''} onChange={e => setForm({ ...form, land_area: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>المساحة المبنية (م²)</Label>
              <Input type="number" value={form.total_built_area || ''} onChange={e => setForm({ ...form, total_built_area: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>عدد الوحدات</Label>
              <Input type="number" value={form.total_units || 0} onChange={e => setForm({ ...form, total_units: +e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>نسبة الإنجاز %</Label>
              <Input type="number" value={form.progress_percentage || 0} onChange={e => setForm({ ...form, progress_percentage: +e.target.value })} min={0} max={100} />
            </div>
            <div className="space-y-2">
              <Label>تاريخ البدء</Label>
              <Input type="date" value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الإنجاز المتوقع</Label>
              <Input type="date" value={form.expected_completion || ''} onChange={e => setForm({ ...form, expected_completion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الميزانية</Label>
              <Input type="number" value={form.total_budget || ''} onChange={e => setForm({ ...form, total_budget: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>تكلفة الأرض</Label>
              <Input type="number" value={form.land_cost || ''} onChange={e => setForm({ ...form, land_cost: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>مدير المشروع</Label>
              <Input value={form.manager_name || ''} onChange={e => setForm({ ...form, manager_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>رقم ترخيص وافي</Label>
              <Input value={form.wafi_number || ''} onChange={e => setForm({ ...form, wafi_number: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>الوصف</Label>
              <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saveProject.isPending}>
              {saveProject.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Detail Dialog */}
      <Dialog open={!!detailProjectId} onOpenChange={(open) => { if (!open) setDetailProjectId(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {detailProject?.name || 'تفاصيل المشروع'}
              {detailProject?.status && (
                <Badge className={STATUS_MAP[detailProject.status]?.color || ''}>
                  {STATUS_MAP[detailProject.status]?.label || detailProject.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {detailProject && (
            <div className="space-y-4">
              {/* Project Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">{detailProject.total_units || 0}</p>
                  <p className="text-xs text-muted-foreground">وحدة</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">{fmt(Number(detailProject.total_budget || 0))}</p>
                  <p className="text-xs text-muted-foreground">الميزانية</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-primary">{projectInvoices.length}</p>
                  <p className="text-xs text-muted-foreground">فاتورة مشتريات</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-primary">{projectEntries.length}</p>
                  <p className="text-xs text-muted-foreground">قيد محاسبي</p>
                </div>
              </div>

              <Tabs defaultValue="invoices" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="invoices" className="flex-1 gap-1.5">
                    <FileText className="w-4 h-4" />
                    الفواتير ({projectInvoices.length})
                  </TabsTrigger>
                  <TabsTrigger value="entries" className="flex-1 gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    القيود ({projectEntries.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="invoices">
                  {projectInvoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>لا توجد فواتير مرتبطة بهذا المشروع</p>
                      <p className="text-xs mt-1">يمكنك ربط الفواتير عند إنشائها من صفحة المشتريات</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>رقم الفاتورة</TableHead>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>النوع</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>الضريبة</TableHead>
                            <TableHead>الإجمالي</TableHead>
                            <TableHead>الحالة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectInvoices.map((inv: any) => (
                            <TableRow key={inv.id}>
                              <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                              <TableCell>{inv.invoice_date}</TableCell>
                              <TableCell>
                                <Badge variant={inv.invoice_type === 'purchase' ? 'secondary' : 'default'}>
                                  {inv.invoice_type === 'purchase' ? 'مشتريات' : 'مبيعات'}
                                </Badge>
                              </TableCell>
                              <TableCell>{fmt(Number(inv.total) - Number(inv.vat_amount || 0))}</TableCell>
                              <TableCell>{fmt(Number(inv.vat_amount || 0))}</TableCell>
                              <TableCell className="font-semibold">{fmt(Number(inv.total))}</TableCell>
                              <TableCell>
                                <Badge variant={inv.payment_status === 'paid' ? 'default' : 'outline'}>
                                  {inv.payment_status === 'paid' ? 'مدفوع' : inv.payment_status === 'partial' ? 'جزئي' : 'غير مدفوع'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-bold">
                            <TableCell colSpan={5}>الإجمالي</TableCell>
                            <TableCell>{fmt(projectInvoices.reduce((s: number, i: any) => s + Number(i.total || 0), 0))}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="entries">
                  {projectEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>لا توجد قيود محاسبية مرتبطة بهذا المشروع</p>
                      <p className="text-xs mt-1">يمكنك ربط القيود عند إنشائها من صفحة القيود المحاسبية</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>رقم القيد</TableHead>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>البيان</TableHead>
                            <TableHead>مدين</TableHead>
                            <TableHead>دائن</TableHead>
                            <TableHead>النوع</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectEntries.map((entry: any) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-mono">{entry.entry_number}</TableCell>
                              <TableCell>{entry.entry_date}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                              <TableCell>{fmt(Number(entry.total_debit))}</TableCell>
                              <TableCell>{fmt(Number(entry.total_credit))}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {entry.reference_type === 'manual' ? 'يدوي' : entry.reference_type === 'invoice_purchase' ? 'فاتورة مشتريات' : entry.reference_type || '-'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-bold">
                            <TableCell colSpan={3}>الإجمالي</TableCell>
                            <TableCell>{fmt(projectEntries.reduce((s: number, e: any) => s + Number(e.total_debit || 0), 0))}</TableCell>
                            <TableCell>{fmt(projectEntries.reduce((s: number, e: any) => s + Number(e.total_credit || 0), 0))}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
