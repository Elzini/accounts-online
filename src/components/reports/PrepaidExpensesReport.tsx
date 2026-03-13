import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { FileText, Printer, Clock, CheckCircle, Play, AlertCircle, Banknote, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePrepaidExpenses } from '@/hooks/usePrepaidExpenses';
import { useLanguage } from '@/contexts/LanguageContext';

export function PrepaidExpensesReport() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { data: prepaidExpenses = [], isLoading } = usePrepaidExpenses();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExpenses = useMemo(() => {
    return prepaidExpenses.filter((exp: any) => {
      if (statusFilter !== 'all' && exp.status !== statusFilter) return false;
      if (searchQuery) {
        return exp.description?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [prepaidExpenses, statusFilter, searchQuery]);

  const totalAmount = filteredExpenses.reduce((sum: number, exp: any) => sum + (exp.total_amount || 0), 0);
  const totalAmortized = filteredExpenses.reduce((sum: number, exp: any) => sum + (exp.amortized_amount || 0), 0);
  const totalRemaining = filteredExpenses.reduce((sum: number, exp: any) => sum + (exp.remaining_amount || 0), 0);
  const activeCount = filteredExpenses.filter((e: any) => e.status === 'active').length;

  const formatNumber = (n: number) => n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><Play className="h-3 w-3 me-1" />{isAr ? 'نشط' : 'Active'}</Badge>;
      case 'completed': return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><CheckCircle className="h-3 w-3 me-1" />{isAr ? 'مكتمل' : 'Completed'}</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="h-3 w-3 me-1" />{isAr ? 'معلق' : 'Pending'}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('prepaid-report-print');
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html dir="rtl"><head><title>تقرير المصروفات المقدمة</title>
      <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border:1px solid #ddd;padding:8px;text-align:right;font-size:12px}th{background:#f5f5f5;font-weight:bold}
      h1{font-size:20px;margin-bottom:8px}.progress{background:#e5e7eb;height:8px;border-radius:4px;overflow:hidden}
      .progress-bar{background:#10b981;height:100%}</style></head><body>`);
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
          <h2 className="text-xl font-bold">{isAr ? 'تقرير المصروفات المقدمة' : 'Prepaid Expenses Report'}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 me-1" />{isAr ? 'طباعة' : 'Print'}</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{isAr ? 'الحالة' : 'Status'}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="active">{isAr ? 'نشط' : 'Active'}</SelectItem>
                  <SelectItem value="completed">{isAr ? 'مكتمل' : 'Completed'}</SelectItem>
                  <SelectItem value="pending">{isAr ? 'معلق' : 'Pending'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">{isAr ? 'بحث' : 'Search'}</label>
              <Input placeholder={isAr ? 'بحث بالوصف...' : 'Search...'} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <Banknote className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي المبالغ' : 'Total Amount'}</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatNumber(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isAr ? 'المستهلك' : 'Amortized'}</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatNumber(totalAmortized)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isAr ? 'المتبقي' : 'Remaining'}</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formatNumber(totalRemaining)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isAr ? 'نشط' : 'Active'}</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{activeCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div id="prepaid-report-print">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-12">#</TableHead>
                  <TableHead>{isAr ? 'الوصف' : 'Description'}</TableHead>
                  <TableHead>{isAr ? 'تاريخ البداية' : 'Start'}</TableHead>
                  <TableHead>{isAr ? 'تاريخ النهاية' : 'End'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'المدة (شهر)' : 'Months'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'المبلغ الإجمالي' : 'Total'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'الشهري' : 'Monthly'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'المستهلك' : 'Amortized'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'المتبقي' : 'Remaining'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'نسبة الاستهلاك' : 'Progress'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'الحالة' : 'Status'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">{isAr ? 'لا توجد مصروفات مقدمة' : 'No prepaid expenses'}</TableCell></TableRow>
                ) : (
                  filteredExpenses.map((exp: any, idx: number) => {
                    const progress = exp.total_amount > 0 ? (exp.amortized_amount / exp.total_amount) * 100 : 0;
                    return (
                      <TableRow key={exp.id}>
                        <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{exp.description}</TableCell>
                        <TableCell>{format(new Date(exp.start_date), 'yyyy/MM/dd')}</TableCell>
                        <TableCell>{format(new Date(exp.end_date), 'yyyy/MM/dd')}</TableCell>
                        <TableCell className="text-center">{exp.number_of_months}</TableCell>
                        <TableCell className="text-center font-semibold">{formatNumber(exp.total_amount)}</TableCell>
                        <TableCell className="text-center">{formatNumber(exp.monthly_amount)}</TableCell>
                        <TableCell className="text-center text-emerald-600">{formatNumber(exp.amortized_amount)}</TableCell>
                        <TableCell className="text-center text-amber-600 font-semibold">{formatNumber(exp.remaining_amount)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-10">{progress.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(exp.status)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
                {filteredExpenses.length > 0 && (
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={5} className="text-start">{isAr ? 'الإجمالي' : 'Total'}</TableCell>
                    <TableCell className="text-center">{formatNumber(totalAmount)}</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center text-emerald-700">{formatNumber(totalAmortized)}</TableCell>
                    <TableCell className="text-center text-amber-700">{formatNumber(totalRemaining)}</TableCell>
                    <TableCell colSpan={2}></TableCell>
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
