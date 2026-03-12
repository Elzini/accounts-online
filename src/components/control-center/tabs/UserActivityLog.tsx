import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Search, LogIn, LogOut, Plus, Pencil, Trash2, Eye } from 'lucide-react';

const actionConfig: Record<string, { icon: any; color: string; label: string }> = {
  create: { icon: Plus, color: 'text-green-500', label: 'إنشاء' },
  update: { icon: Pencil, color: 'text-blue-500', label: 'تعديل' },
  delete: { icon: Trash2, color: 'text-red-500', label: 'حذف' },
  view: { icon: Eye, color: 'text-muted-foreground', label: 'عرض' },
  login: { icon: LogIn, color: 'text-green-600', label: 'دخول' },
  logout: { icon: LogOut, color: 'text-yellow-500', label: 'خروج' },
};

export function UserActivityLog() {
  const { companyId } = useCompany();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['user-activity-log', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(300);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const filtered = logs.filter((log: any) => {
    const matchSearch = !search || log.entity_type?.includes(search) || log.action?.includes(search) || log.user_id?.includes(search);
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  const actionCounts = {
    create: logs.filter((l: any) => l.action === 'create').length,
    update: logs.filter((l: any) => l.action === 'update').length,
    delete: logs.filter((l: any) => l.action === 'delete').length,
  };

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          سجل نشاط المستخدمين
          <Badge variant="outline">{filtered.length} سجل</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ملخص */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{actionCounts.create}</p>
            <p className="text-xs text-muted-foreground">إنشاء</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{actionCounts.update}</p>
            <p className="text-xs text-muted-foreground">تعديل</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{actionCounts.delete}</p>
            <p className="text-xs text-muted-foreground">حذف</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالنوع أو العملية..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="العملية" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="create">إنشاء</SelectItem>
              <SelectItem value="update">تعديل</SelectItem>
              <SelectItem value="delete">حذف</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد سجلات</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((log: any) => {
                const config = actionConfig[log.action] || actionConfig.view;
                const Icon = config.icon;
                return (
                  <div key={log.id} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span className="font-medium text-sm">{config.label}</span>
                        <Badge variant="outline" className="text-xs">{log.entity_type}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('ar-SA')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>👤 {log.user_id?.slice(0, 8)}...</span>
                      {log.entity_id && <span>📋 {log.entity_id.slice(0, 8)}...</span>}
                      {log.ip_address && <span>🌐 {log.ip_address}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
