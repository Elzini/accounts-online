import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Database,
  Download,
  Trash2,
  RotateCcw,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  HardDrive,
  Calendar,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  useBackups,
  useBackupSchedule,
  useCreateBackup,
  useDeleteBackup,
  useRestoreBackup,
  useUpdateBackupSchedule,
  useDownloadBackup,
  useRestoreFromLocalFile
} from '@/hooks/useBackups';
import { Backup } from '@/services/backups';

export function BackupsPage() {
  const { data: backups, isLoading: backupsLoading } = useBackups();
  const { data: schedule, isLoading: scheduleLoading } = useBackupSchedule();
  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();
  const restoreBackup = useRestoreBackup();
  const updateSchedule = useUpdateBackupSchedule();
  const downloadBackup = useDownloadBackup();
  const restoreFromFile = useRestoreFromLocalFile();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBackupName, setNewBackupName] = useState('');
  const [newBackupDescription, setNewBackupDescription] = useState('');
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
      alert('يرجى اختيار ملف JSON');
      return;
    }
    
    await restoreFromFile.mutateAsync(file);
    setIsRestoreDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const handleCreateBackup = async () => {
    if (!newBackupName.trim()) return;
    
    await createBackup.mutateAsync({
      name: newBackupName,
      description: newBackupDescription || undefined
    });
    
    setIsCreateDialogOpen(false);
    setNewBackupName('');
    setNewBackupDescription('');
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusBadge = (status: Backup['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="text-green-700 dark:text-green-300"><CheckCircle className="w-3 h-3 ml-1" />مكتمل</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="text-blue-700 dark:text-blue-300"><Loader2 className="w-3 h-3 ml-1 animate-spin" />جاري</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 ml-1" />فشل</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 ml-1" />معلق</Badge>;
    }
  };

  const getTotalRecords = (recordsCount: Record<string, number>) => {
    return Object.values(recordsCount).reduce((sum, count) => sum + count, 0);
  };

  if (backupsLoading || scheduleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6" />
            النسخ الاحتياطي
          </h1>
          <p className="text-muted-foreground mt-1">
            إنشاء نسخ احتياطية من بياناتك واستعادتها عند الحاجة
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                استعادة من ملف
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>استعادة من ملف محلي</DialogTitle>
                <DialogDescription>
                  اختر ملف النسخة الاحتياطية (JSON) لاستعادة البيانات منه.
                  <span className="block mt-2 text-destructive font-medium">
                    تحذير: سيتم استبدال جميع البيانات الحالية!
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="backup-file-input"
                />
                <Button
                  variant="outline"
                  className="w-full h-24 border-dashed gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={restoreFromFile.isPending}
                >
                  {restoreFromFile.isPending ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      جاري الاستعادة...
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      اختر ملف النسخة الاحتياطية
                    </>
                  )}
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
                  إلغاء
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إنشاء نسخة احتياطية
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء نسخة احتياطية جديدة</DialogTitle>
              <DialogDescription>
                سيتم حفظ جميع بيانات الشركة في النسخة الاحتياطية
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="backup-name">اسم النسخة الاحتياطية *</Label>
                <Input
                  id="backup-name"
                  value={newBackupName}
                  onChange={(e) => setNewBackupName(e.target.value)}
                  placeholder="مثال: نسخة نهاية الشهر"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup-desc">الوصف (اختياري)</Label>
                <Input
                  id="backup-desc"
                  value={newBackupDescription}
                  onChange={(e) => setNewBackupDescription(e.target.value)}
                  placeholder="وصف النسخة الاحتياطية"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleCreateBackup} 
                disabled={!newBackupName.trim() || createBackup.isPending}
              >
                {createBackup.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                إنشاء
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Backup Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            إعدادات النسخ التلقائي
          </CardTitle>
          <CardDescription>
            جدولة النسخ الاحتياطي التلقائي للبيانات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <Label htmlFor="auto-backup">النسخ التلقائي</Label>
              <Switch
                id="auto-backup"
                checked={schedule?.is_enabled ?? false}
                onCheckedChange={(checked) => 
                  updateSchedule.mutate({ is_enabled: checked })
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>التكرار</Label>
              <Select
                value={schedule?.frequency ?? 'daily'}
                onValueChange={(value: 'daily' | 'weekly') =>
                  updateSchedule.mutate({ frequency: value })
                }
                disabled={!schedule?.is_enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">يومياً</SelectItem>
                  <SelectItem value="weekly">أسبوعياً</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>مدة الاحتفاظ</Label>
              <Select
                value={String(schedule?.retention_days ?? 30)}
                onValueChange={(value) =>
                  updateSchedule.mutate({ retention_days: parseInt(value) })
                }
                disabled={!schedule?.is_enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 أيام</SelectItem>
                  <SelectItem value="14">14 يوم</SelectItem>
                  <SelectItem value="30">30 يوم</SelectItem>
                  <SelectItem value="60">60 يوم</SelectItem>
                  <SelectItem value="90">90 يوم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {schedule?.is_enabled && schedule?.next_backup_at && (
            <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>النسخة الاحتياطية القادمة: </span>
              <span className="font-medium">
                {format(new Date(schedule.next_backup_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            النسخ الاحتياطية المحفوظة
          </CardTitle>
          <CardDescription>
            {backups?.length || 0} نسخة احتياطية
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!backups?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد نسخ احتياطية</p>
              <p className="text-sm">قم بإنشاء نسخة احتياطية للحفاظ على بياناتك</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>عدد السجلات</TableHead>
                    <TableHead>الحجم</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{backup.name}</div>
                          {backup.description && (
                            <div className="text-sm text-muted-foreground">{backup.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {backup.backup_type === 'automatic' ? 'تلقائي' : 'يدوي'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell>
                        {backup.records_count ? getTotalRecords(backup.records_count) : '-'}
                      </TableCell>
                      <TableCell>{formatFileSize(backup.file_size)}</TableCell>
                      <TableCell>
                        {format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadBackup.mutate(backup)}
                            disabled={backup.status !== 'completed'}
                            title="تحميل"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={backup.status !== 'completed'}
                                title="استعادة"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الاستعادة</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم استبدال جميع البيانات الحالية بالبيانات من هذه النسخة الاحتياطية.
                                  هذا الإجراء لا يمكن التراجع عنه!
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => restoreBackup.mutate(backup.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {restoreBackup.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                                  تأكيد الاستعادة
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف النسخة الاحتياطية</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف هذه النسخة الاحتياطية؟
                                  لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteBackup.mutate(backup.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
