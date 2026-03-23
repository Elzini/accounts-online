import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  UserCheck, Clock, CheckCircle2, XCircle, Shield, AlertTriangle
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { useTwoPersonApprovals, useApproveTwoPersonRequest, useRejectTwoPersonRequest } from '@/hooks/modules/useSuperAdminServices';

export function TwoPersonApprovalPanel() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [authCode, setAuthCode] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: requests = [], isLoading } = useTwoPersonApprovals();

  const approveRequest = useApproveTwoPersonRequest();
  const rejectRequest = useRejectTwoPersonRequest();

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'في انتظار الموافقة الأولى', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
    first_approved: { label: 'في انتظار الموافقة الثانية', color: 'bg-blue-500/10 text-blue-600', icon: UserCheck },
    approved: { label: 'تمت الموافقة والتطبيق', color: 'bg-green-500/10 text-green-600', icon: CheckCircle2 },
    rejected: { label: 'مرفوض', color: 'bg-red-500/10 text-red-600', icon: XCircle },
  };

  const changeTypeLabels: Record<string, string> = {
    code_change: '💻 تغيير كود النظام',
    schema_change: '🗄️ تغيير هيكل البيانات',
    financial_logic: '💰 تعديل منطق محاسبي',
    tax_config: '🏛️ تعديل إعدادات الضرائب',
    config_change: '⚙️ تغيير إعدادات النظام',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            نظام الموافقة الثنائية
            <Badge variant="outline">{requests.filter((r: any) => r.status === 'pending' || r.status === 'first_approved').length} قيد الانتظار</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-lg bg-muted/30 border mb-4">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">سير العمل:</p>
                <ol className="text-muted-foreground list-decimal list-inside space-y-1 mt-1">
                  <li>محاكاة التغيير وتحليل الأثر</li>
                  <li>موافقة مالك النظام (المرحلة الأولى)</li>
                  <li>موافقة المراقب المالي أو مسؤول الأمان (المرحلة الثانية)</li>
                  <li>كود تفويض OTP أو Master Code</li>
                  <li>نسخة احتياطية تلقائية</li>
                  <li>تطبيق التغيير</li>
                </ol>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد طلبات تغيير</div>
            ) : (
              <div className="space-y-3">
                {requests.map((req: any) => {
                  const config = statusConfig[req.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={req.id}
                      className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedRequest(req)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {changeTypeLabels[req.change_type] || req.change_type}
                        </span>
                        <Badge className={config.color}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm">{req.change_description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(req.created_at).toLocaleString('ar-SA')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              تفاصيل طلب التغيير
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">النوع:</span>
                  <p className="font-medium">{changeTypeLabels[selectedRequest.change_type] || selectedRequest.change_type}</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">الحالة:</span>
                  <p className="font-medium">{statusConfig[selectedRequest.status]?.label}</p>
                </div>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium mb-1">الوصف:</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.change_description}</p>
              </div>

              {selectedRequest.impact_analysis && Object.keys(selectedRequest.impact_analysis).length > 0 && (
                <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <p className="text-sm font-medium mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    تحليل الأثر:
                  </p>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(selectedRequest.impact_analysis, null, 2)}
                  </pre>
                </div>
              )}

              {(selectedRequest.status === 'pending' || selectedRequest.status === 'first_approved') && (
                <div className="space-y-3 border-t pt-3">
                  <Input
                    type="password"
                    placeholder="كود التفويض..."
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => approveRequest.mutate({
                        requestId: selectedRequest.id,
                        approverLevel: selectedRequest.status === 'pending' ? 'first' : 'second',
                        authCode,
                      })}
                      disabled={approveRequest.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 ml-1" />
                      موافقة ({selectedRequest.status === 'pending' ? 'المرحلة 1' : 'المرحلة 2'})
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => rejectRequest.mutate(selectedRequest.id)}
                      disabled={rejectRequest.isPending}
                    >
                      <XCircle className="h-4 w-4 ml-1" />
                      رفض
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
