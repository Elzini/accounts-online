import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';

interface MonthlyData { month: string; revenue: number; cost: number; profit: number; }
interface SalesPurchasesBarChartProps { data: MonthlyData[]; }
type ViewMode = 'comparison' | 'profit';

export function SalesPurchasesBarChart({ data }: SalesPurchasesBarChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('comparison');
  const { t, language } = useLanguage();
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}${language === 'ar' ? 'م' : 'M'}`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}${language === 'ar' ? 'ك' : 'K'}`;
    return value.toString();
  };

  const formatTooltip = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(value);
  const nameMap: Record<string, string> = { revenue: t.chart_sales, cost: t.chart_purchases, profit: t.chart_profit };

  if (data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-muted-foreground">{t.chart_no_data}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="h-7">
            <TabsTrigger value="comparison" className="text-[10px] sm:text-xs px-2 h-6">{t.chart_sales_vs_purchases}</TabsTrigger>
            <TabsTrigger value="profit" className="text-[10px] sm:text-xs px-2 h-6">{t.chart_monthly_profit}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
            <YAxis tickFormatter={formatCurrency} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
            <Tooltip formatter={(value: number, name: string) => [formatTooltip(value), nameMap[name] || name]}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', direction: language === 'ar' ? 'rtl' : 'ltr' }}
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
            <Legend verticalAlign="top" height={30} formatter={(value) => nameMap[value] || value} />
            {viewMode === 'comparison' ? (
              <>
                <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="cost" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={20} />
              </>
            ) : (
              <Bar dataKey="profit" radius={[4, 4, 0, 0]} barSize={28}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
