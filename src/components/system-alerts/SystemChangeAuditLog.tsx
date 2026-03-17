import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  FileText, ArrowLeftRight, Database, Clock, User, Search,
  Filter, CheckCircle2, XCircle, AlertTriangle, Eye, Calendar,
  Shield, BarChart3
} from 'lucide-react';
import { useSystemChangeAlerts, SystemChangeAlert } from '@/hooks/useSystemChangeAlerts';
import { SystemChangeDetailView } from './SystemChangeDetailView';

export function SystemChangeAuditLog() {
  const { alerts, isLoading, pendingAlerts, approvedAlerts, rejectedAlerts, securityStatus } = useSystemChangeAlerts();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<SystemChangeAlert | null>(null);

  const modules = useMemo(() => {
    const set = new Set(alerts.map(a => a.affected_module));
    return Array.from(set);
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (moduleFilter !== 'all' && a.affected_module !== moduleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.description.toLowerCase().includes(q) ||
          a.affected_module.toLowerCase().includes(q) ||
          a.change_type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [alerts, statusFilter, moduleFilter, search]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs gap-1"><CheckCircle2 className="w-3 h-3" />Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs gap-1 animate-pulse"><AlertTriangle className="w-3 h-3" />Pending</Badge>;
    }
  };

  const changeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      code_change: '💻 Code Change',
      accounting_logic: '📊 Accounting Logic',
      tax_calculation: '🏛️ Tax Calculation',
      system_config: '⚙️ System Config',
      database_structure: '🗃️ Database Structure',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BarChart3 className="w-5 h-5" />} label="إجمالي التغييرات" value={alerts.length} color="text-primary" bg="bg-primary/10" />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="معلقة" value={pendingAlerts.length} color="text-amber-600" bg="bg-amber-500/10" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="تمت الموافقة" value={approvedAlerts.length} color="text-emerald-600" bg="bg-emerald-500/10" />
        <StatCard icon={<XCircle className="w-5 h-5" />} label="مرفوضة" value={rejectedAlerts.length} color="text-destructive" bg="bg-destructive/10" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث في التغييرات..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">معلقة</SelectItem>
                <SelectItem value="approved">موافق عليها</SelectItem>
                <SelectItem value="rejected">مرفوضة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[180px]">
                <Database className="w-4 h-4 ml-2" />
                <SelectValue placeholder="الموديول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموديولات</SelectItem>
                {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            سجل التدقيق الأمني — Audit Log
            <Badge variant="secondary" className="mr-2">{filteredAlerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-bold text-xs">
                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />التاريخ</div>
                  </TableHead>
                  <TableHead className="text-right font-bold text-xs">
                    <div className="flex items-center gap-1"><User className="w-3 h-3" />المراجع</div>
                  </TableHead>
                  <TableHead className="text-right font-bold text-xs">الموديول</TableHead>
                  <TableHead className="text-right font-bold text-xs">نوع التغيير</TableHead>
                  <TableHead className="text-right font-bold text-xs">الحالة</TableHead>
                  <TableHead className="text-right font-bold text-xs">ملخص الأثر</TableHead>
                  <TableHead className="text-right font-bold text-xs">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد تغييرات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map(alert => {
                    const impact = alert.impact_analysis;
                    const impactSummary = impact
                      ? `${impact.sales_invoices + impact.purchase_invoices} فواتير · ${impact.journal_entries} قيود`
                      : '-';
                    return (
                      <TableRow key={alert.id} className={alert.status === 'pending' ? 'bg-amber-50/50' : ''}>
                        <TableCell className="text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {new Date(alert.created_at).toLocaleDateString('ar-SA')}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(alert.created_at).toLocaleTimeString('ar-SA')}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {alert.reviewed_by || (
                            <span className="text-muted-foreground italic">لم تتم المراجعة</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{alert.affected_module}</TableCell>
                        <TableCell className="text-xs">{changeTypeLabel(alert.change_type)}</TableCell>
                        <TableCell>{statusBadge(alert.status)}</TableCell>
                        <TableCell className="text-xs">{impactSummary}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-xs"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <Eye className="w-3 h-3" />
                            عرض
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <SheetContent side="left" className="w-[600px] sm:max-w-[600px] overflow-y-auto" dir="rtl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              تفاصيل التغيير
            </SheetTitle>
          </SheetHeader>
          {selectedAlert && (
            <div className="mt-4">
              <SystemChangeDetailView alert={selectedAlert} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <div className={`text-2xl font-bold ${color}`}>{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
