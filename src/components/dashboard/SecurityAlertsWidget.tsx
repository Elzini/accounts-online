import { useState, forwardRef } from 'react';
import { Shield, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Clock, Eye, ChevronLeft, Snowflake, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useSystemChangeAlerts, SystemChangeAlert } from '@/hooks/useSystemChangeAlerts';
import { SystemChangeDetailView } from '@/components/system-alerts/SystemChangeDetailView';
import { cn } from '@/lib/utils';

export const SecurityAlertsWidget = forwardRef<HTMLDivElement>(function SecurityAlertsWidget(_, ref) {
  const { alerts, pendingAlerts, approvedAlerts, rejectedAlerts, securityStatus, isFrozen, isLoading } = useSystemChangeAlerts();
  const [selectedAlert, setSelectedAlert] = useState<SystemChangeAlert | null>(null);

  const statusConfig = {
    normal: { label: 'طبيعي', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    warning: { label: 'تحذير', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-200', dot: 'bg-amber-500' },
    frozen: { label: 'مجمّد', icon: Snowflake, color: 'text-sky-600', bg: 'bg-sky-500/10', border: 'border-sky-200', dot: 'bg-sky-500' },
  };
  const status = statusConfig[securityStatus];
  const StatusIcon = status.icon;

  const recentAlerts = alerts.slice(0, 5);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50 overflow-hidden">
        {/* Header with gradient accent */}
        <div className="relative bg-gradient-to-l from-primary/5 via-primary/8 to-transparent border-b border-border/40 px-5 py-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-l from-primary via-primary/60 to-transparent" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-card-foreground">مراقبة الأمان</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Activity className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">تحديث مباشر</span>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl border', status.bg, status.border)}>
              <div className="relative">
                <div className={cn('w-2 h-2 rounded-full', status.dot)} />
                <div className={cn('absolute inset-0 w-2 h-2 rounded-full animate-ping', status.dot)} />
              </div>
              <StatusIcon className={cn('w-3.5 h-3.5', status.color)} />
              <span className={cn('text-xs font-bold', status.color)}>{status.label}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <MiniStat icon={<AlertTriangle className="w-3.5 h-3.5" />} label="معلقة" value={pendingAlerts.length} color="text-amber-600" bg="bg-amber-500/10" />
            <MiniStat icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="موافق عليها" value={approvedAlerts.length} color="text-emerald-600" bg="bg-emerald-500/10" />
            <MiniStat icon={<XCircle className="w-3.5 h-3.5" />} label="مرفوضة" value={rejectedAlerts.length} color="text-destructive" bg="bg-destructive/10" />
          </div>

          {/* Recent Alerts */}
          <ScrollArea className="h-[220px]">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد تنبيهات أمنية</p>
                <p className="text-[10px] text-muted-foreground/60">النظام يعمل بشكل طبيعي</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAlerts.map(alert => (
                  <button
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={cn(
                      'w-full text-start p-3 rounded-xl border transition-all hover:shadow-sm group',
                      alert.status === 'pending' 
                        ? 'bg-amber-50/50 border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-800/40'
                        : alert.status === 'rejected'
                        ? 'bg-red-50/30 border-red-200/40 dark:bg-red-950/10 dark:border-red-800/30'
                        : 'bg-card border-border/40'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        alert.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        alert.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-emerald-100 text-emerald-700'
                      )}>
                        {alert.status === 'pending' ? <AlertTriangle className="w-4 h-4" /> :
                         alert.status === 'rejected' ? <XCircle className="w-4 h-4" /> :
                         <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold truncate">{alert.affected_module}</span>
                          <StatusBadge status={alert.status} />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{alert.description}</p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/70">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.created_at).toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                      <Eye className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
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
    </>
  );
}

function MiniStat({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string }) {
  return (
    <div className={cn('flex items-center gap-2 p-2.5 rounded-xl', bg)}>
      <div className={cn(color)}>{icon}</div>
      <div>
        <div className={cn('text-lg font-bold leading-tight', color)}>{value}</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0 h-4">موافق</Badge>;
    case 'rejected': return <Badge className="bg-red-100 text-red-700 border-red-200 text-[9px] px-1.5 py-0 h-4">مرفوض</Badge>;
    default: return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] px-1.5 py-0 h-4 animate-pulse">معلق</Badge>;
  }
}
