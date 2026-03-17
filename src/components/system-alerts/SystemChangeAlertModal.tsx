import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertTriangle, Shield, CheckCircle2, XCircle, Eye, Clock, Database,
  Code, Settings, Calculator, Receipt, ChevronRight, ChevronLeft,
  ShieldCheck, KeyRound, AlertCircle, TrendingDown, FileText
} from 'lucide-react';
import { SystemChangeAlert } from '@/hooks/useSystemChangeAlerts';
import { SystemChangeDetailView } from './SystemChangeDetailView';

interface Props {
  alert: SystemChangeAlert;
  allPendingAlerts: SystemChangeAlert[];
  open: boolean;
  onClose: () => void;
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, notes?: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  onNavigate: (alert: SystemChangeAlert) => void;
}

const changeTypeConfig: Record<string, { label: string; icon: any; colorClass: string; bgClass: string }> = {
  code_change: { label: 'تغيير في الكود البرمجي', icon: Code, colorClass: 'text-blue-600', bgClass: 'bg-blue-500/10' },
  accounting_logic: { label: 'تغيير في المنطق المحاسبي', icon: Calculator, colorClass: 'text-amber-600', bgClass: 'bg-amber-500/10' },
  tax_calculation: { label: 'تغيير في حسابات الضرائب', icon: Receipt, colorClass: 'text-destructive', bgClass: 'bg-destructive/10' },
  system_config: { label: 'تغيير في إعدادات النظام', icon: Settings, colorClass: 'text-violet-600', bgClass: 'bg-violet-500/10' },
  database_structure: { label: 'تغيير في هيكل قاعدة البيانات', icon: Database, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-500/10' },
};

function getRiskLevel(impact: SystemChangeAlert['impact_analysis']) {
  if (!impact) return { level: 'low', label: 'منخفض', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' };
  const total = impact.sales_invoices + impact.purchase_invoices + impact.journal_entries;
  if (total > 100 || impact.trial_balance_impact === 'متأثر') {
    return { level: 'high', label: 'مرتفع', color: 'bg-destructive', textColor: 'text-destructive', bgColor: 'bg-destructive/5' };
  }
  if (total > 10) {
    return { level: 'medium', label: 'متوسط', color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' };
  }
  return { level: 'low', label: 'منخفض', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' };
}

export function SystemChangeAlertModal({
  alert, allPendingAlerts, open, onClose, onApprove, onReject, isApproving, isRejecting, onNavigate
}: Props) {
  const [notes, setNotes] = useState('');
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [authCode, setAuthCode] = useState('');

  const config = changeTypeConfig[alert.change_type] || changeTypeConfig.system_config;
  const Icon = config.icon;
  const impact = alert.impact_analysis;
  const risk = getRiskLevel(impact);

  const currentIndex = allPendingAlerts.findIndex(a => a.id === alert.id);
  const hasNext = currentIndex < allPendingAlerts.length - 1;
  const hasPrev = currentIndex > 0;

  const handleApproveClick = () => {
    setShowApproveConfirm(true);
  };

  const handleConfirmApprove = () => {
    if (authCode.length < 4) return;
    onApprove(alert.id, notes);
    setShowApproveConfirm(false);
    setAuthCode('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[720px] max-h-[90vh] overflow-y-auto p-0" dir="rtl">
          {/* Header with gradient */}
          <div className="bg-gradient-to-l from-destructive/5 via-destructive/10 to-destructive/5 border-b px-6 pt-6 pb-4">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <DialogTitle className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-pulse" />
                  </div>
                  <div>
                    <span className="text-lg block">System Change Detected</span>
                    <span className="text-sm font-normal text-muted-foreground">يتطلب مراجعة وموافقة فورية قبل التطبيق</span>
                  </div>
                </DialogTitle>
              </div>

              {/* Navigation between alerts */}
              {allPendingAlerts.length > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-destructive/10">
                  <span className="text-xs text-muted-foreground">
                    التنبيه {currentIndex + 1} من {allPendingAlerts.length}
                  </span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!hasPrev}
                      onClick={() => hasPrev && onNavigate(allPendingAlerts[currentIndex - 1])}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!hasNext}
                      onClick={() => hasNext && onNavigate(allPendingAlerts[currentIndex + 1])}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </DialogHeader>
          </div>

          <div className="px-6 pb-6 space-y-4">
            {/* Section 1: Change Summary */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Change Summary
                  </h4>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgClass}`}>
                    <Icon className={`w-4 h-4 ${config.colorClass}`} />
                    <span className={`text-xs font-semibold ${config.colorClass}`}>{config.label}</span>
                  </div>
                </div>
                <Separator className="mb-3" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                  <InfoRow label="Module Name" value={alert.affected_module} />
                  <InfoRow label="Trigger Source" value={
                    <Badge variant="outline" className="text-xs">
                      {alert.request_source === 'system' ? '⚙️ System' : '👤 User'}
                    </Badge>
                  } />
                  <InfoRow label="Timestamp" value={new Date(alert.created_at).toLocaleString('ar-SA')} />
                  <InfoRow label="Change Type" value={alert.change_type.replace(/_/g, ' ')} />
                  <div className="col-span-2">
                    <InfoRow label="Description" value={alert.description} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Impact Analysis */}
            {impact && (
              <Card className={`border ${risk.level === 'high' ? 'border-destructive/30' : risk.level === 'medium' ? 'border-amber-300' : 'border-emerald-300'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Impact Analysis
                    </h4>
                    {/* Risk Level Indicator */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${risk.bgColor} border`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${risk.color} animate-pulse`} />
                      <span className={`text-xs font-bold ${risk.textColor}`}>Risk: {risk.label}</span>
                    </div>
                  </div>
                  <Separator className="mb-3" />
                  <div className="grid grid-cols-3 gap-3">
                    <ImpactCard label="Sales Invoices" sublabel="فواتير المبيعات" value={impact.sales_invoices} icon={<Receipt className="w-4 h-4" />} />
                    <ImpactCard label="Purchase Invoices" sublabel="فواتير المشتريات" value={impact.purchase_invoices} icon={<FileText className="w-4 h-4" />} />
                    <ImpactCard label="Journal Entries" sublabel="القيود المحاسبية" value={impact.journal_entries} icon={<Database className="w-4 h-4" />} />
                    <ImpactCard label="Accounts" sublabel="أرصدة الحسابات" value={impact.account_balances_affected} icon={<TrendingDown className="w-4 h-4" />} />
                    <ImpactTextCard label="Trial Balance" sublabel="ميزان المراجعة" value={impact.trial_balance_impact || 'No Impact'} isImpacted={impact.trial_balance_impact === 'متأثر'} />
                    <ImpactTextCard label="VAT Reports" sublabel="تقارير الضريبة" value={impact.vat_reports_impact || 'No Impact'} isImpacted={impact.vat_reports_impact !== 'لا تأثير'} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Affected Tables */}
            {alert.affected_tables && alert.affected_tables.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-1">
                <span className="text-xs text-muted-foreground font-medium">Affected Tables:</span>
                {alert.affected_tables.map(t => (
                  <Badge key={t} variant="outline" className="text-xs font-mono bg-muted/50">
                    <Database className="w-3 h-3 ml-1 text-muted-foreground" />{t}
                  </Badge>
                ))}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">ملاحظات المراجعة (اختياري)</label>
              <Textarea
                placeholder="أضف ملاحظاتك أو سبب القرار هنا..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleApproveClick}
                disabled={isApproving || isRejecting}
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md h-11"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Change
              </Button>
              <Button
                variant="destructive"
                onClick={() => onReject(alert.id, notes)}
                disabled={isApproving || isRejecting}
                className="flex-1 gap-2 shadow-md h-11"
              >
                <XCircle className="w-4 h-4" />
                Reject Change
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDetailSheet(true)}
                className="gap-2 h-11"
              >
                <Eye className="w-4 h-4" />
                View Details
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              تأكيد الموافقة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <span>أدخل كود التفويض أو OTP للموافقة على هذا التغيير. سيتم تطبيقه فوراً بعد التأكيد.</span>
            </div>
            <Input
              type="password"
              placeholder="كود التفويض (4 أحرف أو أكثر)"
              value={authCode}
              onChange={e => setAuthCode(e.target.value)}
              className="text-center tracking-[0.5em] font-mono"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleConfirmApprove}
                disabled={authCode.length < 4 || isApproving}
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <ShieldCheck className="w-4 h-4" />
                {isApproving ? 'جاري التطبيق...' : 'تأكيد الموافقة'}
              </Button>
              <Button variant="outline" onClick={() => { setShowApproveConfirm(false); setAuthCode(''); }}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Side Panel */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent side="left" className="w-[600px] sm:max-w-[600px] overflow-y-auto" dir="rtl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              تفاصيل التغيير الكاملة
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <SystemChangeDetailView alert={alert} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium text-xs">{value}</span>
    </div>
  );
}

function ImpactCard({ label, sublabel, value, icon }: { label: string; sublabel: string; value: number; icon: React.ReactNode }) {
  return (
    <div className={`text-center p-3 rounded-xl border ${value > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/50 border-border/50'}`}>
      <div className={`mx-auto mb-1.5 w-8 h-8 rounded-lg flex items-center justify-center ${value > 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${value > 0 ? 'text-destructive' : 'text-foreground'}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground font-medium">{label}</div>
      <div className="text-[10px] text-muted-foreground">{sublabel}</div>
    </div>
  );
}

function ImpactTextCard({ label, sublabel, value, isImpacted }: { label: string; sublabel: string; value: string; isImpacted: boolean }) {
  return (
    <div className={`text-center p-3 rounded-xl border ${isImpacted ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/50 border-border/50'}`}>
      <div className={`mx-auto mb-1.5 w-8 h-8 rounded-lg flex items-center justify-center ${isImpacted ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
        {isImpacted ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
      </div>
      <div className={`text-sm font-bold ${isImpacted ? 'text-destructive' : 'text-emerald-600'}`}>
        {isImpacted ? 'Yes' : 'No'}
      </div>
      <div className="text-[10px] text-muted-foreground font-medium">{label}</div>
      <div className="text-[10px] text-muted-foreground">{sublabel}</div>
    </div>
  );
}
