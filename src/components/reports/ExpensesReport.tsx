import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import { FileText, Download, Printer, Filter, Wallet, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useExpenses, useExpenseCategories } from '@/hooks/useExpenses';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNumberFormat } from '@/hooks/useNumberFormat';

export function ExpensesReport() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: categories = [] } = useExpenseCategories();
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp: any) => {
      if (dateFrom && exp.expense_date < dateFrom) return false;
      if (dateTo && exp.expense_date > dateTo) return false;
      if (categoryFilter !== 'all' && exp.category_id !== categoryFilter) return false;
      if (paymentFilter !== 'all' && exp.payment_method !== paymentFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return exp.description?.toLowerCase().includes(q) || exp.reference_number?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [expenses, dateFrom, dateTo, categoryFilter, paymentFilter, searchQuery]);

  const totalAmount = filteredExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
  const avgAmount = filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    filteredExpenses.forEach((exp: any) => {
      const catId = exp.category_id || 'uncategorized';
      const cat = categories.find((c: any) => c.id === catId);
      const name = cat?.name || (isAr ? 'بدون تصنيف' : 'Uncategorized');
      if (!map[catId]) map[catId] = { name, total: 0, count: 0 };
      map[catId].total += exp.amount || 0;
      map[catId].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredExpenses, categories, isAr]);

  const { decimals } = useNumberFormat();
  const formatNumber = (n: number) => decimals === 0 ? String(Math.round(n)) : n.toFixed(decimals);

  const handlePrint = () => {
    const printContent = document.getElementById('expenses-report-print');
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html dir="rtl"><head><title>تقرير المصروفات</title>
      <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border:1px solid #ddd;padding:8px;text-align:right;font-size:13px}th{background:#f5f5f5;font-weight:bold}
      .summary{display:flex;gap:24px;margin-bottom:16px}.summary-card{padding:12px;border:1px solid #ddd;border-radius:8px;min-width:150px}
      h1{font-size:20px;margin-bottom:8px}</style></head><body>`);
    win.document.write(printContent.innerHTML);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">{isAr ? 'تقرير المصروفات' : 'Expenses Report'}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 me-1" />{isAr ? 'طباعة' : 'Print'}</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{isAr ? 'من تاريخ' : 'From'}</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{isAr ? 'إلى تاريخ' : 'To'}</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{isAr ? 'التصنيف' : 'Category'}</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{isAr ? 'طريقة الدفع' : 'Payment'}</label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="cash">{isAr ? 'نقدي' : 'Cash'}</SelectItem>
                  <SelectItem value="bank">{isAr ? 'تحويل بنكي' : 'Bank'}</SelectItem>
                  <SelectItem value="check">{isAr ? 'شيك' : 'Check'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{isAr ? 'بحث' : 'Search'}</label>
              <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4 text-center">
            <Wallet className="h-5 w-5 text-red-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي المصروفات' : 'Total Expenses'}</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatNumber(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isAr ? 'عدد المصروفات' : 'Count'}</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{filteredExpenses.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isAr ? 'متوسط المصروف' : 'Average'}</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formatNumber(avgAmount)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isAr ? 'التصنيفات' : 'Categories'}</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{categoryBreakdown.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-sm">{isAr ? 'توزيع المصروفات حسب التصنيف' : 'Expenses by Category'}</h3>
            <div className="space-y-2">
              {categoryBreakdown.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{cat.name} <Badge variant="secondary" className="text-[10px] ms-1">{cat.count}</Badge></span>
                  <span className="font-semibold">{formatNumber(cat.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div id="expenses-report-print">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-12">#</TableHead>
                  <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{isAr ? 'الوصف' : 'Description'}</TableHead>
                  <TableHead>{isAr ? 'التصنيف' : 'Category'}</TableHead>
                  <TableHead>{isAr ? 'طريقة الدفع' : 'Payment'}</TableHead>
                  <TableHead>{isAr ? 'المرجع' : 'Reference'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'المبلغ' : 'Amount'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{isAr ? 'لا توجد مصروفات' : 'No expenses found'}</TableCell></TableRow>
                ) : (
                  filteredExpenses.map((exp: any, idx: number) => {
                    const cat = categories.find((c: any) => c.id === exp.category_id);
                    return (
                      <TableRow key={exp.id}>
                        <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>{format(new Date(exp.expense_date), 'yyyy/MM/dd')}</TableCell>
                        <TableCell className="font-medium">{exp.description}</TableCell>
                        <TableCell><Badge variant="outline">{cat?.name || '-'}</Badge></TableCell>
                        <TableCell>{exp.payment_method === 'cash' ? (isAr ? 'نقدي' : 'Cash') : exp.payment_method === 'bank' ? (isAr ? 'بنكي' : 'Bank') : exp.payment_method || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{exp.reference_number || '-'}</TableCell>
                        <TableCell className="text-center font-bold text-red-600">{formatNumber(exp.amount)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
                {filteredExpenses.length > 0 && (
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={6} className="text-start">{isAr ? 'الإجمالي' : 'Total'}</TableCell>
                    <TableCell className="text-center text-red-700">{formatNumber(totalAmount)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
