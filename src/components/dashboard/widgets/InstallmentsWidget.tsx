import { CreditCard, Calendar, AlertTriangle, DollarSign, Users } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { ActivePage } from '@/types';

interface InstallmentsWidgetProps {
  installmentSales: any[];
  setActivePage: (page: ActivePage) => void;
  cardConfig: {
    size?: 'small' | 'medium' | 'large';
    bgColor?: string;
    fontSize?: number;
    height?: number;
    enable3D?: boolean;
    label?: string;
  };
  getCardLabel: (id: string, defaultLabel: string) => string;
  getCardConfig: (id: string) => any;
}

export function useInstallmentStats(installmentSales: any[]) {
  const activeInstallments = installmentSales.filter(s => s.status === 'active');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalDueAmount = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  let upcomingThisMonth = 0;
  let nextPaymentInfo: { customerName: string; amount: number; dueDate: string; isOverdue: boolean } | null = null;

  activeInstallments.forEach(installment => {
    const unpaidPayments = installment.payments?.filter((p: any) => p.status !== 'paid') || [];
    unpaidPayments.forEach((payment: any) => {
      const dueDate = new Date(payment.due_date);
      dueDate.setHours(0, 0, 0, 0);
      totalDueAmount += payment.amount - (payment.paid_amount || 0);

      if (dueDate < today) {
        overdueCount++;
        overdueAmount += payment.amount - (payment.paid_amount || 0);
      } else {
        const thisMonth = new Date();
        const endOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0);
        if (dueDate <= endOfMonth) {
          upcomingThisMonth++;
        }
      }
    });

    const nextPayment = unpaidPayments
      .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

    if (nextPayment && !nextPaymentInfo) {
      const paymentDueDate = new Date(nextPayment.due_date);
      paymentDueDate.setHours(0, 0, 0, 0);
      nextPaymentInfo = {
        customerName: installment.sale?.customer?.name || 'عميل غير محدد',
        amount: nextPayment.amount - (nextPayment.paid_amount || 0),
        dueDate: nextPayment.due_date,
        isOverdue: paymentDueDate < today
      };
    }
  });

  return {
    activeInstallments,
    totalDueAmount,
    overdueCount,
    overdueAmount,
    upcomingThisMonth,
    nextPaymentInfo,
    hasData: activeInstallments.length > 0 || installmentSales.length > 0,
  };
}

export function ActiveInstallmentsCard({ stats, setActivePage, getCardLabel, getCardConfig }: {
  stats: ReturnType<typeof useInstallmentStats>;
  setActivePage: (page: ActivePage) => void;
  getCardLabel: (id: string, defaultLabel: string) => string;
  getCardConfig: (id: string) => any;
}) {
  const cfg = getCardConfig('activeInstallments');
  return (
    <StatCard
      title={getCardLabel('activeInstallments', 'عقود التقسيط النشطة')}
      value={stats.activeInstallments.length}
      icon={CreditCard}
      gradient="primary"
      subtitle="عقد نشط"
      onClick={() => setActivePage('installments')}
      size={cfg.size}
      bgColor={cfg.bgColor}
      fontSize={cfg.fontSize}
      height={cfg.height}
      enable3D={cfg.enable3D}
    />
  );
}

export function OverdueInstallmentsCard({ stats, setActivePage, getCardLabel, getCardConfig }: {
  stats: ReturnType<typeof useInstallmentStats>;
  setActivePage: (page: ActivePage) => void;
  getCardLabel: (id: string, defaultLabel: string) => string;
  getCardConfig: (id: string) => any;
}) {
  const cfg = getCardConfig('overdueInstallments');
  return (
    <StatCard
      title={getCardLabel('overdueInstallments', 'الأقساط المتأخرة')}
      value={stats.overdueCount}
      icon={AlertTriangle}
      gradient="danger"
      subtitle={`${new Intl.NumberFormat('ar-SA').format(stats.overdueAmount)} ر.س`}
      onClick={() => setActivePage('installments')}
      size={cfg.size}
      bgColor={cfg.bgColor}
      fontSize={cfg.fontSize}
      height={cfg.height}
      enable3D={cfg.enable3D}
    />
  );
}

export function UpcomingInstallmentsCard({ stats, setActivePage, getCardLabel, getCardConfig }: {
  stats: ReturnType<typeof useInstallmentStats>;
  setActivePage: (page: ActivePage) => void;
  getCardLabel: (id: string, defaultLabel: string) => string;
  getCardConfig: (id: string) => any;
}) {
  const cfg = getCardConfig('upcomingInstallments');
  return (
    <StatCard
      title={getCardLabel('upcomingInstallments', 'أقساط الشهر الحالي')}
      value={stats.upcomingThisMonth}
      icon={Calendar}
      gradient="warning"
      subtitle="قسط مستحق"
      onClick={() => setActivePage('installments')}
      size={cfg.size}
      bgColor={cfg.bgColor}
      fontSize={cfg.fontSize}
      height={cfg.height}
      enable3D={cfg.enable3D}
    />
  );
}

export function TotalDueCard({ stats, setActivePage, getCardLabel, getCardConfig }: {
  stats: ReturnType<typeof useInstallmentStats>;
  setActivePage: (page: ActivePage) => void;
  getCardLabel: (id: string, defaultLabel: string) => string;
  getCardConfig: (id: string) => any;
}) {
  const cfg = getCardConfig('totalDue');
  return (
    <StatCard
      title={getCardLabel('totalDue', 'إجمالي المستحق')}
      value={`${new Intl.NumberFormat('ar-SA').format(stats.totalDueAmount)} ر.س`}
      icon={DollarSign}
      gradient="success"
      subtitle="ريال سعودي"
      onClick={() => setActivePage('installments')}
      size={cfg.size}
      bgColor={cfg.bgColor}
      fontSize={cfg.fontSize}
      height={cfg.height}
      enable3D={cfg.enable3D}
    />
  );
}

export function NextPaymentCard({ stats, setActivePage }: {
  stats: ReturnType<typeof useInstallmentStats>;
  setActivePage: (page: ActivePage) => void;
}) {
  if (!stats.nextPaymentInfo) return null;
  const info = stats.nextPaymentInfo;
  
  return (
    <div 
      className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 shadow-sm border border-border hover-lift animate-fade-in cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => setActivePage('installments')}
    >
      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2 sm:mb-3">القسط القادم</p>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
          info.isOverdue ? 'gradient-danger' : 'gradient-primary'
        }`}>
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base md:text-lg font-bold text-card-foreground truncate">
            {info.customerName}
          </p>
          <div className="flex items-center gap-3 sm:gap-4 mt-1 text-xs sm:text-sm text-muted-foreground">
            <span className="font-semibold text-card-foreground">
              {new Intl.NumberFormat('ar-SA').format(info.amount)} ر.س
            </span>
            <span className="text-muted-foreground">•</span>
            <span className={info.isOverdue ? 'text-destructive font-semibold' : ''}>
              {new Date(info.dueDate).toLocaleDateString('ar-SA')}
            </span>
            {info.isOverdue && (
              <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
                متأخر
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
