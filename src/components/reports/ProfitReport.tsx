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
import { useIndustryLabels } from '@/hooks/useIndustryLabels';
import { useLanguage } from '@/contexts/LanguageContext';

export function ProfitReport() {
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { filterByFiscalYear } = useFiscalYearFilter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { printReport } = usePrintReport();
  const labels = useIndustryLabels();
  const { t, language } = useLanguage();

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const formatCurrency = (value: number) => new Intl.NumberFormat(locale).format(value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(locale);

  const filteredSales = useMemo(() => {
    let result = filterByFiscalYear(sales, 'sale_date');
    return result.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      if (startDate && saleDate < new Date(startDate)) return false;
      if (endDate && saleDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [sales, startDate, endDate, filterByFiscalYear]);

  const salesWithCarExpenses = useMemo(() => {
    return filteredSales.map(sale => {
      const carExpenses = expenses.filter(exp => exp.car_id === sale.car_id).reduce((sum, exp) => sum + Number(exp.amount), 0);
      const netProfit = Number(sale.profit) - carExpenses;
      return { ...sale, carExpenses, netProfit };
    });
  }, [filteredSales, expenses]);

  const filteredGeneralExpenses = useMemo(() => {
    const fiscalYearExpenses = filterByFiscalYear(expenses, 'expense_date');
    return fiscalYearExpenses.filter(exp => {
      if (exp.car_id) return false;
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

  const handlePrint = () => {
    printReport({
      title: t.rpt_profit_title,
      subtitle: t.rpt_profit_subtitle,
      columns: [
        { header: t.rpt_profit_col_date, key: 'date' },
        { header: labels.itemName, key: 'car' },
        { header: t.rpt_profit_col_sale_price, key: 'sale_price' },
        { header: t.rpt_profit_col_gross, key: 'gross_profit' },
        { header: `${t.rpt_profit_item_expenses} ${labels.itemName}`, key: 'car_expenses' },
        { header: t.rpt_profit_col_net, key: 'net_profit' },
      ],
      data: salesWithCarExpenses.map(sale => ({
        date: formatDate(sale.sale_date),
        car: sale.car?.name || '-',
        sale_price: `${formatCurrency(Number(sale.sale_price))} ${t.rpt_currency}`,
        gross_profit: `${formatCurrency(Number(sale.profit))} ${t.rpt_currency}`,
        car_expenses: `${formatCurrency(sale.carExpenses)} ${t.rpt_currency}`,
        net_profit: `${formatCurrency(sale.netProfit)} ${t.rpt_currency}`,
      })),
      summaryCards: [
        { label: t.rpt_profit_net_final, value: `${formatCurrency(finalNetProfit)} ${t.rpt_currency}` },
        { label: t.rpt_profit_total_sales, value: `${formatCurrency(totalSales)} ${t.rpt_currency}` },
        { label: `${t.rpt_profit_item_expenses} ${labels.itemsName}`, value: `${formatCurrency(totalCarExpenses)} ${t.rpt_currency}` },
        { label: t.rpt_profit_general_expenses, value: `${formatCurrency(totalGeneralExpenses)} ${t.rpt_currency}` },
      ],
    });
  };

  if (salesLoading || expensesLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.rpt_profit_title}</h1>
          <p className="text-muted-foreground">{t.rpt_profit_subtitle} ({labels.itemsName})</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
          <Button onClick={handlePrint} className="gap-2"><Printer className="w-4 h-4" />{t.rpt_print_report}</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-2xl p-6 card-shadow border-2 border-primary">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center"><TrendingUp className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-muted-foreground">{t.rpt_profit_net_final}</p><p className={`text-2xl font-bold ${finalNetProfit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(finalNetProfit)} {t.rpt_currency}</p></div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center"><DollarSign className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-muted-foreground">{t.rpt_profit_total_sales}</p><p className="text-2xl font-bold">{formatCurrency(totalSales)} {t.rpt_currency}</p></div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-muted-foreground">{t.rpt_profit_gross}</p><p className="text-2xl font-bold text-success">{formatCurrency(totalGrossProfit)} {t.rpt_currency}</p></div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center"><Car className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-muted-foreground">{t.rpt_profit_item_expenses} {labels.itemsName}</p><p className="text-2xl font-bold text-orange-600">{formatCurrency(totalCarExpenses)} {t.rpt_currency}</p></div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive flex items-center justify-center"><Receipt className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-muted-foreground">{t.rpt_profit_general_expenses}</p><p className="text-2xl font-bold text-destructive">{formatCurrency(totalGeneralExpenses)} {t.rpt_currency}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 card-shadow">
        <h3 className="font-bold mb-4">{t.rpt_profit_summary}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b"><span>{t.rpt_profit_gross_label}</span><span className="font-bold text-success">+ {formatCurrency(totalGrossProfit)} {t.rpt_currency}</span></div>
            <div className="flex justify-between py-2 border-b"><span>{t.rpt_profit_item_expenses} {labels.itemsName}</span><span className="font-bold text-orange-600">- {formatCurrency(totalCarExpenses)} {t.rpt_currency}</span></div>
            <div className="flex justify-between py-2 border-b"><span>{t.rpt_profit_general_expenses}</span><span className="font-bold text-destructive">- {formatCurrency(totalGeneralExpenses)} {t.rpt_currency}</span></div>
            <div className="flex justify-between py-2 bg-muted rounded-lg px-3"><span className="font-bold">{t.rpt_profit_net_final}</span><span className={`font-bold text-lg ${finalNetProfit >= 0 ? 'text-success' : 'text-destructive'}`}>= {formatCurrency(finalNetProfit)} {t.rpt_currency}</span></div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">{t.rpt_profit_formula_title}</h4>
            <p className="text-sm text-muted-foreground mb-2"><strong>{t.rpt_profit_formula_desc}</strong></p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>{t.rpt_profit_item_expenses} {labels.itemsName}:</strong> {t.rpt_profit_item_exp_desc}</li>
              <li>• <strong>{t.rpt_profit_general_expenses}:</strong> {t.rpt_profit_general_exp_desc}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-bold">{t.rpt_profit_details} - {labels.itemName}</h3></div>
        {salesWithCarExpenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{t.rpt_profit_no_sales}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">{t.rpt_profit_col_date}</TableHead>
                <TableHead className="text-right font-bold">{labels.itemName}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_profit_col_sale_price}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_profit_col_gross}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_profit_item_expenses} {labels.itemName}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_profit_col_net}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesWithCarExpenses.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.sale_date)}</TableCell>
                  <TableCell className="font-semibold">{sale.car?.name || '-'}</TableCell>
                  <TableCell>{formatCurrency(Number(sale.sale_price))} {t.rpt_currency}</TableCell>
                  <TableCell className="text-success">{formatCurrency(Number(sale.profit))} {t.rpt_currency}</TableCell>
                  <TableCell className="text-orange-600">{sale.carExpenses > 0 ? `${formatCurrency(sale.carExpenses)} ${t.rpt_currency}` : '-'}</TableCell>
                  <TableCell className={`font-bold ${sale.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(sale.netProfit)} {t.rpt_currency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {filteredGeneralExpenses.length > 0 && (
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          <div className="p-4 border-b"><h3 className="font-bold">{t.rpt_profit_general_table}</h3></div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">{t.rpt_profit_col_date}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_profit_col_desc}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_profit_col_category}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_profit_col_amount}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGeneralExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.expense_date)}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{expense.category?.name || t.rpt_profit_no_category}</TableCell>
                  <TableCell className="font-bold text-destructive">{formatCurrency(Number(expense.amount))} {t.rpt_currency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
