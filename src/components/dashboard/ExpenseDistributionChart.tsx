import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExpenseDistributionChartProps {
  custodyExpenses: number;
  payrollExpenses: number;
  rentExpenses: number;
  otherExpenses: number;
}

const EXPENSE_COLORS = [
  'hsl(217, 91%, 60%)',  // blue
  'hsl(160, 84%, 39%)',  // emerald
  'hsl(38, 92%, 50%)',   // amber
  'hsl(350, 89%, 60%)',  // rose
];

export function ExpenseDistributionChart({
  custodyExpenses,
  payrollExpenses,
  rentExpenses,
  otherExpenses,
}: ExpenseDistributionChartProps) {
  const data = [
    { name: 'مصاريف العهد', value: custodyExpenses },
    { name: 'الرواتب والأجور', value: payrollExpenses },
    { name: 'الإيجارات', value: rentExpenses },
    { name: 'مصاريف أخرى', value: otherExpenses },
  ].filter((item) => item.value > 0);

  const total = custodyExpenses + payrollExpenses + rentExpenses + otherExpenses;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
        لا توجد مصروفات هذا الشهر
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={4}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'المبلغ']}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              direction: 'rtl',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={30}
            formatter={(value) => <span className="text-[10px] sm:text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
