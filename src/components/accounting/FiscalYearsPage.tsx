import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  useFiscalYears, 
  useCreateFiscalYear, 
  useCloseFiscalYear, 
  useOpenNewFiscalYear,
  useSetCurrentFiscalYear,
  useDeleteFiscalYear
} from '@/hooks/useFiscalYears';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, 
  Plus, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  ArrowRight, 
  Trash2, 
  Loader2,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

export function FiscalYearsPage() {
  const { data: fiscalYears = [], isLoading } = useFiscalYears();
  const { permissions } = useAuth();
  const isAdmin = permissions.admin || permissions.super_admin;
  
  const createFiscalYear = useCreateFiscalYear();
  const closeFiscalYear = useCloseFiscalYear();
  const openNewFiscalYear = useOpenNewFiscalYear();
  const setCurrentFiscalYear = useSetCurrentFiscalYear();
  const deleteFiscalYear = useDeleteFiscalYear();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isNewYearDialogOpen, setIsNewYearDialogOpen] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState('');
  const [newYearEnd, setNewYearEnd] = useState('');
  const [newYearNotes, setNewYearNotes] = useState('');
  const [autoCarryForward, setAutoCarryForward] = useState(true);
  const [previousYearId, setPreviousYearId] = useState('');

  const currentYear = new Date().getFullYear();

  const handleCreateYear = () => {
    if (!newYearName || !newYearStart || !newYearEnd) return;
    
    createFiscalYear.mutate({
      name: newYearName,
      start_date: newYearStart,
      end_date: newYearEnd,
      is_current: fiscalYears.length === 0,
      notes: newYearNotes || undefined,
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleOpenNewYear = () => {
    if (!newYearName || !newYearStart || !newYearEnd) return;
    
    openNewFiscalYear.mutate({
      name: newYearName,
      startDate: newYearStart,
      endDate: newYearEnd,
      previousYearId: previousYearId || undefined,
      autoCarryForward,
    }, {
      onSuccess: () => {
        setIsNewYearDialogOpen(false);
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setNewYearName('');
    setNewYearStart('');
    setNewYearEnd('');
    setNewYearNotes('');
    setAutoCarryForward(true);
    setPreviousYearId('');
  };

  const handleSetYearDefaults = (year: number) => {
    setNewYearName(year.toString());
    setNewYearStart(`${year}-01-01`);
    setNewYearEnd(`${year}-12-31`);
  };

  const closedYears = fiscalYears.filter(y => y.status === 'closed');
  const openYears = fiscalYears.filter(y => y.status === 'open');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">السنوات المالية</h1>
          <p className="text-muted-foreground">إدارة السنوات المالية وترحيل الحسابات</p>
        </div>
        <div className="flex gap-2">
          {/* إنشاء سنة جديدة */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء سنة مالية
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>إنشاء سنة مالية جديدة</DialogTitle>
                <DialogDescription>أدخل بيانات السنة المالية</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2 mb-4">
                  {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                    <Button 
                      key={year} 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSetYearDefaults(year)}
                    >
                      {year}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>اسم السنة المالية</Label>
                  <Input
                    value={newYearName}
                    onChange={(e) => setNewYearName(e.target.value)}
                    placeholder="مثل: 2024"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ البداية</Label>
                    <Input
                      type="date"
                      value={newYearStart}
                      onChange={(e) => setNewYearStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ النهاية</Label>
                    <Input
                      type="date"
                      value={newYearEnd}
                      onChange={(e) => setNewYearEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات (اختياري)</Label>
                  <Textarea
                    value={newYearNotes}
                    onChange={(e) => setNewYearNotes(e.target.value)}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateYear} disabled={createFiscalYear.isPending}>
                  {createFiscalYear.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                  إنشاء
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* فتح سنة جديدة مع ترحيل */}
          {closedYears.length > 0 && (
            <Dialog open={isNewYearDialogOpen} onOpenChange={setIsNewYearDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <ArrowRight className="h-4 w-4 ml-2" />
                  فتح سنة جديدة وترحيل
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>فتح سنة مالية جديدة</DialogTitle>
                  <DialogDescription>سيتم ترحيل أرصدة الأصول والخصوم وحقوق الملكية</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex gap-2 mb-4">
                    {[currentYear, currentYear + 1].map(year => (
                      <Button 
                        key={year} 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSetYearDefaults(year)}
                      >
                        {year}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>اسم السنة المالية الجديدة</Label>
                    <Input
                      value={newYearName}
                      onChange={(e) => setNewYearName(e.target.value)}
                      placeholder="مثل: 2025"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>تاريخ البداية</Label>
                      <Input
                        type="date"
                        value={newYearStart}
                        onChange={(e) => setNewYearStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>تاريخ النهاية</Label>
                      <Input
                        type="date"
                        value={newYearEnd}
                        onChange={(e) => setNewYearEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>السنة السابقة (للترحيل)</Label>
                    <Select value={previousYearId} onValueChange={setPreviousYearId}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر السنة السابقة" />
                      </SelectTrigger>
                      <SelectContent>
                        {closedYears.map(year => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-base">ترحيل تلقائي للأرصدة</Label>
                      <p className="text-sm text-muted-foreground">
                        إنشاء قيد افتتاحي بأرصدة السنة السابقة
                      </p>
                    </div>
                    <Switch
                      checked={autoCarryForward}
                      onCheckedChange={setAutoCarryForward}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewYearDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleOpenNewYear} disabled={openNewFiscalYear.isPending}>
                    {openNewFiscalYear.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                    فتح وترحيل
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* قائمة السنوات المالية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            السنوات المالية
          </CardTitle>
          <CardDescription>
            {fiscalYears.length} سنة مالية ({openYears.length} مفتوحة، {closedYears.length} مغلقة)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fiscalYears.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد سنوات مالية</h3>
              <p className="text-muted-foreground mb-4">قم بإنشاء سنة مالية لبدء العمل</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء سنة مالية
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>السنة</TableHead>
                  <TableHead>الفترة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>القيود</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fiscalYears.map(year => (
                  <TableRow key={year.id} className={year.is_current ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{year.name}</span>
                        {year.is_current && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                            الحالية
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(year.start_date), 'yyyy/MM/dd')} - {format(new Date(year.end_date), 'yyyy/MM/dd')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {year.status === 'open' ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                          <Unlock className="h-3 w-3 ml-1" />
                          مفتوحة
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                          <Lock className="h-3 w-3 ml-1" />
                          مغلقة
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {year.opening_balance_entry_id && (
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 ml-1" />
                            افتتاحي
                          </Badge>
                        )}
                        {year.closing_balance_entry_id && (
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 ml-1" />
                            إقفال
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* تعيين كسنة حالية */}
                        {!year.is_current && year.status === 'open' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentFiscalYear.mutate(year.id)}
                            disabled={setCurrentFiscalYear.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* إغلاق السنة */}
                        {year.status === 'open' && isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-orange-600">
                                <Lock className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                                  إغلاق السنة المالية
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم إغلاق السنة المالية {year.name} وإنشاء قيد إقفال للإيرادات والمصروفات.
                                  <br />
                                  <strong>ملاحظة:</strong> فقط المدير يستطيع التعديل على السنوات المغلقة.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => closeFiscalYear.mutate(year.id)}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  {closeFiscalYear.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                  ) : (
                                    <Lock className="h-4 w-4 ml-2" />
                                  )}
                                  إغلاق السنة
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* حذف السنة */}
                        {year.status === 'open' && !year.is_current && isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف السنة المالية</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف السنة المالية {year.name}؟ هذا الإجراء لا يمكن التراجع عنه.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteFiscalYear.mutate(year.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">كيفية الترحيل</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• <strong>الترحيل التلقائي:</strong> يُنشئ قيد افتتاحي بأرصدة الأصول والخصوم وحقوق الملكية</p>
            <p>• <strong>الإيرادات والمصروفات:</strong> تُقفل إلى الأرباح المحتجزة عند إغلاق السنة</p>
            <p>• <strong>الترحيل اليدوي:</strong> يمكنك تعديل القيد الافتتاحي بعد إنشائه</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">صلاحيات التعديل</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• <strong>السنوات المفتوحة:</strong> جميع المستخدمين يمكنهم إضافة معاملات</p>
            <p>• <strong>السنوات المغلقة:</strong> المدير فقط يستطيع التعديل</p>
            <p>• <strong>إعادة الفتح:</strong> غير متاحة - يجب إنشاء قيد تعديل</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
