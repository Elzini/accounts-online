import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MonthlyData {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

interface SalesPurchasesBarChartProps {
  data: MonthlyData[];
}

type ViewMode = 'comparison' | 'profit';

export function SalesPurchasesBarChart({ data }: SalesPurchasesBarChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('comparison');

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}م`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}ك`;
    return value.toString();
  };

  const formatTooltip = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-muted-foreground">
        لا توجد بيانات
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="h-7">
            <TabsTrigger value="comparison" className="text-[10px] sm:text-xs px-2 h-6">
              مبيعات vs مشتريات
            </TabsTrigger>
            <TabsTrigger value="profit" className="text-[10px] sm:text-xs px-2 h-6">
              الأرباح الشهرية
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatTooltip(value),
                name === 'revenue' ? 'المبيعات' : name === 'cost' ? 'المشتريات' : 'الأرباح'
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                direction: 'rtl',
              }}
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
            />
            <Legend
              verticalAlign="top"
              height={30}
              formatter={(value) => {
                if (value === 'revenue') return 'المبيعات';
                if (value === 'cost') return 'المشتريات';
                if (value === 'profit') return 'الأرباح';
                return value;
              }}
            />
            {viewMode === 'comparison' ? (
              <>
                <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="cost" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={20} />
              </>
            ) : (
              <Bar dataKey="profit" radius={[4, 4, 0, 0]} barSize={28}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.profit >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
