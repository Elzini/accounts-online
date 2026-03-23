import { useState, useEffect } from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2, XCircle, RefreshCw, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/notifications';
import { subscribeToTable } from '@/services/realtime';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

const typeIcons: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
  success: CheckCircle2,
};

const typeColors: Record<string, string> = {
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  danger: 'text-red-500',
  success: 'text-green-500',
};

const categoryLabels: Record<string, string> = {
  overdue_invoice: 'فواتير متأخرة',
  overdue_sale: 'مبيعات متأخرة',
  upcoming_installment: 'أقساط قادمة',
  overdue_installment: 'أقساط متأخرة',
  maturing_check: 'شيكات مستحقة',
  low_inventory: 'مخزون منخفض',
  low_stock: 'نفاد أصناف',
  expiring_contract: 'عقود تنتهي',
  expiring_subscription: 'اشتراكات تنتهي',
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30000,
  });

  // Realtime subscription for instant notifications
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : activeTab === 'unread'
      ? notifications.filter((n: any) => !n.is_read)
      : notifications.filter((n: any) => n.entity_type && categoryLabels[n.entity_type as string]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('تم تحديد الكل كمقروء');
    },
  });

  const refreshNotifications = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('لا توجد شركة');
      const { error } = await supabase.functions.invoke('smart-notifications', {
        body: { company_id: companyId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('تم تحديث الإشعارات الذكية');
    },
    onError: (err: any) => {
      toast.error(`خطأ: ${err.message}`);
    },
  });

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} د`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} س`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return d.toLocaleDateString('ar-SA');
  };

  // Group by category for summary
  const categoryCounts = notifications.reduce((acc: Record<string, number>, n: any) => {
    const cat = n.entity_type || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" dir="rtl" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">الإشعارات الذكية</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => refreshNotifications.mutate()}
              disabled={refreshNotifications.isPending}
              title="فحص وتحديث الإشعارات"
            >
              {refreshNotifications.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllRead.mutate()}>
                <CheckCheck className="w-3.5 h-3.5 ml-1" />
                قراءة الكل
              </Button>
            )}
          </div>
        </div>

        {/* Category Summary */}
        {Object.keys(categoryCounts).length > 1 && (
          <div className="flex gap-1 p-2 border-b overflow-x-auto">
            {Object.entries(categoryCounts).map(([cat, count]) => (
              categoryLabels[cat] && (
                <Badge key={cat} variant="outline" className="text-xs whitespace-nowrap shrink-0">
                  {categoryLabels[cat]} ({count})
                </Badge>
              )
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full rounded-none border-b h-8">
            <TabsTrigger value="all" className="text-xs h-7">الكل</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs h-7">
              غير مقروءة {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="max-h-80">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">لا توجد إشعارات</p>
                  <p className="text-xs mt-1">اضغط ⟳ لفحص التنبيهات الذكية</p>
                </div>
              ) : (
                filteredNotifications.map((n: any) => {
                  const Icon = typeIcons[n.type] || Info;
                  return (
                    <div
                      key={n.id}
                      className={`p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors ${!n.is_read ? 'bg-primary/5 border-r-2 border-r-primary' : ''}`}
                      onClick={() => !n.is_read && markRead.mutate(n.id)}
                    >
                      <div className="flex gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          n.type === 'danger' ? 'bg-red-100 dark:bg-red-950' :
                          n.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-950' :
                          n.type === 'success' ? 'bg-green-100 dark:bg-green-950' :
                          'bg-blue-100 dark:bg-blue-950'
                        }`}>
                          <Icon className={`w-4 h-4 ${typeColors[n.type] || 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-tight">{n.title}</p>
                            {!n.is_read && (
                              <div className="w-2 h-2 bg-primary rounded-full mt-1 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">{formatTime(n.created_at)}</span>
                            {n.entity_type && categoryLabels[n.entity_type] && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1">
                                {categoryLabels[n.entity_type]}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
