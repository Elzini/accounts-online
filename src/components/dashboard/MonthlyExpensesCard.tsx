import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wallet, Users, Home, Briefcase, Receipt, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFiscalYearBounds } from '@/hooks/useFiscalYearBounds';
import { getDashboardDateWindow } from '@/lib/dashboardDateWindow';
import { useMonthlyExpenses } from '@/hooks/modules/useModuleServices';

export function MonthlyExpensesCard() {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const fiscalBounds = useFiscalYearBounds();
  const { t, language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const dashboardWindow = useMemo(
    () => getDashboardDateWindow(fiscalBounds ? { start: fiscalBounds.start, end: fiscalBounds.end } : null),
    [fiscalBounds?.fiscalYearId, fiscalBounds?.startISO, fiscalBounds?.endISO]
  );

  const { data, isLoading } = useMonthlyExpenses(
    companyId,
    fiscalBounds ? { start: fiscalBounds.start, end: fiscalBounds.end } : null,
    selectedFiscalYear?.id,
    fiscalBounds?.startISO,
    fiscalBounds?.endISO,
  );

  const formatCurrency = (value: number) => `${Math.round(value)} ر.س`;

  const currentMonthName = dashboardWindow.referenceDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });

  const expenseItems = useMemo(() => {
    if (!data) return [];
    return [
      { label: t.custody_expenses, value: data.custodyExpenses, icon: Briefcase, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
      { label: t.payroll_and_salaries, value: data.payrollExpenses, icon: Users, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
      { label: t.rent_label, value: data.rentExpenses, icon: Home, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
      { label: t.other_expenses, value: data.otherExpenses, icon: Receipt, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
    ].filter(item => item.value > 0 || expanded);
  }, [data, expanded]);

  const maxValue = useMemo(() => {
    if (!data) return 1;
    return Math.max(data.custodyExpenses, data.payrollExpenses, data.rentExpenses, data.otherExpenses, 1);
  }, [data]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3"><div className="h-5 bg-muted rounded w-40" /></CardHeader>
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
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setExpanded(!expanded)}>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold">{t.monthly_expenses}</CardTitle>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{currentMonthName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] sm:text-xs font-mono">{formatCurrency(data.total)}</Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xl sm:text-2xl font-bold text-foreground">{formatCurrency(data.total)}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="w-3 h-3" />{t.total_expenses_label}</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
            {data.total > 0 && (<>
              {data.custodyExpenses > 0 && <div className="h-full bg-blue-500 transition-all" style={{ width: `${(data.custodyExpenses / data.total) * 100}%` }} />}
              {data.payrollExpenses > 0 && <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(data.payrollExpenses / data.total) * 100}%` }} />}
              {data.rentExpenses > 0 && <div className="h-full bg-amber-500 transition-all" style={{ width: `${(data.rentExpenses / data.total) * 100}%` }} />}
              {data.otherExpenses > 0 && <div className="h-full bg-rose-500 transition-all" style={{ width: `${(data.otherExpenses / data.total) * 100}%` }} />}
            </>)}
          </div>
        </div>
        <div className={cn("space-y-2 transition-all duration-300", expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 overflow-hidden")}>
          <Separator className="my-2" />
          {expenseItems.map((item) => {
            const Icon = item.icon;
            const percentage = data.total > 0 ? ((item.value / data.total) * 100).toFixed(1) : '0';
            return (
              <div key={item.label} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.bgColor)}><Icon className={cn("w-4 h-4", item.color)} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs sm:text-sm font-medium truncate">{item.label}</span>
                    <span className="text-xs sm:text-sm font-bold font-mono shrink-0 mr-2">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500", item.bgColor.replace('/10', ''))} style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 w-10 text-left">{percentage}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {!expanded && data.total > 0 && (
          <div className="flex items-center gap-3 mt-1 text-[10px] sm:text-xs text-muted-foreground">
            {[
              { label: t.custody_short, value: data.custodyExpenses, dot: 'bg-blue-500' },
              { label: t.payroll_short, value: data.payrollExpenses, dot: 'bg-emerald-500' },
              { label: t.rent_short, value: data.rentExpenses, dot: 'bg-amber-500' },
              { label: t.other_short, value: data.otherExpenses, dot: 'bg-rose-500' },
            ].filter(c => c.value > 0).map((cat) => (
              <span key={cat.label} className="flex items-center gap-1"><span className={cn("w-2 h-2 rounded-full", cat.dot)} />{cat.label}</span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
