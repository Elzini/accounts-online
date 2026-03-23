import { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Printer, FileSpreadsheet, Receipt, Car, Building2 } from 'lucide-react';
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
import { useNumberFormat } from '@/hooks/useNumberFormat';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';

export function ProfitReport() {
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { filterByFiscalYear } = useFiscalYearFilter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  const labels = useIndustryLabels();
  const { t, language } = useLanguage();
  const { companyId, company } = useCompany();
  const isCarDealership = useIndustryFeatures().hasCarInventory;

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const { decimals } = useNumberFormat();
  const formatCurrency = (value: number) => decimals === 0 ? String(Math.round(value)) : value.toFixed(decimals);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(locale);

  // Fetch invoices for non-car companies
  const { data: saleInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['sale-invoices-profit', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*, customer:customers(name)')
        .eq('company_id', companyId!)
        .eq('invoice_type', 'sales')
        .order('invoice_date', { ascending: false });
      return data || [];
    },
    enabled: !!companyId && !isCarDealership,
  });

  // === Car Dealership Logic ===
  const filteredSales = useMemo(() => {
    if (!isCarDealership) return [];
    let result = filterByFiscalYear(sales, 'sale_date');
    return result.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      if (startDate && saleDate < new Date(startDate)) return false;
      if (endDate && saleDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [sales, startDate, endDate, filterByFiscalYear, isCarDealership]);

  const salesWithCarExpenses = useMemo(() => {
    if (!isCarDealership) return [];
    return filteredSales.map(sale => {
      const carExpenses = expenses.filter(exp => exp.car_id === sale.car_id).reduce((sum, exp) => sum + Number(exp.amount), 0);
      const netProfit = Number(sale.profit) - carExpenses;
      return { ...sale, carExpenses, netProfit };
    });
  }, [filteredSales, expenses, isCarDealership]);

  const filteredGeneralExpenses = useMemo(() => {
    const fiscalYearExpenses = filterByFiscalYear(expenses, 'expense_date');
    return fiscalYearExpenses.filter(exp => {
      if (isCarDealership && exp.car_id) return false;
      const expDate = new Date(exp.expense_date);
      if (startDate && expDate < new Date(startDate)) return false;
      if (endDate && expDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [expenses, startDate, endDate, filterByFiscalYear, isCarDealership]);

  // === Non-Car (Invoice-based) Logic ===
  const filteredInvoices = useMemo(() => {
    if (isCarDealership) return [];
    let result = filterByFiscalYear(saleInvoices, 'invoice_date');
    return result.filter((inv: any) => {
      const invDate = new Date(inv.invoice_date);
      if (startDate && invDate < new Date(startDate)) return false;
      if (endDate && invDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [saleInvoices, startDate, endDate, filterByFiscalYear, isCarDealership]);

  // Car dealership calculations
  const totalGrossProfit = salesWithCarExpenses.reduce((sum, sale) => sum + Number(sale.profit), 0);
  const totalCarExpenses = salesWithCarExpenses.reduce((sum, sale) => sum + sale.carExpenses, 0);
  const totalNetProfitFromSales = salesWithCarExpenses.reduce((sum, sale) => sum + sale.netProfit, 0);
  const totalGeneralExpenses = filteredGeneralExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const carFinalNetProfit = totalNetProfitFromSales - totalGeneralExpenses;
  
  const totalSales = isCarDealership 
    ? salesWithCarExpenses.reduce((sum, sale) => {
        const salePrice = Number(sale.sale_price);
        const carCondition = sale.car?.car_condition;
        const purchasePrice = Number(sale.car?.purchase_price) || 0;
        if (carCondition === 'used' && purchasePrice > 0) {
          const baseSalePrice = (salePrice + 0.15 * purchasePrice) / 1.15;
          return sum + baseSalePrice;
        }
        return sum + salePrice;
      }, 0)
    : 0;

  // Non-car calculations
  const invoiceTotalRevenue = filteredInvoices.reduce((sum: number, inv: any) => sum + Number(inv.subtotal || 0), 0);
  const invoiceTotalTax = filteredInvoices.reduce((sum: number, inv: any) => sum + Number(inv.tax_amount || 0), 0);
  const invoiceTotalWithTax = filteredInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
  const invoiceNetProfit = invoiceTotalRevenue - totalGeneralExpenses;

  const finalNetProfit = isCarDealership ? carFinalNetProfit : invoiceNetProfit;

  const handlePrint = () => {
    if (isCarDealership) {
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
    } else {
      printReport({
        title: 'تقرير الأرباح',
        subtitle: 'ملخص الإيرادات والمصروفات',
        columns: [
          { header: 'التاريخ', key: 'date' },
          { header: 'رقم الفاتورة', key: 'invoice_number' },
          { header: 'العميل', key: 'customer' },
          { header: 'الصافي قبل الضريبة', key: 'subtotal' },
          { header: 'الضريبة', key: 'tax' },
          { header: 'الإجمالي', key: 'total' },
        ],
        data: filteredInvoices.map((inv: any) => ({
          date: formatDate(inv.invoice_date),
          invoice_number: inv.invoice_number || '-',
          customer: inv.customer?.name || '-',
          subtotal: `${formatCurrency(Number(inv.subtotal || 0))} ${t.rpt_currency}`,
          tax: `${formatCurrency(Number(inv.tax_amount || 0))} ${t.rpt_currency}`,
          total: `${formatCurrency(Number(inv.total || 0))} ${t.rpt_currency}`,
        })),
        summaryCards: [
          { label: 'صافي الربح', value: `${formatCurrency(invoiceNetProfit)} ${t.rpt_currency}` },
          { label: 'إجمالي الإيرادات', value: `${formatCurrency(invoiceTotalRevenue)} ${t.rpt_currency}` },
          { label: 'إجمالي المصروفات', value: `${formatCurrency(totalGeneralExpenses)} ${t.rpt_currency}` },
        ],
      });
    }
  };

  const isLoading = isCarDealership ? (salesLoading || expensesLoading) : (invoicesLoading || expensesLoading);
  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.rpt_profit_title}</h1>
          <p className="text-muted-foreground">
            {isCarDealership ? `${t.rpt_profit_subtitle} (${labels.itemsName})` : 'ملخص الإيرادات والمصروفات'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
          <Button onClick={handlePrint} className="gap-2"><Printer className="w-4 h-4" />{t.rpt_print_report}</Button>
        </div>
      </div>
      
      {isCarDealership ? (
        <>
          {/* Car Dealership Stats */}
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

          {/* Car Summary */}
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

          {/* Car Sales Table */}
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
        </>
      ) : (
        <>
          {/* Non-Car Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-2xl p-6 card-shadow border-2 border-primary">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center"><TrendingUp className="w-6 h-6 text-white" /></div>
                <div><p className="text-sm text-muted-foreground">صافي الربح</p><p className={`text-2xl font-bold ${invoiceNetProfit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(invoiceNetProfit)} {t.rpt_currency}</p></div>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-6 card-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center"><DollarSign className="w-6 h-6 text-white" /></div>
                <div><p className="text-sm text-muted-foreground">إجمالي الإيرادات</p><p className="text-2xl font-bold">{formatCurrency(invoiceTotalRevenue)} {t.rpt_currency}</p></div>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-6 card-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center"><Building2 className="w-6 h-6 text-white" /></div>
                <div><p className="text-sm text-muted-foreground">عدد الفواتير</p><p className="text-2xl font-bold">{filteredInvoices.length}</p></div>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-6 card-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-destructive flex items-center justify-center"><Receipt className="w-6 h-6 text-white" /></div>
                <div><p className="text-sm text-muted-foreground">إجمالي المصروفات</p><p className="text-2xl font-bold text-destructive">{formatCurrency(totalGeneralExpenses)} {t.rpt_currency}</p></div>
              </div>
            </div>
          </div>

          {/* Non-Car Summary */}
          <div className="bg-card rounded-2xl p-6 card-shadow">
            <h3 className="font-bold mb-4">ملخص الأرباح</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b"><span>إجمالي الإيرادات (قبل الضريبة)</span><span className="font-bold text-success">+ {formatCurrency(invoiceTotalRevenue)} {t.rpt_currency}</span></div>
                <div className="flex justify-between py-2 border-b"><span>إجمالي الضريبة</span><span className="font-bold text-blue-600">{formatCurrency(invoiceTotalTax)} {t.rpt_currency}</span></div>
                <div className="flex justify-between py-2 border-b"><span>إجمالي المصروفات</span><span className="font-bold text-destructive">- {formatCurrency(totalGeneralExpenses)} {t.rpt_currency}</span></div>
                <div className="flex justify-between py-2 bg-muted rounded-lg px-3"><span className="font-bold">صافي الربح</span><span className={`font-bold text-lg ${invoiceNetProfit >= 0 ? 'text-success' : 'text-destructive'}`}>= {formatCurrency(invoiceNetProfit)} {t.rpt_currency}</span></div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">طريقة الحساب</h4>
                <p className="text-sm text-muted-foreground mb-2"><strong>صافي الربح = إجمالي الإيرادات - إجمالي المصروفات</strong></p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>الإيرادات:</strong> مجموع فواتير البيع (الصافي قبل الضريبة)</li>
                  <li>• <strong>المصروفات:</strong> جميع المصروفات العامة المسجلة</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Non-Car Invoice Table */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <div className="p-4 border-b"><h3 className="font-bold">تفاصيل فواتير البيع</h3></div>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد فواتير بيع</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right font-bold">التاريخ</TableHead>
                    <TableHead className="text-right font-bold">رقم الفاتورة</TableHead>
                    <TableHead className="text-right font-bold">العميل</TableHead>
                    <TableHead className="text-right font-bold">الصافي قبل الضريبة</TableHead>
                    <TableHead className="text-right font-bold">الضريبة</TableHead>
                    <TableHead className="text-right font-bold">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                      <TableCell className="font-semibold">{inv.invoice_number || '-'}</TableCell>
                      <TableCell>{inv.customer?.name || '-'}</TableCell>
                      <TableCell>{formatCurrency(Number(inv.subtotal || 0))} {t.rpt_currency}</TableCell>
                      <TableCell className="text-blue-600">{formatCurrency(Number(inv.tax_amount || 0))} {t.rpt_currency}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(Number(inv.total || 0))} {t.rpt_currency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}

      {/* General Expenses Table - shown for both */}
      {filteredGeneralExpenses.length > 0 && (
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          <div className="p-4 border-b"><h3 className="font-bold">{isCarDealership ? t.rpt_profit_general_table : 'تفاصيل المصروفات'}</h3></div>
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
