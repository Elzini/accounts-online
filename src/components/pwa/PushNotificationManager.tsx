import { useState } from 'react';
import { Bell, BellOff, BellRing, Settings, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function PushNotificationManager() {
  const { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe, sendLocalNotification } = usePushNotifications();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [open, setOpen] = useState(false);

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.success(isAr ? 'تم إيقاف الإشعارات' : 'Notifications disabled');
    } else {
      const success = await subscribe();
      if (success) {
        toast.success(isAr ? 'تم تفعيل الإشعارات بنجاح!' : 'Notifications enabled!');
      } else if (permission === 'denied') {
        toast.error(isAr ? 'تم رفض إذن الإشعارات. يرجى تغيير الإعداد من المتصفح.' : 'Permission denied. Please change in browser settings.');
      }
    }
  };

  const handleTest = () => {
    sendLocalNotification(
      isAr ? '🔔 إشعار تجريبي' : '🔔 Test Notification',
      {
        body: isAr ? 'الإشعارات تعمل بنجاح! سيصلك تنبيه عند وجود فواتير متأخرة أو مخزون منخفض.' : 'Notifications are working! You will receive alerts for overdue invoices and low stock.',
        tag: 'test-notification',
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {isSubscribed ? <BellRing className="w-4 h-4 text-primary" /> : <Bell className="w-4 h-4" />}
          <span className="hidden sm:inline">{isAr ? 'الإشعارات' : 'Notifications'}</span>
          {isSubscribed && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {isAr ? 'مفعّل' : 'ON'}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary" />
            {isAr ? 'إعدادات الإشعارات' : 'Notification Settings'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Support Status */}
          {!isSupported && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm">
                {isAr 
                  ? 'متصفحك لا يدعم الإشعارات. جرب Chrome أو Edge.' 
                  : 'Your browser does not support notifications. Try Chrome or Edge.'}
              </p>
            </div>
          )}

          {permission === 'denied' && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 text-destructive">
              <BellOff className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {isAr ? 'الإشعارات محظورة' : 'Notifications blocked'}
                </p>
                <p className="text-xs mt-0.5 opacity-80">
                  {isAr 
                    ? 'يرجى السماح بالإشعارات من إعدادات المتصفح'
                    : 'Please allow notifications in browser settings'}
                </p>
              </div>
            </div>
          )}

          {/* Main Toggle */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isSubscribed 
                    ? <BellRing className="w-5 h-5 text-primary" /> 
                    : <BellOff className="w-5 h-5 text-muted-foreground" />
                  }
                  <div>
                    <p className="font-medium text-sm">
                      {isAr ? 'تفعيل الإشعارات الفورية' : 'Enable Push Notifications'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isAr ? 'استلم تنبيهات حتى لو كان التطبيق مغلقاً' : 'Receive alerts even when app is closed'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={handleToggle}
                  disabled={!isSupported || permission === 'denied' || isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Categories */}
          {isSubscribed && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  {isAr ? 'أنواع الإشعارات' : 'Notification Types'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAr ? 'اختر ما تريد تلقي إشعارات بشأنه' : 'Choose what to receive notifications for'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: '💰', label: isAr ? 'فواتير متأخرة' : 'Overdue invoices', key: 'invoices' },
                  { icon: '📦', label: isAr ? 'مخزون منخفض' : 'Low stock alerts', key: 'stock' },
                  { icon: '💳', label: isAr ? 'شيكات مستحقة' : 'Due checks', key: 'checks' },
                  { icon: '📋', label: isAr ? 'طلبات موافقة' : 'Approval requests', key: 'approvals' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Test Button */}
          {isSubscribed && (
            <Button variant="outline" className="w-full gap-2" onClick={handleTest}>
              <Bell className="w-4 h-4" />
              {isAr ? 'إرسال إشعار تجريبي' : 'Send Test Notification'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
