import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { FileText, ArrowLeftRight, Database, Clock, User } from 'lucide-react';
import { SystemChangeAlert } from '@/hooks/useSystemChangeAlerts';

interface Props {
  alert: SystemChangeAlert;
}

export function SystemChangeDetailView({ alert }: Props) {
  const prevValue = alert.previous_value || {};
  const newValue = alert.new_value || {};

  // Get all unique keys from both previous and new
  const allKeys = [...new Set([...Object.keys(prevValue), ...Object.keys(newValue)])];

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800">تمت الموافقة</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800">معلق</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Change Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            ملخص التغيير
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">الحالة</span>
            {statusBadge(alert.status)}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">نوع التغيير</span>
            <span className="font-medium">{alert.change_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الموديول</span>
            <span className="font-medium">{alert.affected_module}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الوصف</span>
            <span className="font-medium max-w-[60%] text-left">{alert.description}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> وقت الاكتشاف</span>
            <span>{new Date(alert.created_at).toLocaleString('ar-SA')}</span>
          </div>
          {alert.reviewed_by && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> تمت المراجعة بواسطة</span>
                <span>{alert.reviewed_by}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">وقت المراجعة</span>
                <span>{alert.reviewed_at ? new Date(alert.reviewed_at).toLocaleString('ar-SA') : '-'}</span>
              </div>
            </>
          )}
          {alert.review_notes && (
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <span className="text-xs text-muted-foreground">ملاحظات المراجعة:</span>
              <p className="mt-1">{alert.review_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Before/After Comparison */}
      {allKeys.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              مقارنة القيم (قبل / بعد)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الحقل</TableHead>
                  <TableHead className="text-right">القيمة السابقة</TableHead>
                  <TableHead className="text-right">القيمة الجديدة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allKeys.map(key => {
                  const prev = JSON.stringify(prevValue[key] ?? '-');
                  const curr = JSON.stringify(newValue[key] ?? '-');
                  const changed = prev !== curr;
                  return (
                    <TableRow key={key} className={changed ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-medium">{key}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs max-w-[200px] truncate">{prev}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">{curr}</TableCell>
                      <TableCell>
                        {changed ? (
                          <Badge variant="destructive" className="text-xs">تغيّر</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">ثابت</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Affected Tables */}
      {alert.affected_tables && alert.affected_tables.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4" />
              الجداول المتأثرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {alert.affected_tables.map(t => (
                <Badge key={t} variant="outline" className="px-3 py-1">
                  {t}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impact Analysis Detail */}
      {alert.impact_analysis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">تحليل الأثر التفصيلي</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">البند</TableHead>
                  <TableHead className="text-right">التأثير</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(alert.impact_analysis).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">
                      {key === 'sales_invoices' ? 'فواتير المبيعات' :
                       key === 'purchase_invoices' ? 'فواتير المشتريات' :
                       key === 'journal_entries' ? 'القيود المحاسبية' :
                       key === 'account_balances_affected' ? 'أرصدة الحسابات' :
                       key === 'trial_balance_impact' ? 'ميزان المراجعة' :
                       key === 'vat_reports_impact' ? 'تقارير الضريبة' : key}
                    </TableCell>
                    <TableCell className={typeof value === 'number' && value > 0 ? 'text-destructive font-bold' : ''}>
                      {String(value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
