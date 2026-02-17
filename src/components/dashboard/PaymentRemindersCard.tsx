import { Bell, AlertTriangle, CreditCard, Calendar, ChevronLeft, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInstallmentSales } from '@/hooks/useInstallments';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ActivePage } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentReminder {
  id: string;
  customerName: string;
  amount: number;
  dueDate: Date;
  status: 'overdue' | 'today' | 'upcoming';
  installmentNumber: number;
  totalInstallments: number;
}

interface PaymentRemindersCardProps {
  setActivePage?: (page: ActivePage) => void;
}

export function PaymentRemindersCard({ setActivePage }: PaymentRemindersCardProps) {
  const { data: installmentSales = [] } = useInstallmentSales();
  const { t, language } = useLanguage();

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
              customerName: sale.sale?.customer?.name || t.unknown_customer,
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

  const getStatusBadge = (status: PaymentReminder['status']) => {
    switch (status) {
      case 'overdue':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            {t.status_overdue}
          </Badge>
        );
      case 'today':
        return (
          <Badge className="bg-warning text-warning-foreground gap-1">
            <Clock className="w-3 h-3" />
            {t.status_today}
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge variant="secondary" className="gap-1">
            <Calendar className="w-3 h-3" />
            {t.status_upcoming}
          </Badge>
        );
    }
  };

  const getDaysText = (dueDate: Date) => {
    const days = differenceInDays(dueDate, new Date());
    if (days < 0) return t.days_overdue.replace('{n}', String(Math.abs(days)));
    if (days === 0) return t.status_today;
    if (days === 1) return t.tomorrow_label;
    return t.in_days.replace('{n}', String(days));
  };

  return (
    <Card className="hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            {t.payment_notifications}
          </CardTitle>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                {overdueCount} {t.status_overdue}
              </Badge>
            )}
            {todayCount > 0 && (
              <Badge className="bg-warning text-warning-foreground gap-1">
                {todayCount} {t.status_today}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[180px] pr-2">
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                  reminder.status === 'overdue'
                    ? 'bg-destructive/5 border-destructive/30 hover:border-destructive/50'
                    : reminder.status === 'today'
                    ? 'bg-warning/5 border-warning/30 hover:border-warning/50'
                    : 'bg-card border-border hover:border-primary/30'
                }`}
                onClick={() => setActivePage?.('installments')}
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
                        {t.installment_label} {reminder.installmentNumber}/{reminder.totalInstallments}
                      </span>
                      <span>{getDaysText(reminder.dueDate)}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${
                      reminder.status === 'overdue' ? 'text-destructive' : ''
                    }`}>
                      {reminder.amount.toLocaleString()} {t.currency_symbol}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(reminder.dueDate, 'dd MMM', { locale: language === 'ar' ? ar : undefined })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {reminders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t.no_payment_notifications}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {reminders.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-primary hover:text-primary"
            onClick={() => setActivePage?.('installments')}
          >
            {t.view_all_installments}
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
