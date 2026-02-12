import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface RevenueData { month: string; revenue: number; cost: number; profit: number; }
interface RevenueAreaChartProps { data: RevenueData[]; }

export function RevenueAreaChart({ data }: RevenueAreaChartProps) {
  const { t, language } = useLanguage();
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}${language === 'ar' ? 'م' : 'M'}`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}${language === 'ar' ? 'ك' : 'K'}`;
    return value.toString();
  };

  const formatTooltip = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(value);

  const nameMap: Record<string, string> = { revenue: t.chart_revenue, profit: t.chart_profit, cost: t.chart_cost };

  if (data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-muted-foreground">{t.chart_no_data}</div>;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
          <YAxis tickFormatter={formatCurrency} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
          <Tooltip formatter={(value: number, name: string) => [formatTooltip(value), nameMap[name] || name]}
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', direction: language === 'ar' ? 'rtl' : 'ltr' }} />
          <Legend verticalAlign="top" height={36} formatter={(value) => nameMap[value] || value} />
          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
          <Area type="monotone" dataKey="profit" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
