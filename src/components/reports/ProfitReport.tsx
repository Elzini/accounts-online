import { TrendingUp, DollarSign, ShoppingCart, Percent } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sale } from '@/types';

interface ProfitReportProps {
  sales: Sale[];
}

export function ProfitReport({ sales }: ProfitReportProps) {
  const totalSales = sales.reduce((sum, sale) => sum + sale.salePrice, 0);
  const totalPurchases = sales.reduce((sum, sale) => sum + sale.purchasePrice, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalCommissions = sales.reduce((sum, sale) => sum + sale.commission, 0);
  const totalExpenses = sales.reduce((sum, sale) => sum + sale.otherExpenses, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA').format(new Date(date));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">تقرير الأرباح</h1>
        <p className="text-muted-foreground mt-1">تحليل شامل للأرباح والمبيعات</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الأرباح</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalProfit)} ريال</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSales)} ريال</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">عدد المبيعات</p>
              <p className="text-2xl font-bold text-foreground">{sales.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-danger flex items-center justify-center">
              <Percent className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">العمولات</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalCommissions)} ريال</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card rounded-2xl p-6 card-shadow">
        <h2 className="text-lg font-bold mb-4">ملخص الحسابات</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/50">
            <p className="text-sm text-muted-foreground">إجمالي تكلفة الشراء</p>
            <p className="text-xl font-bold">{formatCurrency(totalPurchases)} ريال</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/50">
            <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
            <p className="text-xl font-bold">{formatCurrency(totalSales)} ريال</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/50">
            <p className="text-sm text-muted-foreground">المصروفات الأخرى</p>
            <p className="text-xl font-bold">{formatCurrency(totalExpenses)} ريال</p>
          </div>
          <div className="p-4 rounded-xl bg-success/10">
            <p className="text-sm text-muted-foreground">صافي الربح</p>
            <p className="text-xl font-bold text-success">{formatCurrency(totalProfit)} ريال</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold">تفاصيل الأرباح</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">السيارة</TableHead>
              <TableHead className="text-right font-bold">سعر الشراء</TableHead>
              <TableHead className="text-right font-bold">سعر البيع</TableHead>
              <TableHead className="text-right font-bold">العمولة</TableHead>
              <TableHead className="text-right font-bold">المصروفات</TableHead>
              <TableHead className="text-right font-bold">الربح</TableHead>
              <TableHead className="text-right font-bold">التاريخ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-semibold">{sale.carName}</TableCell>
                <TableCell>{formatCurrency(sale.purchasePrice)} ريال</TableCell>
                <TableCell>{formatCurrency(sale.salePrice)} ريال</TableCell>
                <TableCell>{formatCurrency(sale.commission)} ريال</TableCell>
                <TableCell>{formatCurrency(sale.otherExpenses)} ريال</TableCell>
                <TableCell className={`font-bold ${sale.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(sale.profit)} ريال
                </TableCell>
                <TableCell>{formatDate(sale.saleDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
