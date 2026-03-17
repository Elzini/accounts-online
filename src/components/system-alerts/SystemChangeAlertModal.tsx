import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Shield, CheckCircle2, XCircle, Eye, Clock, FileText, Database, Code, Settings, Calculator, Receipt } from 'lucide-react';
import { SystemChangeAlert } from '@/hooks/useSystemChangeAlerts';
import { SystemChangeDetailView } from './SystemChangeDetailView';

interface Props {
  alert: SystemChangeAlert;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, notes?: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

const changeTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  code_change: { label: 'تغيير في الكود البرمجي', icon: Code, color: 'text-blue-500' },
  accounting_logic: { label: 'تغيير في المنطق المحاسبي', icon: Calculator, color: 'text-orange-500' },
  tax_calculation: { label: 'تغيير في حسابات الضرائب', icon: Receipt, color: 'text-red-500' },
  system_config: { label: 'تغيير في إعدادات النظام', icon: Settings, color: 'text-purple-500' },
  database_structure: { label: 'تغيير في هيكل قاعدة البيانات', icon: Database, color: 'text-green-500' },
};

export function SystemChangeAlertModal({ alert, open, onClose, onApprove, onReject, isApproving, isRejecting }: Props) {
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const config = changeTypeConfig[alert.change_type] || changeTypeConfig.system_config;
  const Icon = config.icon;
  const impact = alert.impact_analysis;

  if (showDetails) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              تفاصيل التغيير الكاملة
            </DialogTitle>
          </DialogHeader>
          <SystemChangeDetailView alert={alert} />
          <Button variant="outline" onClick={() => setShowDetails(false)} className="mt-4">
            العودة للتنبيه
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <span className="block">تنبيه تغيير في النظام</span>
              <span className="text-sm font-normal text-muted-foreground">يتطلب مراجعة وموافقة فورية</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Change Info */}
        <div className="space-y-4">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <span className="font-semibold">{config.label}</span>
                </div>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Clock className="w-3 h-3 ml-1" />
                  معلق
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">الموديول المتأثر:</span>
                  <span className="font-medium mr-2">{alert.affected_module}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">مصدر الطلب:</span>
                  <Badge variant="secondary" className="mr-2">
                    {alert.request_source === 'system' ? 'النظام' : 'مستخدم'}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">الوصف:</span>
                  <p className="font-medium mt-1">{alert.description}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">وقت الاكتشاف:</span>
                  <span className="font-medium mr-2">
                    {new Date(alert.created_at).toLocaleString('ar-SA')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impact Analysis */}
          {impact && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  تحليل الأثر المالي
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <ImpactItem label="فواتير المبيعات" value={impact.sales_invoices} />
                  <ImpactItem label="فواتير المشتريات" value={impact.purchase_invoices} />
                  <ImpactItem label="القيود المحاسبية" value={impact.journal_entries} />
                  <ImpactItem label="أرصدة الحسابات" value={impact.account_balances_affected} />
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground">ميزان المراجعة</div>
                    <div className="font-bold text-sm mt-1">{impact.trial_balance_impact || 'لا تأثير'}</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground">تقارير الضريبة</div>
                    <div className="font-bold text-sm mt-1">{impact.vat_reports_impact || 'لا تأثير'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Affected Tables */}
          {alert.affected_tables && alert.affected_tables.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">الجداول المتأثرة:</span>
              {alert.affected_tables.map(t => (
                <Badge key={t} variant="outline" className="text-xs">
                  <Database className="w-3 h-3 ml-1" />{t}
                </Badge>
              ))}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-1 block">ملاحظات المراجعة</label>
            <Textarea
              placeholder="أضف ملاحظاتك هنا..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => onApprove(alert.id, notes)}
              disabled={isApproving || isRejecting}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isApproving ? 'جاري الموافقة...' : 'موافقة وتطبيق'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => onReject(alert.id, notes)}
              disabled={isApproving || isRejecting}
              className="flex-1 gap-2"
            >
              <XCircle className="w-4 h-4" />
              {isRejecting ? 'جاري الرفض...' : 'رفض ومنع'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDetails(true)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              التفاصيل
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImpactItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 bg-muted rounded-lg">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold mt-1 ${value > 0 ? 'text-destructive' : 'text-success'}`}>
        {value}
      </div>
    </div>
  );
}
