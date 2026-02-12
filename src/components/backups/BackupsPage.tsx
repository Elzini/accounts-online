import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Database, Download, Trash2, RotateCcw, Plus, Clock, CheckCircle, XCircle, Loader2,
  Settings, HardDrive, Calendar, Upload, Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBackups, useBackupSchedule, useCreateBackup, useDeleteBackup, useRestoreBackup, useUpdateBackupSchedule, useDownloadBackup, useRestoreFromLocalFile } from '@/hooks/useBackups';
import { Backup, BackupData } from '@/services/backups';
import { BackupPreviewDialog } from './BackupPreviewDialog';
import { useLanguage } from '@/contexts/LanguageContext';

export function BackupsPage() {
  const { t } = useLanguage();
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
  const [previewBackup, setPreviewBackup] = useState<Backup | null>(null);
  const [localFilePreview, setLocalFilePreview] = useState<{ data: BackupData; file: File } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) { alert(t.backup_select_json); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as BackupData;
        setLocalFilePreview({ data, file });
        setIsRestoreDialogOpen(false);
      } catch { alert(t.backup_invalid_file); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmLocalRestore = async () => {
    if (!localFilePreview) return;
    await restoreFromFile.mutateAsync(localFilePreview.file);
    setLocalFilePreview(null);
  };

  const handleConfirmCloudRestore = async () => {
    if (!previewBackup) return;
    await restoreBackup.mutateAsync(previewBackup.id);
    setPreviewBackup(null);
  };

  const handleCreateBackup = async () => {
    if (!newBackupName.trim()) return;
    await createBackup.mutateAsync({ name: newBackupName, description: newBackupDescription || undefined });
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
      case 'completed': return <Badge variant="secondary" className="text-green-700 dark:text-green-300"><CheckCircle className="w-3 h-3 ml-1" />{t.backup_status_completed}</Badge>;
      case 'in_progress': return <Badge variant="secondary" className="text-blue-700 dark:text-blue-300"><Loader2 className="w-3 h-3 ml-1 animate-spin" />{t.backup_status_progress}</Badge>;
      case 'failed': return <Badge variant="destructive"><XCircle className="w-3 h-3 ml-1" />{t.backup_status_failed}</Badge>;
      default: return <Badge variant="secondary"><Clock className="w-3 h-3 ml-1" />{t.backup_status_pending}</Badge>;
    }
  };

  const getTotalRecords = (recordsCount: Record<string, number>) => Object.values(recordsCount).reduce((sum, count) => sum + count, 0);

  if (backupsLoading || scheduleLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Database className="w-6 h-6" />{t.backup_title}</h1>
          <p className="text-muted-foreground mt-1">{t.backup_subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><Upload className="w-4 h-4" />{t.backup_restore_from_file}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.backup_restore_local_title}</DialogTitle>
                <DialogDescription>
                  {t.backup_restore_local_desc}
                  <span className="block mt-2 text-destructive font-medium">{t.backup_restore_warning}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" id="backup-file-input" />
                <Button variant="outline" className="w-full h-24 border-dashed gap-2" onClick={() => fileInputRef.current?.click()} type="button" disabled={restoreFromFile.isPending}>
                  {restoreFromFile.isPending ? (<><Loader2 className="w-6 h-6 animate-spin" />{t.backup_restoring}</>) : (<><Upload className="w-6 h-6" />{t.backup_choose_file}</>)}
                </Button>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>{t.cancel}</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />{t.backup_create}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.backup_create_new}</DialogTitle>
                <DialogDescription>{t.backup_create_desc}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-name">{t.backup_name_label}</Label>
                  <Input id="backup-name" value={newBackupName} onChange={(e) => setNewBackupName(e.target.value)} placeholder={t.backup_name_placeholder} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-desc">{t.backup_desc_label}</Label>
                  <Input id="backup-desc" value={newBackupDescription} onChange={(e) => setNewBackupDescription(e.target.value)} placeholder={t.backup_desc_placeholder} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>{t.cancel}</Button>
                <Button onClick={handleCreateBackup} disabled={!newBackupName.trim() || createBackup.isPending}>
                  {createBackup.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  {t.backup_create_btn}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />{t.backup_auto_settings}</CardTitle>
          <CardDescription>{t.backup_auto_settings_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <Label htmlFor="auto-backup">{t.backup_auto_toggle}</Label>
              <Switch id="auto-backup" checked={schedule?.is_enabled ?? false} onCheckedChange={(checked) => updateSchedule.mutate({ is_enabled: checked })} />
            </div>
            <div className="space-y-2">
              <Label>{t.backup_frequency}</Label>
              <Select value={schedule?.frequency ?? 'daily'} onValueChange={(value: 'daily' | 'weekly') => updateSchedule.mutate({ ...schedule, frequency: value })} disabled={!schedule?.is_enabled}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t.backup_daily}</SelectItem>
                  <SelectItem value="weekly">{t.backup_weekly}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.backup_time}</Label>
              <Select value={String(schedule?.backup_hour ?? 3)} onValueChange={(value) => updateSchedule.mutate({ ...schedule, backup_hour: parseInt(value) })} disabled={!schedule?.is_enabled}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.backup_retention}</Label>
              <Select value={String(schedule?.retention_days ?? 30)} onValueChange={(value) => updateSchedule.mutate({ ...schedule, retention_days: parseInt(value) })} disabled={!schedule?.is_enabled}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 {t.backup_days}</SelectItem>
                  <SelectItem value="14">14 {t.backup_days}</SelectItem>
                  <SelectItem value="30">30 {t.backup_days}</SelectItem>
                  <SelectItem value="60">60 {t.backup_days}</SelectItem>
                  <SelectItem value="90">90 {t.backup_days}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {schedule?.is_enabled && schedule?.next_backup_at && (
            <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{t.backup_next} </span>
              <span className="font-medium">{format(new Date(schedule.next_backup_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HardDrive className="w-5 h-5" />{t.backup_saved_list}</CardTitle>
          <CardDescription>{backups?.length || 0} {t.backup_count}</CardDescription>
        </CardHeader>
        <CardContent>
          {!backups?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t.backup_no_backups}</p>
              <p className="text-sm">{t.backup_no_backups_desc}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.backup_col_name}</TableHead>
                    <TableHead>{t.backup_col_type}</TableHead>
                    <TableHead>{t.backup_col_status}</TableHead>
                    <TableHead>{t.backup_col_records}</TableHead>
                    <TableHead>{t.backup_col_size}</TableHead>
                    <TableHead>{t.backup_col_date}</TableHead>
                    <TableHead>{t.backup_col_actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{backup.name}</div>
                          {backup.description && <div className="text-sm text-muted-foreground">{backup.description}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{backup.backup_type === 'automatic' ? t.backup_type_auto : t.backup_type_manual}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell>{backup.records_count ? getTotalRecords(backup.records_count) : '-'}</TableCell>
                      <TableCell>{formatFileSize(backup.file_size)}</TableCell>
                      <TableCell>{format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => downloadBackup.mutate(backup)} disabled={backup.status !== 'completed'} title={t.backup_download}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" disabled={backup.status !== 'completed' || !backup.backup_data} title={t.backup_preview_restore} onClick={() => setPreviewBackup(backup)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" disabled={backup.status !== 'completed'} title={t.backup_direct_restore} onClick={() => setPreviewBackup(backup)}>
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title={t.backup_delete}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t.backup_delete_title}</AlertDialogTitle>
                                <AlertDialogDescription>{t.backup_delete_desc}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteBackup.mutate(backup.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.delete}</AlertDialogAction>
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

      <BackupPreviewDialog open={!!previewBackup} onOpenChange={(open) => !open && setPreviewBackup(null)} backupData={previewBackup?.backup_data as BackupData | null} backupName={previewBackup?.name} backupDate={previewBackup?.created_at} onConfirmRestore={handleConfirmCloudRestore} isRestoring={restoreBackup.isPending} />
      <BackupPreviewDialog open={!!localFilePreview} onOpenChange={(open) => !open && setLocalFilePreview(null)} backupData={localFilePreview?.data || null} backupName={localFilePreview?.file.name} onConfirmRestore={handleConfirmLocalRestore} isRestoring={restoreFromFile.isPending} />
    </div>
  );
}
