import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExpenseDistributionChartProps {
  custodyExpenses: number;
  payrollExpenses: number;
  rentExpenses: number;
  otherExpenses: number;
}

const EXPENSE_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(160, 84%, 39%)',
  'hsl(38, 92%, 50%)',
  'hsl(350, 89%, 60%)',
];

export function ExpenseDistributionChart({
  custodyExpenses, payrollExpenses, rentExpenses, otherExpenses,
}: ExpenseDistributionChartProps) {
  const { t, language } = useLanguage();
  const data = [
    { name: t.chart_custody_expenses, value: custodyExpenses },
    { name: t.chart_payroll, value: payrollExpenses },
    { name: t.chart_rent, value: rentExpenses },
    { name: t.chart_other_expenses, value: otherExpenses },
  ].filter((item) => item.value > 0);

  const total = custodyExpenses + payrollExpenses + rentExpenses + otherExpenses;
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(value);
  };

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
        {t.chart_no_expenses_month}
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), t.chart_the_amount]}
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', direction: language === 'ar' ? 'rtl' : 'ltr' }}
          />
          <Legend verticalAlign="bottom" height={30} formatter={(value) => <span className="text-[10px] sm:text-xs">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
