import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HardDrive, CheckCircle2, XCircle, Clock, Shield, Building2 } from 'lucide-react';

export function BackupManagementPanel() {
  const { data: backups = [], isLoading: loadingBackups } = useQuery({
    queryKey: ['all-backups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['all-backup-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('backup_schedules').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-for-backups'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('id, name');
      return data || [];
    },
  });

  const companyMap = Object.fromEntries(companies.map((c: any) => [c.id, c.name]));

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 ml-1" />مكتمل</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1" />فشل</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 ml-1" />{status}</Badge>;
    }
  };

  const completedCount = backups.filter((b: any) => b.status === 'completed').length;
  const failedCount = backups.filter((b: any) => b.status === 'failed').length;
  const encryptedCount = backups.filter((b: any) => b.is_encrypted).length;

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          إدارة النسخ الاحتياطية
          <Badge variant="outline">{backups.length} نسخة</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ملخص */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">{backups.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{completedCount}</p>
            <p className="text-xs text-muted-foreground">مكتمل</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{failedCount}</p>
            <p className="text-xs text-muted-foreground">فشل</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{encryptedCount}</p>
            <p className="text-xs text-muted-foreground">مشفر</p>
          </div>
        </div>

        {/* جدول الجدولة */}
        {schedules.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Clock className="h-4 w-4" /> جدولة النسخ التلقائية
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {schedules.map((s: any) => (
                <div key={s.id} className="border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {companyMap[s.company_id] || 'غير معروف'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      كل {s.frequency} - الساعة {s.backup_hour}:00 - احتفاظ {s.retention_days} يوم
                    </p>
                  </div>
                  <Badge variant={s.is_enabled ? 'default' : 'secondary'}>
                    {s.is_enabled ? 'مفعّل' : 'معطّل'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* سجل النسخ */}
        <ScrollArea className="h-[350px]">
          {loadingBackups ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-center">الشركة</TableHead>
                  <TableHead className="text-center">النوع</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">مشفر</TableHead>
                  <TableHead className="text-center">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium text-sm">{b.name}</TableCell>
                    <TableCell className="text-center text-sm">{companyMap[b.company_id] || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{b.backup_type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{statusBadge(b.status)}</TableCell>
                    <TableCell className="text-center">
                      {b.is_encrypted ? <Shield className="h-4 w-4 text-green-500 mx-auto" /> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {new Date(b.created_at).toLocaleString('ar-SA')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
