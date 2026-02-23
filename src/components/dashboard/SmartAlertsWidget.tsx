import { AlertTriangle, Clock, HandCoins, CreditCard, FileText, ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';
import { ActivePage } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SmartAlertsWidgetProps {
  setActivePage: (page: ActivePage) => void;
}

interface AlertItem {
  id: string;
  type: 'overdue_check' | 'open_custody' | 'overdue_installment' | 'pending_invoice';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  action: ActivePage;
  count?: number;
}

export function SmartAlertsWidget({ setActivePage }: SmartAlertsWidgetProps) {
  const companyId = useCompanyId();
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  // Fetch overdue checks
  const { data: overdueChecks = 0 } = useQuery({
    queryKey: ['smart-alerts-checks', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('checks')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .in('status', ['pending', 'active'])
        .lte('due_date', today);
      return count || 0;
    },
    enabled: !!companyId,
  });

  // Fetch open custodies
  const { data: openCustodies = 0 } = useQuery({
    queryKey: ['smart-alerts-custodies', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const { count } = await supabase
        .from('custodies')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active');
      return count || 0;
    },
    enabled: !!companyId,
  });

  // Fetch overdue installments
  const { data: overdueInstallments = 0 } = useQuery({
    queryKey: ['smart-alerts-installments', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('installment_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lte('due_date', today);
      return count || 0;
    },
    enabled: !!companyId,
  });

  // Fetch draft invoices
  const { data: draftInvoices = 0 } = useQuery({
    queryKey: ['smart-alerts-drafts', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'draft');
      return count || 0;
    },
    enabled: !!companyId,
  });

  const alerts: AlertItem[] = [];

  if (overdueChecks > 0) {
    alerts.push({
      id: 'overdue-checks',
      type: 'overdue_check',
      title: isRtl ? 'شيكات مستحقة' : 'Overdue Checks',
      description: isRtl ? `${overdueChecks} شيك مستحق الدفع اليوم أو متأخر` : `${overdueChecks} checks due today or overdue`,
      severity: 'critical',
      action: 'checks',
      count: overdueChecks,
    });
  }

  if (openCustodies > 0) {
    alerts.push({
      id: 'open-custodies',
      type: 'open_custody',
      title: isRtl ? 'عهد مفتوحة' : 'Open Custodies',
      description: isRtl ? `${openCustodies} عهدة لم تُسوَّ بعد` : `${openCustodies} custodies not yet settled`,
      severity: openCustodies > 5 ? 'warning' : 'info',
      action: 'custody',
      count: openCustodies,
    });
  }

  if (overdueInstallments > 0) {
    alerts.push({
      id: 'overdue-installments',
      type: 'overdue_installment',
      title: isRtl ? 'أقساط متأخرة' : 'Overdue Installments',
      description: isRtl ? `${overdueInstallments} قسط متأخر عن موعده` : `${overdueInstallments} installments past due`,
      severity: 'critical',
      action: 'installments',
      count: overdueInstallments,
    });
  }

  if (draftInvoices > 0) {
    alerts.push({
      id: 'draft-invoices',
      type: 'pending_invoice',
      title: isRtl ? 'فواتير مسودة' : 'Draft Invoices',
      description: isRtl ? `${draftInvoices} فاتورة بحاجة للاعتماد` : `${draftInvoices} invoices need approval`,
      severity: 'info',
      action: 'sales',
      count: draftInvoices,
    });
  }

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'overdue_check': return Clock;
      case 'open_custody': return HandCoins;
      case 'overdue_installment': return CreditCard;
      case 'pending_invoice': return FileText;
    }
  };

  const getSeverityStyles = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';
      case 'warning': return 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800';
      case 'info': return 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800';
    }
  };

  const getSeverityBadge = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'warning': return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
      case 'info': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-border">
        <h2 className="text-sm sm:text-base font-bold text-card-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          {isRtl ? 'التنبيهات الذكية' : 'Smart Alerts'}
        </h2>
        <div className="text-center py-6 text-muted-foreground text-sm">
          <div className="text-2xl mb-2">✅</div>
          {isRtl ? 'لا توجد تنبيهات - كل شيء على ما يرام!' : 'No alerts - everything looks good!'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-border">
      <h2 className="text-sm sm:text-base font-bold text-card-foreground mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        {isRtl ? 'التنبيهات الذكية' : 'Smart Alerts'}
        <Badge variant="secondary" className="text-[10px] px-1.5">{alerts.length}</Badge>
      </h2>
      <div className="space-y-2">
        {alerts.map(alert => {
          const Icon = getAlertIcon(alert.type);
          return (
            <button
              key={alert.id}
              onClick={() => setActivePage(alert.action)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm text-start',
                getSeverityStyles(alert.severity)
              )}
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', getSeverityBadge(alert.severity))}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs sm:text-sm">{alert.title}</span>
                  {alert.count && (
                    <Badge className={cn('text-[10px] px-1.5 py-0', getSeverityBadge(alert.severity))}>
                      {alert.count}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{alert.description}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0 rtl:rotate-0 ltr:rotate-180" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
