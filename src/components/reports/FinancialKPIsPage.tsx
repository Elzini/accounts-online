import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Target, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface KPIs {
  grossProfitMargin: number;
  netProfitMargin: number;
  operatingExpenseRatio: number;
  inventoryTurnover: number;
  avgDaysToSell: number;
  revenuePerEmployee: number;
  totalRevenue: number;
  totalCost: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  breakEvenRevenue: number;
  fixedCosts: number;
  variableCostRatio: number;
}

export function FinancialKPIsPage() {
  const { t, direction, language } = useLanguage();
  const companyId = useCompanyId();
  const { selectedFiscalYear } = useFiscalYear();

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['financial-kpis', companyId, selectedFiscalYear?.id],
    queryFn: async (): Promise<KPIs> => {
      if (!companyId) return defaultKPIs();

      const dateFilter = selectedFiscalYear
        ? { start: selectedFiscalYear.start_date, end: selectedFiscalYear.end_date }
        : null;

      const [salesRes, carsRes, expensesRes, employeesRes] = await Promise.all([
        supabase.from('sales').select('sale_price, profit, sale_date').eq('company_id', companyId),
        supabase.from('cars').select('purchase_price, purchase_date, status').eq('company_id', companyId),
        supabase.from('expenses').select('amount, expense_date').eq('company_id', companyId),
        supabase.from('employees').select('id').eq('company_id', companyId).eq('is_active', true),
      ]);

      const sales = (salesRes.data || []).filter((s: any) =>
        !dateFilter || (s.sale_date >= dateFilter.start && s.sale_date <= dateFilter.end)
      );
      const cars = (carsRes.data || []).filter((c: any) =>
        !dateFilter || (c.purchase_date >= dateFilter.start && c.purchase_date <= dateFilter.end)
      );
      const expenses = (expensesRes.data || []).filter((e: any) =>
        !dateFilter || (e.expense_date >= dateFilter.start && e.expense_date <= dateFilter.end)
      );

      const totalRevenue = sales.reduce((s: number, r: any) => s + (r.sale_price || 0), 0);
      const totalProfit = sales.reduce((s: number, r: any) => s + (r.profit || 0), 0);
      const totalCost = cars.filter((c: any) => c.status === 'sold').reduce((s: number, r: any) => s + (r.purchase_price || 0), 0);
      const totalExpenses = expenses.reduce((s: number, r: any) => s + (r.amount || 0), 0);
      const grossProfit = totalRevenue - totalCost;
      const netProfit = grossProfit - totalExpenses;

      const employeeCount = employeesRes.data?.length || 1;
      const availableCars = carsRes.data?.filter((c: any) => c.status === 'available').length || 0;
      const soldCars = sales.length;

      // Break-even: Fixed costs / (1 - variable cost ratio)
      const fixedCosts = totalExpenses * 0.6; // Estimate 60% fixed
      const variableCostRatio = totalRevenue > 0 ? totalCost / totalRevenue : 0;
      const breakEvenRevenue = variableCostRatio < 1 ? fixedCosts / (1 - variableCostRatio) : 0;

      // Inventory turnover
      const avgInventory = (availableCars + soldCars) / 2 || 1;
      const inventoryTurnover = soldCars / avgInventory;

      // Average days to sell (simplified)
      const avgDaysToSell = soldCars > 0 ? (dateFilter ? 365 / inventoryTurnover : 365 / (inventoryTurnover || 1)) : 0;

      return {
        grossProfitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
        netProfitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
        operatingExpenseRatio: totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0,
        inventoryTurnover,
        avgDaysToSell,
        revenuePerEmployee: totalRevenue / employeeCount,
        totalRevenue,
        totalCost,
        totalExpenses,
        grossProfit,
        netProfit,
        breakEvenRevenue,
        fixedCosts,
        variableCostRatio: variableCostRatio * 100,
      };
    },
    enabled: !!companyId,
  });

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const currency = language === 'ar' ? 'ر.س' : 'SAR';
  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const pct = (n: number) => n.toFixed(1) + '%';

  const k = kpis || defaultKPIs();

  return (
    <div className="space-y-6" dir={direction}>
      <div>
        <h1 className="text-2xl font-bold">{t.kpi_title}</h1>
        <p className="text-muted-foreground">{t.kpi_subtitle}</p>
      </div>

      <Tabs defaultValue="kpis">
        <TabsList>
          <TabsTrigger value="kpis" className="gap-2"><Activity className="w-4 h-4" /> {t.kpi_tab_indicators}</TabsTrigger>
          <TabsTrigger value="breakeven" className="gap-2"><Target className="w-4 h-4" /> {t.kpi_tab_breakeven}</TabsTrigger>
          <TabsTrigger value="ratios" className="gap-2"><PieChart className="w-4 h-4" /> {t.kpi_tab_ratios}</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={DollarSign} title={t.kpi_total_revenue} value={fmt(k.totalRevenue) + ' ' + currency} color="text-primary" />
            <KPICard icon={TrendingUp} title={t.kpi_gross_profit} value={fmt(k.grossProfit) + ' ' + currency} subtitle={`${t.kpi_margin} ${pct(k.grossProfitMargin)}`} color="text-green-600" />
            <KPICard icon={TrendingDown} title={t.kpi_net_profit} value={fmt(k.netProfit) + ' ' + currency} subtitle={`${t.kpi_margin} ${pct(k.netProfitMargin)}`} color={k.netProfit >= 0 ? 'text-green-600' : 'text-red-600'} />
            <KPICard icon={BarChart3} title={t.kpi_expense_ratio} value={pct(k.operatingExpenseRatio)} subtitle={fmt(k.totalExpenses) + ' ' + currency} color="text-orange-600" />
            <KPICard icon={Activity} title={t.kpi_inventory_turnover} value={k.inventoryTurnover.toFixed(1) + (language === 'ar' ? ' مرة' : ' times')} subtitle={`${t.kpi_avg_days_sell} ${k.avgDaysToSell.toFixed(0)}`} color="text-blue-600" />
            <KPICard icon={DollarSign} title={t.kpi_revenue_per_employee} value={fmt(k.revenuePerEmployee) + ' ' + currency} color="text-purple-600" />
            <KPICard icon={TrendingDown} title={t.kpi_cogs} value={fmt(k.totalCost) + ' ' + currency} subtitle={`${t.kpi_margin} ${pct(k.variableCostRatio)}`} color="text-red-500" />
            <KPICard icon={Target} title={t.kpi_breakeven_point} value={fmt(k.breakEvenRevenue) + ' ' + currency} subtitle={k.totalRevenue >= k.breakEvenRevenue ? '✅' : '⚠️'} color="text-amber-600" />
          </div>
        </TabsContent>

        <TabsContent value="breakeven" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" /> {t.kpi_breakeven_point}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">{t.kpi_fixed_costs}</span>
                  <span className="font-bold">{fmt(k.fixedCosts)} {currency}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">{t.kpi_variable_ratio}</span>
                  <span className="font-bold">{pct(k.variableCostRatio)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">{t.kpi_contribution_margin}</span>
                  <span className="font-bold">{pct(100 - k.variableCostRatio)}</span>
                </div>
                <div className="flex justify-between pt-2 text-lg">
                  <span className="font-bold">{t.kpi_breakeven_required}</span>
                  <span className="font-bold text-primary">{fmt(k.breakEvenRevenue)} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.kpi_actual_revenue}</span>
                  <span className={`font-bold ${k.totalRevenue >= k.breakEvenRevenue ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(k.totalRevenue)} {currency}
                  </span>
                </div>
                {k.totalRevenue >= k.breakEvenRevenue ? (
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-green-700 dark:text-green-300 text-sm">
                    ✅ {t.kpi_breakeven_passed} {fmt(k.totalRevenue - k.breakEvenRevenue)} {currency}
                  </div>
                ) : (
                  <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    ⚠️ {t.kpi_breakeven_missing} {fmt(k.breakEvenRevenue - k.totalRevenue)} {currency}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.kpi_performance_summary}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ProgressBar label={t.kpi_gross_profit} value={k.grossProfitMargin} max={100} />
                <ProgressBar label={t.kpi_net_profit} value={k.netProfitMargin} max={100} />
                <ProgressBar label={t.kpi_expense_ratio} value={k.operatingExpenseRatio} max={100} negative />
                <ProgressBar label={t.kpi_breakeven_point} value={k.breakEvenRevenue > 0 ? Math.min((k.totalRevenue / k.breakEvenRevenue) * 100, 100) : 100} max={100} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ratios" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RatioCard title={t.kpi_profitability_ratios} items={[
              { label: t.kpi_gross_profit, value: pct(k.grossProfitMargin) },
              { label: t.kpi_net_profit, value: pct(k.netProfitMargin) },
              { label: 'ROI', value: pct(k.totalRevenue > 0 ? (k.netProfit / k.totalRevenue) * 100 : 0) },
            ]} />
            <RatioCard title={t.kpi_efficiency_ratios} items={[
              { label: t.kpi_inventory_turnover, value: k.inventoryTurnover.toFixed(1) },
              { label: t.kpi_avg_days_sell, value: k.avgDaysToSell.toFixed(0) },
              { label: t.kpi_revenue_per_employee, value: fmt(k.revenuePerEmployee) + ' ' + currency },
            ]} />
            <RatioCard title={t.kpi_cost_ratios} items={[
              { label: t.kpi_variable_ratio, value: pct(k.variableCostRatio) },
              { label: t.kpi_expense_ratio, value: pct(k.operatingExpenseRatio) },
              { label: t.kpi_contribution_margin, value: pct(100 - k.variableCostRatio) },
            ]} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function defaultKPIs(): KPIs {
  return { grossProfitMargin: 0, netProfitMargin: 0, operatingExpenseRatio: 0, inventoryTurnover: 0, avgDaysToSell: 0, revenuePerEmployee: 0, totalRevenue: 0, totalCost: 0, totalExpenses: 0, grossProfit: 0, netProfit: 0, breakEvenRevenue: 0, fixedCosts: 0, variableCostRatio: 0 };
}

function KPICard({ icon: Icon, title, value, subtitle, color }: { icon: any; title: string; value: string; subtitle?: string; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Icon className={`w-8 h-8 ${color || 'text-primary'}`} />
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ label, value, max, negative }: { label: string; value: number; max: number; negative?: boolean }) {
  const pct = Math.min(Math.max(value, 0), max);
  const color = negative ? (pct > 50 ? 'bg-red-500' : 'bg-green-500') : (pct > 50 ? 'bg-green-500' : 'bg-yellow-500');
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(pct / max) * 100}%` }} />
      </div>
    </div>
  );
}

function RatioCard({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-muted-foreground text-sm">{item.label}</span>
            <span className="font-bold">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
