import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface InventoryPieChartProps {
  data: {
    available: number;
    sold: number;
    transferred: number;
  };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))'];

export function InventoryPieChart({ data }: InventoryPieChartProps) {
  const { t, language } = useLanguage();
  const chartData = [
    { name: t.chart_available, value: data.available },
    { name: t.chart_sold, value: data.sold },
    { name: t.chart_transferred, value: data.transferred },
  ].filter(item => item.value > 0);

  const total = data.available + data.sold + data.transferred;

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        {t.chart_no_data}
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [value, t.chart_count]}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
