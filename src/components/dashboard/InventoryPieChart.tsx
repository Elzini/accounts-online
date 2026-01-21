import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface InventoryPieChartProps {
  data: {
    available: number;
    sold: number;
    transferred: number;
  };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))'];

export function InventoryPieChart({ data }: InventoryPieChartProps) {
  const chartData = [
    { name: 'متاحة', value: data.available },
    { name: 'مباعة', value: data.sold },
    { name: 'محولة', value: data.transferred },
  ].filter(item => item.value > 0);

  const total = data.available + data.sold + data.transferred;

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        لا توجد بيانات
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
            formatter={(value: number) => [value, 'عدد']}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              direction: 'rtl'
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
