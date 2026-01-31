import { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Printer, FileSpreadsheet, Receipt, Car } from 'lucide-react';
import { useSales } from '@/hooks/useDatabase';
import { useExpenses } from '@/hooks/useExpenses';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';

export function ProfitReport() {
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { filterByFiscalYear } = useFiscalYearFilter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { printReport } = usePrintReport();

  const filteredSales = useMemo(() => {
    // First filter by fiscal year
    let result = filterByFiscalYear(sales, 'sale_date');
    
    // Then apply date range filter within fiscal year
    return result.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      if (startDate && saleDate < new Date(startDate)) return false;
      if (endDate && saleDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [sales, startDate, endDate, filterByFiscalYear]);

  // Calculate car expenses for each sale
  const salesWithCarExpenses = useMemo(() => {
    return filteredSales.map(sale => {
      const carExpenses = expenses
        .filter(exp => exp.car_id === sale.car_id)
        .reduce((sum, exp) => sum + Number(exp.amount), 0);
      
      const netProfit = Number(sale.profit) - carExpenses;
      
      return {
        ...sale,
        carExpenses,
        netProfit
      };
    });
  }, [filteredSales, expenses]);

  // Filter general expenses within fiscal year and date range
  const filteredGeneralExpenses = useMemo(() => {
    // First filter expenses by fiscal year
    const fiscalYearExpenses = filterByFiscalYear(expenses, 'expense_date');
    
    return fiscalYearExpenses.filter(exp => {
      if (exp.car_id) return false; // Exclude car-linked expenses
      const expDate = new Date(exp.expense_date);
      if (startDate && expDate < new Date(startDate)) return false;
      if (endDate && expDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [expenses, startDate, endDate, filterByFiscalYear]);

  const totalGrossProfit = salesWithCarExpenses.reduce((sum, sale) => sum + Number(sale.profit), 0);
  const totalCarExpenses = salesWithCarExpenses.reduce((sum, sale) => sum + sale.carExpenses, 0);
  const totalNetProfitFromSales = salesWithCarExpenses.reduce((sum, sale) => sum + sale.netProfit, 0);
  const totalGeneralExpenses = filteredGeneralExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const finalNetProfit = totalNetProfitFromSales - totalGeneralExpenses;
  const totalSales = salesWithCarExpenses.reduce((sum, sale) => sum + Number(sale.sale_price), 0);
  const totalCommissions = salesWithCarExpenses.reduce((sum, sale) => sum + Number(sale.commission || 0), 0);
  const totalOtherExpenses = salesWithCarExpenses.reduce((sum, sale) => sum + Number(sale.other_expenses || 0), 0);
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('ar-SA').format(value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ar-SA');

  const handlePrint = () => {
    printReport({
      title: 'تقرير الأرباح',
      subtitle: 'تفاصيل الأرباح والمصاريف',
      columns: [
        { header: 'التاريخ', key: 'date' },
        { header: 'السيارة', key: 'car' },
        { header: 'سعر البيع', key: 'sale_price' },
        { header: 'الربح الإجمالي', key: 'gross_profit' },
        { header: 'مصروفات السيارة', key: 'car_expenses' },
        { header: 'صافي الربح', key: 'net_profit' },
      ],
      data: salesWithCarExpenses.map(sale => ({
        date: formatDate(sale.sale_date),
        car: sale.car?.name || '-',
        sale_price: `${formatCurrency(Number(sale.sale_price))} ريال`,
        gross_profit: `${formatCurrency(Number(sale.profit))} ريال`,
        car_expenses: `${formatCurrency(sale.carExpenses)} ريال`,
        net_profit: `${formatCurrency(sale.netProfit)} ريال`,
      })),
      summaryCards: [
        { label: 'صافي الربح النهائي', value: `${formatCurrency(finalNetProfit)} ريال` },
        { label: 'إجمالي المبيعات', value: `${formatCurrency(totalSales)} ريال` },
        { label: 'مصروفات السيارات', value: `${formatCurrency(totalCarExpenses)} ريال` },
        { label: 'المصروفات العامة', value: `${formatCurrency(totalGeneralExpenses)} ريال` },
      ],
    });
  };

  if (salesLoading || expensesLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تقرير الأرباح</h1>
          <p className="text-muted-foreground">تفاصيل الأرباح والمصاريف (شامل مصروفات السيارات)</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            طباعة التقرير
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-2xl p-6 card-shadow border-2 border-primary">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">صافي الربح النهائي</p>
              <p className={`text-2xl font-bold ${finalNetProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(finalNetProfit)} ريال
              </p>
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
              <p className="text-2xl font-bold">{formatCurrency(totalSales)} ريال</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الربح الإجمالي</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalGrossProfit)} ريال</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مصروفات السيارات</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalCarExpenses)} ريال</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المصروفات العامة</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalGeneralExpenses)} ريال</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Breakdown */}
      <div className="bg-card rounded-2xl p-6 card-shadow">
        <h3 className="font-bold mb-4">ملخص معادلة الربح</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span>الربح الإجمالي (سعر البيع - سعر الشراء)</span>
              <span className="font-bold text-success">+ {formatCurrency(totalGrossProfit)} ريال</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>مصروفات السيارات (إصلاح، تجهيز، إلخ)</span>
              <span className="font-bold text-orange-600">- {formatCurrency(totalCarExpenses)} ريال</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>المصروفات العامة (إيجار، رواتب، إلخ)</span>
              <span className="font-bold text-destructive">- {formatCurrency(totalGeneralExpenses)} ريال</span>
            </div>
            <div className="flex justify-between py-2 bg-muted rounded-lg px-3">
              <span className="font-bold">صافي الربح النهائي</span>
              <span className={`font-bold text-lg ${finalNetProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                = {formatCurrency(finalNetProfit)} ريال
              </span>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">شرح المعادلة:</h4>
            <p className="text-sm text-muted-foreground mb-2">
              <strong>صافي الربح</strong> = الربح الإجمالي - مصروفات السيارات - المصروفات العامة
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>مصروفات السيارات:</strong> المصروفات المرتبطة بسيارة معينة (إصلاح، صيانة، تجهيز)</li>
              <li>• <strong>المصروفات العامة:</strong> مصروفات الشركة غير المرتبطة بسيارة (إيجار، كهرباء، رواتب)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold">تفاصيل الأرباح لكل سيارة</h3>
        </div>
        {salesWithCarExpenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد مبيعات في هذه الفترة
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">التاريخ</TableHead>
                <TableHead className="text-right font-bold">السيارة</TableHead>
                <TableHead className="text-right font-bold">سعر البيع</TableHead>
                <TableHead className="text-right font-bold">الربح الإجمالي</TableHead>
                <TableHead className="text-right font-bold">مصروفات السيارة</TableHead>
                <TableHead className="text-right font-bold">صافي الربح</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesWithCarExpenses.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.sale_date)}</TableCell>
                  <TableCell className="font-semibold">{sale.car?.name || '-'}</TableCell>
                  <TableCell>{formatCurrency(Number(sale.sale_price))} ريال</TableCell>
                  <TableCell className="text-success">{formatCurrency(Number(sale.profit))} ريال</TableCell>
                  <TableCell className="text-orange-600">
                    {sale.carExpenses > 0 ? `${formatCurrency(sale.carExpenses)} ريال` : '-'}
                  </TableCell>
                  <TableCell className={`font-bold ${sale.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(sale.netProfit)} ريال
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* General Expenses Table */}
      {filteredGeneralExpenses.length > 0 && (
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold">المصروفات العامة (غير المرتبطة بسيارات)</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">التاريخ</TableHead>
                <TableHead className="text-right font-bold">الوصف</TableHead>
                <TableHead className="text-right font-bold">الفئة</TableHead>
                <TableHead className="text-right font-bold">المبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGeneralExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.expense_date)}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{expense.category?.name || 'بدون فئة'}</TableCell>
                  <TableCell className="font-bold text-destructive">
                    {formatCurrency(Number(expense.amount))} ريال
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}