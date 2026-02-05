import { Bell, AlertTriangle, CreditCard, Calendar, Clock, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useInstallmentSales } from '@/hooks/useInstallments';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ActivePage } from '@/types';
import { useState } from 'react';

interface PaymentReminder {
  id: string;
  customerName: string;
  amount: number;
  dueDate: Date;
  status: 'overdue' | 'today' | 'upcoming';
  installmentNumber: number;
  totalInstallments: number;
}

interface PaymentRemindersPopoverProps {
  setActivePage?: (page: ActivePage) => void;
}

export function PaymentRemindersPopover({ setActivePage }: PaymentRemindersPopoverProps) {
  const { data: installmentSales = [] } = useInstallmentSales();
  const [open, setOpen] = useState(false);

  const reminders: PaymentReminder[] = installmentSales
    .filter(sale => sale.status !== 'completed' && sale.status !== 'cancelled')
    .flatMap(sale => {
      const payments: PaymentReminder[] = [];
      
      if (sale.payments && sale.payments.length > 0) {
        sale.payments
          .filter(payment => payment.status === 'pending' || payment.status === 'overdue')
          .slice(0, 3)
          .forEach(payment => {
            const dueDate = new Date(payment.due_date);
            const isPastDue = isPast(dueDate) && !isToday(dueDate);
            const isTodayDue = isToday(dueDate);
            
            payments.push({
              id: payment.id,
              customerName: sale.sale?.customer?.name || 'عميل غير معروف',
              amount: payment.amount,
              dueDate,
              status: isPastDue ? 'overdue' : isTodayDue ? 'today' : 'upcoming',
              installmentNumber: payment.payment_number,
              totalInstallments: sale.number_of_installments,
            });
          });
      }
      
      return payments;
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 10);

  const overdueCount = reminders.filter(r => r.status === 'overdue').length;
  const todayCount = reminders.filter(r => r.status === 'today').length;
  const totalNotifications = overdueCount + todayCount;

  const getStatusBadge = (status: PaymentReminder['status']) => {
    switch (status) {
      case 'overdue':
        return (
          <Badge variant="destructive" className="gap-1 text-[10px] h-5">
            <AlertTriangle className="w-3 h-3" />
            متأخر
          </Badge>
        );
      case 'today':
        return (
          <Badge className="bg-warning text-warning-foreground gap-1 text-[10px] h-5">
            <Clock className="w-3 h-3" />
            اليوم
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge variant="secondary" className="gap-1 text-[10px] h-5">
            <Calendar className="w-3 h-3" />
            قادم
          </Badge>
        );
    }
  };

  const getDaysText = (dueDate: Date) => {
    const days = differenceInDays(dueDate, new Date());
    if (days < 0) return `متأخر ${Math.abs(days)} يوم`;
    if (days === 0) return 'اليوم';
    if (days === 1) return 'غداً';
    return `بعد ${days} يوم`;
  };

  const handleItemClick = () => {
    setOpen(false);
    setActivePage?.('installments');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative gap-2 hover:bg-primary/10"
        >
          <Bell className="w-5 h-5" />
          {totalNotifications > 0 && (
            <Badge 
              variant="destructive" 
              className="h-5 min-w-5 px-1.5 text-xs absolute -top-1 -right-1"
            >
              {totalNotifications}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              إشعارات الدفع
            </h4>
            <div className="flex items-center gap-1.5">
              {overdueCount > 0 && (
                <Badge variant="destructive" className="text-[10px] h-5">
                  {overdueCount} متأخر
                </Badge>
              )}
              {todayCount > 0 && (
                <Badge className="bg-warning text-warning-foreground text-[10px] h-5">
                  {todayCount} اليوم
                </Badge>
              )}
            </div>
          </div>
        </div>
        <ScrollArea className="max-h-[350px]">
          <div className="p-2 space-y-1.5">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  reminder.status === 'overdue'
                    ? 'bg-destructive/5 border-destructive/30 hover:border-destructive/50'
                    : reminder.status === 'today'
                    ? 'bg-warning/5 border-warning/30 hover:border-warning/50'
                    : 'bg-card border-border hover:border-primary/30'
                }`}
                onClick={handleItemClick}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{reminder.customerName}</p>
                      {getStatusBadge(reminder.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        القسط {reminder.installmentNumber}/{reminder.totalInstallments}
                      </span>
                      <span>{getDaysText(reminder.dueDate)}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${
                      reminder.status === 'overdue' ? 'text-destructive' : ''
                    }`}>
                      {reminder.amount.toLocaleString()} ر.س
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(reminder.dueDate, 'dd MMM', { locale: ar })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {reminders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد إشعارات دفع</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {reminders.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary hover:text-primary"
              onClick={handleItemClick}
            >
              عرض جميع الأقساط
              <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
