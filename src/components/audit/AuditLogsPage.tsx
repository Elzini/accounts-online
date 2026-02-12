import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { FileText, Search, User, Shield, Clock, Filter, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { getActionLabel, getEntityTypeLabel, getPermissionLabel } from '@/services/auditLogs';
import { useLanguage } from '@/contexts/LanguageContext';

export function AuditLogsPage() {
  const { data: logs = [], isLoading, refetch } = useAuditLogs();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        searchTerm === '' ||
        log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getActionLabel(log.action).includes(searchTerm) ||
        JSON.stringify(log.new_data).includes(searchTerm) ||
        JSON.stringify(log.old_data).includes(searchTerm);
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map((log) => log.action));
    return Array.from(actions);
  }, [logs]);

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('created') || action.includes('granted')) return 'default';
    if (action.includes('deleted') || action.includes('revoked')) return 'destructive';
    return 'secondary';
  };

  const formatDetails = (log: typeof logs[0]) => {
    const data = log.new_data || log.old_data;
    if (!data) return '-';
    if (log.entity_type === 'user_role' && data.permission) return getPermissionLabel(data.permission as string);
    if (log.entity_type === 'user' && data.username) return data.username as string;
    return '-';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary" />
            {t.audit_title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.audit_subtitle}</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {t.refresh}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />{t.audit_total_records}
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{logs.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />{t.audit_user_operations}
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{logs.filter((l) => l.entity_type === 'user').length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="w-4 h-4" />{t.audit_permission_changes}
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{logs.filter((l) => l.entity_type === 'user_role').length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t.audit_search_placeholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder={t.audit_filter_by_action} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.audit_all_operations}</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>{getActionLabel(action)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-bold">{t.audit_datetime}</TableHead>
                  <TableHead className="text-right font-bold">{t.audit_operation}</TableHead>
                  <TableHead className="text-right font-bold">{t.audit_type}</TableHead>
                  <TableHead className="text-right font-bold">{t.audit_details}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t.audit_no_records}</TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(log.created_at), 'yyyy/MM/dd HH:mm', { locale: ar })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>{getActionLabel(log.action)}</Badge>
                      </TableCell>
                      <TableCell><span className="text-muted-foreground">{getEntityTypeLabel(log.entity_type)}</span></TableCell>
                      <TableCell><span className="font-medium">{formatDetails(log)}</span></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
