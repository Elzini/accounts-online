import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wallet, Users, Home, Briefcase, Receipt, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface MonthlyExpenseBreakdown {
  custodyExpenses: number;
  payrollExpenses: number;
  rentExpenses: number;
  otherExpenses: number;
  total: number;
}

async function fetchMonthlyExpenses(companyId: string, fiscalYearId?: string): Promise<MonthlyExpenseBreakdown> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  
  const monthStart = formatDate(startOfMonth);
  const monthEnd = formatDate(endOfMonth);

  // 1. Custody transaction expenses this month
  const custodyPromise = supabase
    .from('custody_transactions')
    .select('amount')
    .eq('company_id', companyId)
    .gte('transaction_date', monthStart)
    .lte('transaction_date', monthEnd);

  // 2. Payroll expenses this month (approved payroll records for current month/year)
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const payrollPromise = supabase
    .from('payroll_records')
    .select('total_base_salaries, total_allowances, total_bonuses, total_overtime, total_absences')
    .eq('company_id', companyId)
    .eq('status', 'approved')
    .eq('month', currentMonth)
    .eq('year', currentYear);

  // 3. Prepaid/Rent amortizations this month
  const prepaidPromise = supabase
    .from('prepaid_expense_amortizations')
    .select(`
      amount,
      amortization_date,
      status,
      prepaid_expense:prepaid_expenses!inner(company_id, status)
    `)
    .gte('amortization_date', monthStart)
    .lte('amortization_date', monthEnd);

  // 4. General expenses this month (non-car expenses)
  const expensesPromise = supabase
    .from('expenses')
    .select('amount, car_id, payment_method')
    .eq('company_id', companyId)
    .is('car_id', null)
    .gte('expense_date', monthStart)
    .lte('expense_date', monthEnd);

  const [custodyResult, payrollResult, prepaidResult, expensesResult] = await Promise.all([
    custodyPromise,
    payrollPromise,
    prepaidPromise,
    expensesPromise,
  ]);

  // Calculate custody total
  const custodyExpenses = custodyResult.data?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

  // Calculate payroll total
  const payrollExpenses = payrollResult.data?.reduce((sum, p) => {
    const base = Number(p.total_base_salaries) || 0;
    const allowances = Number(p.total_allowances) || 0;
    const bonuses = Number(p.total_bonuses) || 0;
    const overtime = Number(p.total_overtime) || 0;
    const absences = Number(p.total_absences) || 0;
    return sum + base + allowances + bonuses + overtime - absences;
  }, 0) || 0;

  // Calculate rent/prepaid expenses
  const rentExpenses = prepaidResult.data
    ?.filter(a => {
      const prepaid = a.prepaid_expense as any;
      return prepaid?.company_id === companyId;
    })
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0) || 0;

  // Calculate other general expenses (excluding prepaid-type)
  const otherExpenses = expensesResult.data
    ?.filter(e => e.payment_method !== 'prepaid')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;

  const total = custodyExpenses + payrollExpenses + rentExpenses + otherExpenses;

  return { custodyExpenses, payrollExpenses, rentExpenses, otherExpenses, total };
}

export function MonthlyExpensesCard() {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['monthly-expenses-dashboard', companyId, selectedFiscalYear?.id],
    queryFn: () => fetchMonthlyExpenses(companyId!, selectedFiscalYear?.id),
    enabled: !!companyId,
    refetchInterval: 60000, // Refresh every minute
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const currentMonthName = new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

  const expenseItems = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: 'مصاريف العهد',
        value: data.custodyExpenses,
        icon: Briefcase,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
      },
      {
        label: 'الرواتب والأجور',
        value: data.payrollExpenses,
        icon: Users,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
      },
      {
        label: 'الإيجارات',
        value: data.rentExpenses,
        icon: Home,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
      },
      {
        label: 'مصاريف أخرى',
        value: data.otherExpenses,
        icon: Receipt,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/10',
      },
    ].filter(item => item.value > 0 || expanded);
  }, [data, expanded]);

  const maxValue = useMemo(() => {
    if (!data) return 1;
    return Math.max(data.custodyExpenses, data.payrollExpenses, data.rentExpenses, data.otherExpenses, 1);
  }, [data]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-5 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-muted rounded w-32" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setExpanded(!expanded)}
    >
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold">المصروفات الشهرية</CardTitle>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{currentMonthName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] sm:text-xs font-mono">
              {formatCurrency(data.total)}
            </Badge>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Total Bar */}
        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {formatCurrency(data.total)}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              إجمالي المصروفات
            </span>
          </div>
          {/* Stacked bar showing proportions */}
          <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
            {data.total > 0 && (
              <>
                {data.custodyExpenses > 0 && (
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${(data.custodyExpenses / data.total) * 100}%` }}
                  />
                )}
                {data.payrollExpenses > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${(data.payrollExpenses / data.total) * 100}%` }}
                  />
                )}
                {data.rentExpenses > 0 && (
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${(data.rentExpenses / data.total) * 100}%` }}
                  />
                )}
                {data.otherExpenses > 0 && (
                  <div
                    className="h-full bg-rose-500 transition-all"
                    style={{ width: `${(data.otherExpenses / data.total) * 100}%` }}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Breakdown Items */}
        <div className={cn(
          "space-y-2 transition-all duration-300",
          expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}>
          <Separator className="my-2" />
          {expenseItems.map((item) => {
            const Icon = item.icon;
            const percentage = data.total > 0 ? ((item.value / data.total) * 100).toFixed(1) : '0';
            return (
              <div key={item.label} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.bgColor)}>
                  <Icon className={cn("w-4 h-4", item.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs sm:text-sm font-medium truncate">{item.label}</span>
                    <span className="text-xs sm:text-sm font-bold font-mono shrink-0 mr-2">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", item.bgColor.replace('/10', ''))}
                        style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 w-10 text-left">
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsed summary - show top 2 expense categories */}
        {!expanded && data.total > 0 && (
          <div className="flex items-center gap-3 mt-1 text-[10px] sm:text-xs text-muted-foreground">
            {[
              { label: 'عهد', value: data.custodyExpenses, dot: 'bg-blue-500' },
              { label: 'رواتب', value: data.payrollExpenses, dot: 'bg-emerald-500' },
              { label: 'إيجار', value: data.rentExpenses, dot: 'bg-amber-500' },
              { label: 'أخرى', value: data.otherExpenses, dot: 'bg-rose-500' },
            ]
              .filter(c => c.value > 0)
              .map((cat) => (
                <span key={cat.label} className="flex items-center gap-1">
                  <span className={cn("w-2 h-2 rounded-full", cat.dot)} />
                  {cat.label}
                </span>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
