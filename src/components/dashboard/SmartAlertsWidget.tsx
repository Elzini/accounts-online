import { useState } from 'react';
import { AlertTriangle, Clock, HandCoins, CreditCard, FileText, ChevronLeft, Settings2, Check, Bell, BellOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';
import { ActivePage } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ALERTS_CONFIG_KEY = 'dashboard_smart_alerts_config';

interface AlertTypeConfig {
  id: string;
  enabled: boolean;
  threshold: number; // minimum count to trigger alert
}

const DEFAULT_ALERT_CONFIGS: AlertTypeConfig[] = [
  { id: 'overdue_check', enabled: true, threshold: 1 },
  { id: 'open_custody', enabled: true, threshold: 1 },
  { id: 'overdue_installment', enabled: true, threshold: 1 },
  { id: 'pending_invoice', enabled: true, threshold: 1 },
];

function loadAlertConfig(): AlertTypeConfig[] {
  try {
    const saved = localStorage.getItem(ALERTS_CONFIG_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_ALERT_CONFIGS;
}

function saveAlertConfig(configs: AlertTypeConfig[]) {
  localStorage.setItem(ALERTS_CONFIG_KEY, JSON.stringify(configs));
}

interface SmartAlertsWidgetProps {
  setActivePage: (page: ActivePage) => void;
}

interface AlertItem {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  action: ActivePage;
  count?: number;
}

const ALERT_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  overdue_check: { ar: 'شيكات مستحقة', en: 'Overdue Checks' },
  open_custody: { ar: 'عهد مفتوحة', en: 'Open Custodies' },
  overdue_installment: { ar: 'أقساط متأخرة', en: 'Overdue Installments' },
  pending_invoice: { ar: 'فواتير مسودة', en: 'Draft Invoices' },
};

export function SmartAlertsWidget({ setActivePage }: SmartAlertsWidgetProps) {
  const companyId = useCompanyId();
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const [alertConfigs, setAlertConfigs] = useState<AlertTypeConfig[]>(loadAlertConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const getConfig = (id: string) => alertConfigs.find(c => c.id === id) || { id, enabled: true, threshold: 1 };

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
    enabled: !!companyId && getConfig('overdue_check').enabled,
  });

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
    enabled: !!companyId && getConfig('open_custody').enabled,
  });

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
    enabled: !!companyId && getConfig('overdue_installment').enabled,
  });

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
    enabled: !!companyId && getConfig('pending_invoice').enabled,
  });

  const toggleAlert = (id: string) => {
    const updated = alertConfigs.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c);
    setAlertConfigs(updated);
    saveAlertConfig(updated);
  };

  const updateThreshold = (id: string, threshold: number) => {
    const updated = alertConfigs.map(c => c.id === id ? { ...c, threshold: Math.max(1, threshold) } : c);
    setAlertConfigs(updated);
    saveAlertConfig(updated);
  };

  const alerts: AlertItem[] = [];
  const checkCfg = getConfig('overdue_check');
  if (checkCfg.enabled && overdueChecks >= checkCfg.threshold) {
    alerts.push({
      id: 'overdue-checks', type: 'overdue_check',
      title: isRtl ? 'شيكات مستحقة' : 'Overdue Checks',
      description: isRtl ? `${overdueChecks} شيك مستحق الدفع اليوم أو متأخر` : `${overdueChecks} checks due today or overdue`,
      severity: 'critical', action: 'checks', count: overdueChecks,
    });
  }

  const custodyCfg = getConfig('open_custody');
  if (custodyCfg.enabled && openCustodies >= custodyCfg.threshold) {
    alerts.push({
      id: 'open-custodies', type: 'open_custody',
      title: isRtl ? 'عهد مفتوحة' : 'Open Custodies',
      description: isRtl ? `${openCustodies} عهدة لم تُسوَّ بعد` : `${openCustodies} custodies not yet settled`,
      severity: openCustodies > 5 ? 'warning' : 'info', action: 'custody', count: openCustodies,
    });
  }

  const installmentCfg = getConfig('overdue_installment');
  if (installmentCfg.enabled && overdueInstallments >= installmentCfg.threshold) {
    alerts.push({
      id: 'overdue-installments', type: 'overdue_installment',
      title: isRtl ? 'أقساط متأخرة' : 'Overdue Installments',
      description: isRtl ? `${overdueInstallments} قسط متأخر عن موعده` : `${overdueInstallments} installments past due`,
      severity: 'critical', action: 'installments', count: overdueInstallments,
    });
  }

  const invoiceCfg = getConfig('pending_invoice');
  if (invoiceCfg.enabled && draftInvoices >= invoiceCfg.threshold) {
    alerts.push({
      id: 'draft-invoices', type: 'pending_invoice',
      title: isRtl ? 'فواتير مسودة' : 'Draft Invoices',
      description: isRtl ? `${draftInvoices} فاتورة بحاجة للاعتماد` : `${draftInvoices} invoices need approval`,
      severity: 'info', action: 'sales', count: draftInvoices,
    });
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue_check': return Clock;
      case 'open_custody': return HandCoins;
      case 'overdue_installment': return CreditCard;
      case 'pending_invoice': return FileText;
      default: return AlertTriangle;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';
      case 'warning': return 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800';
      default: return 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'warning': return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm sm:text-base font-bold text-card-foreground flex items-center gap-2">
          <AlertTriangle className={cn('w-4 h-4', alerts.length > 0 ? 'text-amber-500' : 'text-muted-foreground')} />
          {isRtl ? 'التنبيهات الذكية' : 'Smart Alerts'}
          {alerts.length > 0 && <Badge variant="secondary" className="text-[10px] px-1.5">{alerts.length}</Badge>}
        </h2>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{isRtl ? 'إعدادات التنبيهات' : 'Alert Settings'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {alertConfigs.map(cfg => {
                const labels = ALERT_TYPE_LABELS[cfg.id];
                const Icon = getAlertIcon(cfg.id);
                return (
                  <div key={cfg.id} className={cn(
                    'p-3 rounded-lg border transition-colors',
                    cfg.enabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium flex-1">
                        {isRtl ? labels?.ar : labels?.en}
                      </span>
                      <button
                        onClick={() => toggleAlert(cfg.id)}
                        className={cn(
                          'p-1 rounded transition-colors',
                          cfg.enabled ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {cfg.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                    </div>
                    {cfg.enabled && (
                      <div className="flex items-center gap-2">
                        <Label className="text-[11px] text-muted-foreground shrink-0">
                          {isRtl ? 'نبهني عند:' : 'Alert when ≥'}
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={cfg.threshold}
                          onChange={e => updateThreshold(cfg.id, parseInt(e.target.value) || 1)}
                          className="h-7 w-16 text-xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <div className="text-2xl mb-2">✅</div>
          {isRtl ? 'لا توجد تنبيهات - كل شيء على ما يرام!' : 'No alerts - everything looks good!'}
        </div>
      ) : (
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
      )}
    </div>
  );
}
