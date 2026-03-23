import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useSystemChangeLog } from '@/hooks/modules/useSuperAdminServices';

export function SystemChangeLogPanel() {
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useSystemChangeLog();
  const filtered = logs.filter((log: any) =>
    !search ||
    log.module?.includes(search) ||
    log.description?.includes(search) ||
    log.change_type?.includes(search)
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 ml-1" />تم التطبيق</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1" />مرفوض</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 ml-1" />قيد الانتظار</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const changeTypeLabel: Record<string, string> = {
    config_change: '⚙️ تغيير إعدادات',
    schema_change: '🗄️ تغيير هيكل',
    financial_logic: '💰 منطق مالي',
    code_change: '💻 تغيير كود',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          سجل تغييرات النظام (غير قابل للتعديل)
          <Badge variant="outline">{filtered.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في السجل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد تغييرات مسجلة</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((log: any) => (
                <div key={log.id} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{changeTypeLabel[log.change_type] || log.change_type}</span>
                      {statusBadge(log.status)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('ar-SA')}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{log.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>📦 {log.module}</span>
                    <span>🔐 {log.authorization_method || 'غير محدد'}</span>
                    {log.ip_address && <span>🌐 {log.ip_address}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
